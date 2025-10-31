import React, { useState, useMemo } from 'react';
import { useCharacter, useAuth } from '@/hooks';
import { useRollFeed } from '@/context';
import { ModalManager } from '@/components';
import FloatingNav from './FloatingNav';
import ActionButtons from './ActionButtons';
import { CharacterInfo, MainAttributes, Wallet, DiscordIntegration } from './CorePanels';
import { InventoryList, EquippedItemsList, SkillsList, PerksList } from './ListSections';
import SpecializationsList from './Specializations';
import { Story, Notes } from './ContentSections';
import ActionsSection from './ActionsSection';
import BuffsSection from './BuffsSection';


const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  const { addRollToFeed, addMessageToFeed } = useRollFeed();
  const { user } = useAuth();

  // Novo estado para controlar o modo de edição vs. modo de jogo
  const [isEditMode, setIsEditMode] = useState(false);
  const canToggleEditMode = isMaster || (user && user.uid === character?.ownerUid);

  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  const allAttributes = useMemo(() => {
    if (!character) return [];
    // Com a desativação de AttributesSection, a lista de atributos disponíveis
    // para Ações e Buffs agora vem diretamente dos Atributos Principais e de Combate.
    const mainAttrs = [
        'Iniciativa', 'FA', 'FM', 'FD', 'Acerto', 'MD', 'ME',
        'Força', 'Destreza', 'Constituição', 'Inteligencia', 'Sabedoria', 'Carisma',
    ];
    // A lógica para atributos dinâmicos foi removida.
    return mainAttrs;
  }, [character]); // A dependência de character.attributes foi removida.

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

  const handleShowOnDiscord = async (title, description, fields = [], footerText = '', imageUrl = '') => {
    if (!character) return;

    // Adiciona a mensagem ao feed do app
    addMessageToFeed({
      characterName: character.name || 'Narrador',
      // Formata o texto para o feed do app.
      text: `${title}\n${description || 'Nenhuma descrição.'}`
    });

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
  
  const handleConfirmAction = (amount, target, actionType) => {
    if (!character?.mainAttributes) return;
    let message = '';
    const charName = character.name || 'Personagem';
    const newMainAttributes = JSON.parse(JSON.stringify(character.mainAttributes));
    
    if (actionType === 'heal') {
        switch(target) {
            case 'HP': newMainAttributes.hp.current = Math.min(newMainAttributes.hp.max, newMainAttributes.hp.current + amount); message = `${charName} recuperou ${amount} de HP.`; break;
            case 'HP Bonus': newMainAttributes.hp.temp = (newMainAttributes.hp.temp || 0) + amount; message = `${charName} recebeu ${amount} de HP Bonus.`; break;
            case 'MP': newMainAttributes.mp.current = Math.min(newMainAttributes.mp.max, newMainAttributes.mp.current + amount); message = `${charName} recuperou ${amount} de MP.`; break;
        }
    } else { // damage
        switch(target) {
            case 'HP':
                let remainingDamage = amount;
                const damageToTemp = Math.min(remainingDamage, newMainAttributes.hp.temp || 0);
                newMainAttributes.hp.temp -= damageToTemp;
                remainingDamage -= damageToTemp;
                if (remainingDamage > 0) { newMainAttributes.hp.current -= remainingDamage; }
                message = `${charName} perdeu ${amount} de HP.`;
                break;
            case 'MP':
                newMainAttributes.mp.current = Math.max(0, newMainAttributes.mp.current - amount);
                message = `${charName} perdeu ${amount} de MP.`;
                break;
        }
    }
    updateCharacterField('mainAttributes', newMainAttributes);
    handleShowOnDiscord(actionType === 'heal' ? '❤️ Cura / Restauração' : '💥 Dano Sofrido', message);
    closeModal();
  };

  const handleOpenActionModal = (type) => {
    setModalState({
        type: 'action',
        props: {
            type,
            title: type === 'heal' ? 'Curar / Restaurar' : 'Receber Dano / Perder',
            onConfirm: (amount, target) => handleConfirmAction(amount, target, type),
            onClose: closeModal
        }
    });
  };

  // As funções handleOpenRollModal e handleConfirmAttributeRoll foram removidas
  // pois eram usadas exclusivamente pelo AttributesSection.

  const handleSimpleAttributeRoll = (attributeName, attributeValue) => {
    if (!character) return;
    const action = {
        name: `Rolagem de ${attributeName}`,
        components: [
            { type: 'dice', value: '1d20' },
            { type: 'number', value: attributeValue, label: 'Bônus' }
        ],
        discordText: `Rolagem de ${attributeName} (1d20${attributeValue >= 0 ? '+' : ''}${attributeValue})`
    };
    handleExecuteFormulaAction(action);
  };

const handleExecuteFormulaAction = async (action) => {
    if (!action) return;

    let totalResult = 0;
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

    // Adiciona uma rolagem de 1d20 se nenhum dado for especificado, como em rolagens de atributo simples.
    const hasDiceComponent = (action.components || []).some(c => c.type === 'dice' || c.type === 'critDice');
    if (!hasDiceComponent) {
        const roll = Math.floor(Math.random() * 20) + 1;
        totalResult += roll;
        rollResultsForFeed.push({ type: 'dice', value: roll, displayValue: `1d20(${roll})` });
    }

    for (let i = 0; i < multiplier; i++) {
        for (const comp of (action.components || [])) {
            if (comp.type === 'attribute') {
                const attrName = comp.value;
                const attrValue = getAttributeValue(attrName);
                totalResult += attrValue;
                rollResultsForFeed.push({ type: 'attribute', value: attrValue, displayValue: `${attrName}(${attrValue})` });
            } else if (comp.type === 'critDice') {
                const match = String(comp.value || '').match(/(\d+)d(\d+)/i);
                if (match) {
                    const numDice = parseInt(match[1], 10);
                    const numSides = parseInt(match[2], 10);
                    let rolls = [];
                    let diceRollResult = 0;
                    for (let d = 0; d < numDice; d++) {
                        const roll = Math.floor(Math.random() * numSides) + 1;
                        rolls.push(roll);
                        diceRollResult += roll;

                        if (roll >= (comp.critValue || numSides)) {
                            const bonusAttributeValue = getAttributeValue(comp.critBonusAttribute);
                            const totalBonus = bonusAttributeValue * (comp.critBonusMultiplier || 1);
                            diceRollResult += totalBonus;
                            criticals.push(`Crítico no ${roll}! Adiciona ${comp.critBonusAttribute} (${totalBonus})`);
                        }
                    }
                    totalResult += diceRollResult;
                    rollResultsForFeed.push({ type: 'dice', value: diceRollResult, displayValue: `${comp.value}(${rolls.join('+')})` });
                } else {
                    const num = parseInt(comp.value, 10) || 0;
                    totalResult += num;
                    rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${num}` });
                }
            } else if (comp.type === 'dice') {
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
                } else {
                    // Ignora se não for um formato de dado válido
                }
            } else if (comp.type === 'number') {
                const num = parseInt(comp.value, 10) || 0;
                totalResult += num;
                const label = comp.label ? `${comp.label}(${num >= 0 ? '+' : ''}${num})` : `${num}`;
                rollResultsForFeed.push({ type: 'number', value: num, displayValue: label });
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
    const activeBuffs = (character.buffs || []).filter(b => b.isActive);
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

    const totalNegativeCostHP = Math.abs(Math.min(0, totalCost.HP));
    const totalNegativeCostMP = Math.abs(Math.min(0, totalCost.MP));
    if ((character.mainAttributes.hp.current < totalNegativeCostHP) || (character.mainAttributes.mp.current < totalNegativeCostMP)) {
        setModalState({ type: 'info', props: { message: `Custo de HP/MP insuficiente!`, onConfirm: closeModal } });
        return;
    }

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

    const detailsString = rollResultsForFeed.map(r => r.displayValue).join(' + ');
    const discordDescription = `${descriptionText}\n\n**Resultado Final: ${totalResult}**`;
    const discordFields = [{ name: 'Detalhes da Rolagem', value: detailsString || 'N/A', inline: false }];
    if (criticals.length > 0) {
        discordFields.push({ name: 'Críticos', value: criticals.join('\n'), inline: false });
    }
    if (activeBuffs.length > 0) {
        discordFields.push({ name: 'Buffs Ativos', value: activeBuffs.map(b => b.name).join(', '), inline: false });
    }
    const footerText = costDetails.length > 0 ? `Custo Total: ${costDetails.join(' | ')}` : '';
    
    // Envia para o Discord
    handleShowOnDiscord(action.name, discordDescription, discordFields, footerText, imageUrl);

    // Envia para o Feed de Rolagens
    addRollToFeed({
        characterId: character.id,
        characterName: character.name,
        ownerUid: user.uid,
        rollName: action.name,
        results: rollResultsForFeed,
        discordText: descriptionText,
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
                    forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, carisma: 0 
                }, 
                attributes: [], // Mantém limpo pois a seção está desativada
                inventory: [], 
                wallet: { zeni: 0, inspiration: 0 }, 
                advantages: [], disadvantages: [], abilities: [],
                equippedItems: [], history: [], notes: [], buffs: [], 
                formulaActions: [], 
                discordWebhookUrl: '', 
                skillSystem: {} // Reseta o novo sistema de perícias
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
          <FloatingNav character={character} />
          
          <div className="flex justify-between items-center mb-4">
              <button onClick={onBack} className="px-4 py-2 bg-bgSurface hover:opacity-80 text-textPrimary font-bold rounded-lg">
                  ← Voltar para a Lista
              </button>
              {canToggleEditMode && (
                  <button onClick={() => setIsEditMode(!isEditMode)} className="px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg shadow-lg">
                      {isEditMode ? '🔒 Sair do Modo Edição' : '✏️ Entrar no Modo Edição'}
                  </button>
              )}
          </div>

      <div id="info"><CharacterInfo character={character} onUpdate={updateCharacterField} isMaster={isMaster} isEditMode={isEditMode} isCollapsed={character.collapsedStates?.info} toggleSection={() => toggleSection('info')} /></div>
      <div id="main-attributes"><MainAttributes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isEditMode={isEditMode} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.main} toggleSection={() => toggleSection('main')} onAttributeRoll={handleSimpleAttributeRoll} /></div>      
      
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.actions} toggleSection={() => toggleSection('actions')} onOpenActionModal={handleOpenActionModal} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} isEditMode={isEditMode} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.buffs} toggleSection={() => toggleSection('buffs')} isEditMode={isEditMode} /></div>
      <div id="wallet"><Wallet character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.wallet} toggleSection={() => toggleSection('wallet')} isEditMode={isEditMode} /></div>
      
      <div id="inventory"><InventoryList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.inventory} toggleSection={() => toggleSection('inventory')} isEditMode={isEditMode} /></div>
      <div id="equipped"><EquippedItemsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.equipped} toggleSection={() => toggleSection('equipped')} isEditMode={isEditMode} /></div>
      <div id="perks"><PerksList character={character} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.perks} toggleSection={() => toggleSection('perks')} isEditMode={isEditMode} /></div>
      <div id="skills"><SkillsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.skills} toggleSection={() => toggleSection('skills')} isEditMode={isEditMode} /></div>
      
      {/* SpecializationsList agora usa a nova lógica. A prop 'allAttributes' foi removida. */}
      <div id="specializations"><SpecializationsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.specializations} toggleSection={() => toggleSection('specializations')} onExecuteFormula={handleExecuteFormulaAction} isEditMode={isEditMode} /></div>
      {/* O antigo SpecializationsList foi renomeado e agora é a seção de Perícias. O ID foi corrigido para 'skills'. */}
      <div id="skills"><SpecializationsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.skills} toggleSection={() => toggleSection('skills')} onExecuteFormula={handleExecuteFormulaAction} isEditMode={isEditMode} /></div>

      <div id="story"><Story character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.story} toggleSection={() => toggleSection('story')} isEditMode={isEditMode} /></div>
      <div id="notes"><Notes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.notes} toggleSection={() => toggleSection('notes')} isEditMode={isEditMode} /></div>
      
      <div id="discord"><DiscordIntegration character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.discord} toggleSection={() => toggleSection('discord')} isEditMode={isEditMode} /></div>
      
      <ActionButtons character={character} onExport={handleExportJson} onReset={handleReset} />
    </div>
  );
};

export default CharacterSheet;
