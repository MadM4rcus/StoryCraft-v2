import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCharacter } from '@/hooks/useCharacter';
import { useAuth } from '@/hooks/useAuth';
import { useRollFeed } from '@/context/RollFeedContext';
import { useGlobalControls } from '@/context/GlobalControlsContext';
import { useSystem } from '@/context/SystemContext';
import { useEventManager } from '@/context/EventManagerContext';
import ModalManager from '@/components/ModalManager';
import { CharacterInfo, MainAttributes, DiscordIntegration } from './CorePanels';
import { InventoryList, EquippedItemsList, SkillsList, PerksList } from './ListSections';
import SpecializationsList, { PREDEFINED_SKILLS, ATTR_MAP } from './Specializations';
import { Story, Notes } from './ContentSections';
import ActionsSection from './ActionsSection';
import BuffsSection from './BuffsSection';


const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  const { addRollToFeed, addMessageToFeed } = useRollFeed();
  const { user } = useAuth();
  const { isSecretMode } = useGlobalControls();
  const { isEditMode } = useGlobalControls();
  const [totalAttributesMap, setTotalAttributesMap] = useState({});
  const [powerScaleBonus, setPowerScaleBonus] = useState(0);
  const { events, sendActionRequest } = useEventManager();

  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  const allAttributes = useMemo(() => {
    if (!character) return [];
    const mainAttrs = [
        'Iniciativa', 'FA', 'FM', 'FD', 'Acerto', 'MD', 'ME',
        'Força', 'Destreza', 'Constituição', 'Inteligencia', 'Sabedoria', 'Carisma',
        'Fortitude', 'Reflexo', 'Vontade',
    ];
    return mainAttrs;
  }, [character]);

  const buffModifiers = useMemo(() => {
    const modifiers = { attributes: {}, dice: [] };
    if (!character?.buffs) return modifiers;
    character.buffs.forEach(buff => {
      if (buff.isActive && buff.effects) {
        buff.effects.forEach(effect => {
          if (effect.type === 'attribute' && effect.target) {
            const value = parseInt(effect.value, 10) || 0;
            modifiers.attributes[effect.target] = (modifiers.attributes[effect.target] || 0) + value;
          } else if (effect.type === 'dice' && effect.value) {
            modifiers.dice.push({ name: buff.name, value: effect.value });
          }
        });
      }
    });
    return modifiers;
  }, [character?.buffs]);

  const handleShowOnDiscord = async (
      title, 
      description, 
      fields = [], 
      footerText = '', 
      imageUrl = '',
      isRollAction = false
  ) => {
    if (!character) return;

    if (!isRollAction) {
      addMessageToFeed({
        characterName: character.name || 'Narrador',
        title: title,
        description: description || 'Nenhuma descrição.'
      });
    }

    const embed = {
      author: { name: character.name || 'Personagem', icon_url: character.photoUrl || '' },
      title: title || "Sem Título",
      description: description || "Sem Descrição.",
      fields: fields,
      color: 0x7c3aed,
      footer: footerText ? { text: footerText } : undefined,
    };
    if (character.discordWebhookUrl) {
      try {
        await fetch(character.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] })
        });
        if (imageUrl) {
          await fetch(character.discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: imageUrl })
          });
        }
      } catch (e) {
        setModalState({ type: 'info', props: { message: `Falha ao enviar para o Discord: ${e.message}`, onConfirm: closeModal } });
      }
    } else {
      const discordCommand = `**${title || "Sem Título"}**\n${description || "Sem Descrição."}`;
      setModalState({
        type: 'info',
        props: {
          message: 'Webhook do Discord não configurado. Copie e cole no Discord:',
          copyText: discordCommand,
          showCopyButton: true,
          onConfirm: closeModal,
        },
      });
    }
  };
  
  const handleConfirmAction = (amount, target, actionType, isDirectDamage = false) => {
    if (!character?.mainAttributes) return;

    // --- LÓGICA DE EVENTO: Intercepta alterações de HP/MP se estiver em combate ---
    const isInEvent = events.some(event => (event.characters || []).some(c => c.id === character.id));

    console.log(`[CharacterSheet] Tentativa de alteração de ${target}. Em evento? ${isInEvent}.`);

    // Se estiver em evento, envia solicitação para HP ou MP (mesmo se for Mestre, para sincronizar)
    if (isInEvent && (target === 'HP' || target === 'MP' || target === 'HP Bonus')) {
        let effectType = 'damage';
        
        if (target === 'HP Bonus') {
            effectType = actionType === 'heal' ? 'healTemp' : 'damageTemp';
        } else if (actionType === 'heal') {
            effectType = target === 'MP' ? 'healMP' : 'heal';
        } else {
            effectType = target === 'MP' ? 'damageMP' : 'damage';
        }

        const actionName = actionType === 'heal' ? `Recuperar ${target}` : `Dano em ${target}`;

        sendActionRequest({
            action: {
                name: actionName,
                targetEffect: effectType,
                totalResult: amount
            },
            actorId: character.id,
            targetId: character.id // Alvo é o próprio usuário
        });

        setModalState({ type: 'info', props: { message: `Solicitação de ${actionName} enviada para o mestre.`, onConfirm: closeModal } });
        return;
    }
    // -----------------------------------------------------------------------------

    let message = '';
    const charName = character.name || 'Personagem';
    const newMainAttributes = JSON.parse(JSON.stringify(character.mainAttributes));
    const hp = newMainAttributes.hp;
    const mp = newMainAttributes.mp;
    
    if (actionType === 'heal') {
        switch(target) {
            case 'HP': hp.current = Math.min(hp.max, hp.current + amount); message = `${charName} recuperou ${amount} de HP.`; break;
            case 'HP Bonus': hp.temp = (hp.temp || 0) + amount; message = `${charName} recebeu ${amount} de HP Bônus.`; break;
            case 'MP': mp.current = Math.min(mp.max, mp.current + amount); message = `${charName} recuperou ${amount} de MP.`; break;
        }
    } else { // damage
        switch(target) {
            case 'HP':
                let remainingDamage = amount;
                if (isDirectDamage) {
                    hp.current -= remainingDamage;
                    message = `${charName} sofreu ${amount} de dano direto no HP.`;
                } else {
                    const damageToTemp = Math.min(remainingDamage, hp.temp || 0);
                    hp.temp -= damageToTemp;
                    remainingDamage -= damageToTemp;
                    if (remainingDamage > 0) { hp.current -= remainingDamage; }
                    message = `${charName} sofreu ${amount} de dano.`;
                }
                break;
            case 'HP Bonus':
                hp.temp = Math.max(0, (hp.temp || 0) - amount);
                message = `${charName} perdeu ${amount} de HP Bônus.`;
                break;
            case 'MP':
                mp.current = Math.max(0, mp.current - amount);
                message = `${charName} perdeu ${amount} de MP.`;
                break;
        }
    }

    hp.current = Math.max(0, hp.current);

    updateCharacterField('mainAttributes', newMainAttributes);
    handleShowOnDiscord(actionType === 'heal' ? '❤️ Cura / Restauração' : '💥 Dano Sofrido', message);
    closeModal();
  };

  const handleAttributeModification = (attributeName) => {
    setModalState({ type: 'damageHeal', props: { attributeName, onConfirm: handleConfirmAction, onClose: closeModal } });
  };

  const handleSimpleAttributeRoll = (attributeName, totalBonus) => {
    if (!character) return;

    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20Roll === 20;
    const isCritFail = d20Roll === 1;
    const total = isCritFail ? 1 : d20Roll + totalBonus;

    const action = {
        name: `Rolagem de ${attributeName}`,
        acertoResult: {
            roll: d20Roll,
            bonus: totalBonus,
            total: total,
            isCrit: isCrit,
            isCritFail: isCritFail,
            skillName: attributeName,
        },
        discordText: `Rolagem de ${attributeName} (1d20${totalBonus >= 0 ? '+' : ''}${totalBonus})`
    };
    handleExecuteFormulaAction(action);
  };
  
  const handleAttributeClick = (attributeName, attributeValue) => {
      if (['HP', 'HP Bonus', 'MP'].includes(attributeName)) {
          handleAttributeModification(attributeName);
      } else {
          handleSimpleAttributeRoll(attributeName, attributeValue);
      }
  };

  const calculateTotalBonus = useCallback((skillName, character) => {
    const skill = PREDEFINED_SKILLS.find(s => s.name === skillName);
    const skillState = character?.skillSystem?.[skillName];
    if (!skill || !skillState) return 0;    
    
    const selectedAttr = skillState.selectedAttr || skill.attr;
    const attrBonus = totalAttributesMap[selectedAttr] || 0;
    
    const level = character.level || 0;
    let trainingBonus = 0;
    if (skillState.trained) {
        trainingBonus = 2 + Math.floor(level / 10);
    }
    
    const otherBonus = parseInt(skillState.otherBonus, 10) || 0;
    
    return attrBonus + trainingBonus + otherBonus;
  }, [totalAttributesMap, character?.level, character?.skillSystem]);

  const parseAndRollFormula = (formula) => {
    if (!formula) return { total: 0, details: '' };

    let expressionForEval = formula.replace(/\s/g, '');
    let details = formula;

    const diceRegex = /(\d+d\d+)/gi;
    const diceMatches = formula.match(diceRegex);

    if (diceMatches) {
      diceMatches.forEach(diceString => {
        const [numDiceStr, numSidesStr] = diceString.split('d');
        const numDice = parseInt(numDiceStr, 10) || 1;
        const numSides = parseInt(numSidesStr, 10);

        if (isNaN(numSides) || numSides <= 0) return;

        let rolls = [];
        let diceRollResult = 0;
        for (let d = 0; d < numDice; d++) {
          const roll = Math.floor(Math.random() * numSides) + 1;
          rolls.push(roll);
          diceRollResult += roll;
        }
        
        details = details.replace(diceString, `${diceString}(${rolls.join('+')})`);
        expressionForEval = expressionForEval.replace(diceString, `(${diceRollResult})`);
      });
    }

    const total = Math.floor(new Function('return ' + expressionForEval.replace(/[^0-9+\-*/().]/g, ''))());
    return { total, details };
  };

  const handleSendActionRequest = (action, actor, targets) => {
    if (!targets || targets.length === 0) {
        console.error("Erro: Nenhum alvo selecionado.");
        return;
    }

    // Cria um "snapshot" do estado atual do atacante para enviar ao mestre.
    const actorSnapshot = {
      id: actor.id,
      name: actor.name,
      mainAttributes: actor.mainAttributes,
      buffs: (actor.buffs || []).filter(b => b.isActive)
    };

    sendActionRequest({
        action, // A ação já contém todos os resultados e regras (ignoraMD, savingThrow, etc)
        actorSnapshot,
        targetIds: targets.map(t => t.id) // Envia lista de IDs
    });
    closeModal();
    setModalState({ type: 'info', props: { message: `Ação "${action.name}" enviada para o mestre para aprovação.`, onConfirm: closeModal } });
  };

const handleExecuteFormulaAction = async (action) => {
    if (!action) return;

    const isInEvent = events.some(event => (event.characters || []).some(c => c.id === character.id));

    const initialCost = { HP: 0, MP: 0 };
    const actionCostValue = parseInt(action.costValue, 10) || 0;

    if (action.costType && actionCostValue > 0) {
        initialCost[action.costType] += actionCostValue;
    }

    const activeBuffs = (character.buffs || []).filter(b => b.isActive);
    activeBuffs.forEach(buff => {
        if (buff.costType && buff.costValue) {
            const buffCost = parseInt(buff.costValue, 10) || 0;
            if (buffCost > 0) {
                initialCost[buff.costType] += buffCost;
            }
        }
    });

    if (character.mainAttributes.hp.current < initialCost.HP || character.mainAttributes.mp.current < initialCost.MP) {
        setModalState({ type: 'info', props: { message: `Recursos insuficientes! Custo: ${initialCost.HP} HP, ${initialCost.MP} MP.`, onConfirm: closeModal } });
        return;
    }

    let totalResult = action.totalResult ?? 0;

    let acertoResult = action.acertoResult || null;
    let rollResultsForFeed = [];
    let criticals = [];
    const multiplier = action.multiplier || 1;
    
    const getAttributeValue = (attrName) => {
        let attrValue = 0;
        if (!attrName) return 0;
        
        const mainAttrKey = (attrName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (character.mainAttributes && character.mainAttributes.hasOwnProperty(mainAttrKey)) {
            attrValue = (character.mainAttributes[mainAttrKey] || 0);
        } else if (character.mainAttributes && character.mainAttributes.hasOwnProperty(mainAttrKey.toLowerCase())) {
             attrValue = (character.mainAttributes[mainAttrKey.toLowerCase()] || 0);
        }
        
        attrValue += (buffModifiers.attributes[attrName] || 0);
        
        return attrValue;
    };

    const skillRollComp = action.components?.find(c => c.type === 'skillRoll');

    if (skillRollComp && skillRollComp.skill) {
        const isAttackRoll = (action.components || []).length > 1;

        const d20Roll = Math.floor(Math.random() * 20) + 1;
        let skillBonus = calculateTotalBonus(skillRollComp.skill, character);

        if (isAttackRoll) {
            const acertoBonus = getAttributeValue('Acerto');
            skillBonus += acertoBonus;
        }

        const isCrit = d20Roll >= (parseInt(skillRollComp.critMin, 10) || 20);
        const isCritFail = d20Roll === 1;
        const totalAcerto = isCritFail ? 1 : d20Roll + skillBonus;

        acertoResult = {
            roll: d20Roll,
            bonus: skillBonus,
            total: totalAcerto,
            isCrit,
            isCritFail,
            skillName: skillRollComp.skill,
        };

        if (isCrit) {
            criticals.push(`Acerto Crítico no d20 (${d20Roll})!`);
            
            const critFormula = skillRollComp.critFormula || '';
            if (critFormula) {
                const { total: critRollResult, details: critDetails } = parseAndRollFormula(critFormula);
                if (critRollResult > 0) {
                    totalResult += critRollResult;
                    const critDisplay = `Crítico(${critDetails}) = ${critRollResult}`;
                    criticals.push(critDisplay);
                }
            }
        }
    } else if (!acertoResult) {
        const components = action.components || [];
        const hasDiceComponent = components.some(c => c.type === 'dice' || c.type === 'critDice');
        
        if (components.length > 0 && !hasDiceComponent) {
            const roll = Math.floor(Math.random() * 20) + 1;
            totalResult += roll;
            rollResultsForFeed.push({ type: 'dice', value: roll, displayValue: `1d20(${roll})` });
        }
    }

    if (action.totalResult === undefined) {
        for (let i = 0; i < (multiplier || 1); i++) {
            for (const comp of (action.components || [])) {
                if (comp.type === 'attribute') {
                    const attrName = comp.value;
                    const attrValue = getAttributeValue(attrName);
                    totalResult += attrValue;
                    rollResultsForFeed.push({ type: 'attribute', value: attrValue, displayValue: `${attrName}(${attrValue})` });
                }  else if (comp.type === 'dice') {
                    const match = String(comp.value || '').match(/(\d+)d(\d+)/i);
                    if (match) {
                        const numDice = parseInt(match[1], 10);
                        const numSides = parseInt(match[2], 10);
                        let rolls = [];
                        for (let d = 0; d < numDice; d++) {
                            rolls.push(Math.floor(Math.random() * numSides) + 1);
                        }
                        const diceRollResult = rolls.reduce((a, b) => a + b, 0);
                        totalResult += diceRollResult;
                        rollResultsForFeed.push({ type: 'dice', value: diceRollResult, displayValue: `${comp.value}(${rolls.join('+')})` });
                    } else if (!isNaN(parseInt(comp.value, 10))) {
                        const num = parseInt(comp.value, 10) || 0;
                        totalResult += num;
                        rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${num}` });
                    }
                } else if (comp.type === 'number') {
                    const num = parseInt(comp.value, 10) || 0;
                    totalResult += num;
                    const label = comp.label ? `${comp.label}(${num >= 0 ? '+' : ''}${num})` : `${num}`;
                    rollResultsForFeed.push({ type: 'number', value: num, displayValue: label });
                } else if (comp.type === 'skillRoll') {
                }
            }
        }
    }

    buffModifiers.dice.forEach(diceBuff => {
        const match = (diceBuff.value || '').match(/(\d+)d(\d+)/i);
        if (match) {
            const numDice = parseInt(match[1], 10);
            const numSides = parseInt(match[2], 10);
            let rolls = [];
            for (let d = 0; d < numDice; d++) {
                rolls.push(Math.floor(Math.random() * numSides) + 1);
            }
            const diceRollResult = rolls.reduce((a, b) => a + b, 0);
            totalResult += diceRollResult;
            rollResultsForFeed.push({ type: 'dice', value: diceRollResult, displayValue: `${diceBuff.name}(${rolls.join('+')})` });
        } else {
            const num = parseInt(diceBuff.value, 10) || 0;
            totalResult += num;
            rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${diceBuff.name}(${num})` });
        }
    });

    const totalCost = { HP: 0, MP: 0 };
    let costDetails = [];
    const costValue = (action.costType && action.costIsRollResult) ? -totalResult : (parseInt(action.costValue, 10) || 0);

    if (action.costType) {
        if (costValue !== 0) {
            totalCost[action.costType] += costValue;
            costDetails.push(`Ação: ${costValue >= 0 ? '+' : ''}${costValue} ${action.costType}`);
        }
    }
    
    const totalRecovery = { HP: 0, MP: 0 };
    if (action.recoverHP) {
      totalRecovery.HP = totalResult;
      costDetails.push(`Recupera: ${totalResult} HP`);
    }
    if (action.recoverMP) {
      totalRecovery.MP = totalResult;
      costDetails.push(`Recupera: ${totalResult} MP`);
    }

    activeBuffs.forEach(buff => {
        if (buff.costType && buff.costValue !== undefined) {
            const buffCost = parseInt(buff.costValue, 10) || 0;
            if (buffCost !== 0) {
                totalCost[buff.costType] += buffCost;
                costDetails.push(`${buff.name}: ${buffCost >= 0 ? '+' : ''}${buffCost} ${buff.costType}`);
            }
        }
    });

    const urlRegex = /(https?:\/\/[^\s]+)/i;
    let imageUrl = '';
    let descriptionText = action.discordText || '';
    const match = descriptionText.match(urlRegex);
    if (match) {
        imageUrl = match[0];
        descriptionText = descriptionText.replace(urlRegex, '').trim();
    }

    if (totalCost.HP !== 0 || totalCost.MP !== 0 || totalRecovery.HP > 0 || totalRecovery.MP > 0) {
        const newMainAttributes = { ...character.mainAttributes };
        
        newMainAttributes.hp.current = newMainAttributes.hp.current - totalCost.HP + totalRecovery.HP;
        newMainAttributes.mp.current = newMainAttributes.mp.current - totalCost.MP + totalRecovery.MP;

        newMainAttributes.hp.current = Math.min(newMainAttributes.hp.current, newMainAttributes.hp.max);
        newMainAttributes.hp.current = Math.max(newMainAttributes.hp.current, 0);
        newMainAttributes.mp.current = Math.min(newMainAttributes.mp.current, newMainAttributes.mp.max);
        newMainAttributes.mp.current = Math.max(newMainAttributes.mp.current, 0);

        await updateCharacterField('mainAttributes', newMainAttributes);
    }

    let detailsString = rollResultsForFeed.map(r => r.displayValue).join(' + ');
    const detailsTextForFeed = detailsString;
    let discordDescription;

    if (acertoResult && action.totalResult !== undefined && !action.components?.some(c => c.type === 'skillRoll')) {
        const critText = acertoResult.isCrit ? ' 🎯 CRÍTICO!' : acertoResult.isCritFail ? ' 💥 FALHA CRÍTICA!' : '';
        discordDescription = `${descriptionText}\n\n**Resultado: ${acertoResult.total}**${critText}`;
        detailsString = `1d20(${acertoResult.roll}) ${acertoResult.bonus >= 0 ? '+' : '-'} ${Math.abs(acertoResult.bonus)}`;
    } else if (acertoResult) {
        const critText = acertoResult.isCrit ? ' 🎯 CRÍTICO!' : acertoResult.isCritFail ? ' 💥 FALHA CRÍTICA!' : '';
        const acertoString = `**Teste de ${acertoResult.skillName}:** ${acertoResult.total} (d20:${acertoResult.roll} + Bônus:${acertoResult.bonus || 0})${critText}`;
        discordDescription = `${descriptionText}\n${acertoString}\n\n**Dano/Resultado: ${totalResult}**`;
    } else {
        discordDescription = `${descriptionText}\n\n**Resultado Final: ${totalResult}**`;
    }

    const discordFields = [{ name: 'Detalhes da Rolagem', value: detailsString || 'N/A', inline: false }];
    if (criticals.length > 0) {
        discordFields.push({ name: 'Críticos', value: criticals.join('\n'), inline: false });
    }
    if (activeBuffs.length > 0) {
        discordFields.push({ name: 'Buffs Ativos', value: activeBuffs.map(b => b.name).join(', '), inline: false });
    }
    const footerText = costDetails.length > 0 ? `Custo Total: ${costDetails.join(' | ')}` : '';
    
    // --- LÓGICA DE EVENTO: Intercepta Ações com Alvo ---
    // Se estiver em evento e requerer alvo, paramos AQUI.
    // Não enviamos para o Discord nem para o Feed local ainda.
    // O feedback virá do EventManager após aprovação do Mestre.
    if (isInEvent && action.requiresTarget) {
        const actionWithResult = { 
            ...action, 
            totalResult, 
            acertoResult, 
            cost: totalCost,
            detailsText: detailsTextForFeed // Passa os detalhes (fórmula) para o mestre ver
        };
        setModalState({
            type: 'targetSelection',
            props: { action: actionWithResult, actor: character, onConfirm: handleSendActionRequest, onCancel: closeModal },
        });
        return; // <--- RETORNO ANTECIPADO: Impede duplicação no feed
    }

    handleShowOnDiscord(
        action.name, 
        discordDescription, 
        discordFields, 
        footerText, 
        imageUrl,
        true
    );

    // --- LÓGICA DE CUSTO, RECUPERAÇÃO E ALVO ---
    const hasCost = totalCost.HP > 0 || totalCost.MP > 0;
    const hasRecovery = totalRecovery.HP > 0 || totalRecovery.MP > 0;

    // Se estiver em um evento, custos sem alvo (buffs pessoais) também passam por aprovação
    if (isInEvent) {
        // Ação sem alvo, mas com custo (ex: buff pessoal)
        if (hasCost) {
            const costText = [];
            if (totalCost.HP > 0) costText.push(`${totalCost.HP} HP`);
            if (totalCost.MP > 0) costText.push(`${totalCost.MP} MP`);

            sendActionRequest({
                action: { name: `Custo de '${action.name}'`, targetEffect: 'cost', cost: totalCost, totalResult: `Custo: ${costText.join(', ')}` },
                actorId: character.id,
                targetIds: [character.id] // Alvo do custo é o próprio personagem
            });
        }
        // Ação sem alvo, mas com recuperação (ex: poção de cura em si mesmo)
        // CORREÇÃO: Remove o 'else' para permitir que uma ação tenha Custo E Recuperação simultaneamente
        if (hasRecovery) {
            const recoveryAction = {
                name: action.name,
                targetEffect: 'selfHeal',
                recovery: totalRecovery,
                totalResult: totalResult,
                detailsText: detailsTextForFeed,
                costText: footerText,
            };
            sendActionRequest({
                action: recoveryAction,
                actorId: character.id,
                targetIds: [character.id]
            });
        }
    } else {
        // Lógica original para o Mestre ou para quem não está em evento: aplica custos/recuperações diretamente.
        if (hasCost || hasRecovery) {
            const newMainAttributes = { ...character.mainAttributes };
            newMainAttributes.hp.current = newMainAttributes.hp.current - totalCost.HP + totalRecovery.HP;
            newMainAttributes.mp.current = newMainAttributes.mp.current - totalCost.MP + totalRecovery.MP;
            newMainAttributes.hp.current = Math.min(newMainAttributes.hp.current, newMainAttributes.hp.max);
            newMainAttributes.hp.current = Math.max(newMainAttributes.hp.current, 0);
            newMainAttributes.mp.current = Math.min(newMainAttributes.mp.current, newMainAttributes.mp.max);
            newMainAttributes.mp.current = Math.max(newMainAttributes.mp.current, 0);
            await updateCharacterField('mainAttributes', newMainAttributes);
        }
    }

    addRollToFeed({
        characterId: character.id,
        characterName: character.name,
        ownerUid: user.uid,
        rollName: action.name,
        results: rollResultsForFeed,
        totalResult: totalResult,
        acertoResult: acertoResult,
        detailsText: detailsTextForFeed,
        criticals: criticals,
        discordText: descriptionText,
        costText: footerText,
        isSecret: isSecretMode,
        components: action.components || [],
    });
};

  const handleReset = () => {
    setModalState({ type: 'confirm', props: { 
        message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"?`, 
        onConfirm: async () => { 
            const fieldsToReset = { 
                photoUrl: '', age: '', height: '', gender: '', race: '', class: '', alignment: '', 
                level: 1, xp: 0, 
                mainAttributes: { 
                    hp: { current: 10, max: 10, temp: 0 }, mp: { current: 10, max: 10 }, 
                    fa: 0, fm: 0, fd: 0, acerto: 0, me: 0,
                    forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, carisma: 0,
                    fortitude: 0, reflexo: 0, vontade: 0
                }, 
                attributes: [],
                inventory: [], 
                wallet: { zeni: 0, inspiration: 0 },
                fortitude: 0, reflexo: 0, vontade: 0,
                advantages: [], disadvantages: [], abilities: [],
                equippedItems: [], history: [], notes: [], buffs: [], 
                formulaActions: [], 
                discordWebhookUrl: '',
                fortitudeAttr: 'CON',
                reflexoAttr: 'DES',
                vontadeAttr: 'SAB',
                skillSystem: {}
            }; 
            for (const [field, value] of Object.entries(fieldsToReset)) { 
                await updateCharacterField(field, value); 
            } 
            closeModal(); 
        }, 
        onCancel: closeModal 
    } });
  };
  
  const handleExportJson = () => { const { collapsedStates, ...exportData } = character; const jsonString = JSON.stringify(exportData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${character.name || 'ficha'}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); };
  
  if (loading) { return <div className="text-center p-8"><p className="text-xl text-textSecondary">A carregar ficha...</p></div>; }
  if (!character) { return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>; }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
          <ModalManager modalState={modalState} closeModal={closeModal} />
      <div id="info"><CharacterInfo character={character} onUpdate={updateCharacterField} isMaster={isMaster} isEditMode={isEditMode} isCollapsed={character.collapsedStates?.info} toggleSection={() => toggleSection('info')} onPowerScaleUpdate={setPowerScaleBonus} /></div>
      <div id="main-attributes"><MainAttributes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isEditMode={isEditMode} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.main} toggleSection={() => toggleSection('main')} onAttributeRoll={handleAttributeClick} onMapUpdate={setTotalAttributesMap} powerScaleBonus={powerScaleBonus} /></div>
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.actions} toggleSection={() => toggleSection('actions')} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} isEditMode={isEditMode} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.buffs} toggleSection={() => toggleSection('buffs')} isEditMode={isEditMode} /></div>
      <div id="specializations"><SpecializationsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.specializations} toggleSection={() => toggleSection('specializations')} onExecuteFormula={handleExecuteFormulaAction} isEditMode={isEditMode} totalAttributesMap={totalAttributesMap} buffModifiers={buffModifiers.attributes} /></div>
      <div id="perks"><PerksList character={character} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.perks} toggleSection={() => toggleSection('perks')} isEditMode={isEditMode} /></div>      
      <div id="inventory"><InventoryList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.inventory} toggleSection={() => toggleSection('inventory')} isEditMode={isEditMode} /></div>
      <div id="equipped"><EquippedItemsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.equipped} toggleSection={() => toggleSection('equipped')} isEditMode={isEditMode} /></div>
      <div id="skills"><SkillsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.skills} toggleSection={() => toggleSection('skills')} isEditMode={isEditMode} /></div>
      <div id="notes"><Notes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.notes} toggleSection={() => toggleSection('notes')} isEditMode={isEditMode} /></div>
      <div id="story"><Story character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.story} toggleSection={() => toggleSection('story')} isEditMode={isEditMode} /></div>
      <div id="discord"><DiscordIntegration character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.discord} toggleSection={() => toggleSection('discord')} isEditMode={isEditMode} /></div>
      
    </div>
  );
};

export default CharacterSheet;
