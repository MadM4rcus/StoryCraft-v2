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
import AttributesSection from './AttributesSection';


const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  const { addRollToFeed } = useRollFeed();
  const { user } = useAuth();

  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  const allAttributes = useMemo(() => {
    if (!character) return [];
    const mainAttrs = ['Iniciativa', 'FA', 'FM', 'FD'];
    const dynamicAttrs = (character.attributes || []).map(attr => attr.name).filter(Boolean);
    return [...mainAttrs, ...dynamicAttrs];
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

  const handleShowOnDiscord = async (title, description, fields = [], footerText = '', imageUrl = '') => {
    if (!character) return;
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

  const handleOpenRollModal = (attributeId) => {
    const attribute = (character.attributes || []).find(attr => attr.id === attributeId);
    if (attribute) {
        setModalState({
            type: 'rollAttribute',
            props: {
                attributeName: attribute.name,
                onConfirm: (dice, bonus) => handleConfirmAttributeRoll(dice, bonus, attribute),
                onClose: closeModal
            }
      });
    }
  };

  const handleConfirmAttributeRoll = (dice, bonus, attribute) => {
    if (!attribute) return;
    const tempValue = buffModifiers.attributes[attribute.name] || 0;
    const attributeTotal = (attribute.base || 0) + (attribute.perm || 0) + tempValue + (attribute.arma || 0);
    let diceResult = 0;
    let rollResultsForFeed = [];

    const match = dice.match(/(\d+)d(\d+)/i);
    if (match) {
        const numDice = parseInt(match[1], 10); const numSides = parseInt(match[2], 10);
        let rolls = [];
        for (let d = 0; d < numDice; d++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
        }
        diceResult = rolls.reduce((a, b) => a + b, 0);
        rollResultsForFeed.push({ type: 'dice', value: diceResult, displayValue: `${dice}(${rolls.join('+')})` });
    } else {
        diceResult = parseInt(dice, 10) || 0;
        rollResultsForFeed.push({ type: 'dice', value: diceResult, displayValue: `${diceResult}` });
    }

    rollResultsForFeed.push({ type: 'attribute', value: attributeTotal, displayValue: `${attribute.name}(${attributeTotal})` });
    if (bonus !== 0) {
        rollResultsForFeed.push({ type: 'modifier', value: bonus, displayValue: `Bónus(${bonus > 0 ? '+' : ''}${bonus})` });
    }

    const finalTotal = diceResult + attributeTotal + bonus;
    const detailsString = rollResultsForFeed.map(r => r.displayValue).join(' + ');
    const discordDescription = `**Resultado Final: ${finalTotal}**`;

    // Envia para o Discord
    handleShowOnDiscord(`Rolagem de ${attribute.name}`, discordDescription, [{ name: 'Detalhes', value: detailsString, inline: false }]);
    
    // Envia para o Feed de Rolagens
    addRollToFeed({
      characterId: character.id,
      characterName: character.name,
      ownerUid: user.uid,
      rollName: `Rolagem de ${attribute.name}`,
      results: rollResultsForFeed,
      discordText: discordDescription,
    });

    closeModal();
  };

const handleExecuteFormulaAction = async (action) => {
    if (!action) return;

    let totalResult = 0;
    let rollResultsForFeed = [];
    let criticals = [];
    const multiplier = action.multiplier || 1;

    for (let i = 0; i < multiplier; i++) {
        for (const comp of (action.components || [])) {
            if (comp.type === 'attribute') {
                const attrName = comp.value;
                let attrValue = 0;
                if (['Iniciativa', 'FA', 'FM', 'FD'].includes(attrName)) {
                    attrValue = (character.mainAttributes[attrName.toLowerCase()] || 0) + (buffModifiers.attributes[attrName] || 0);
                } else {
                    const dynamicAttr = (character.attributes || []).find(a => a.name === attrName);
                    if (dynamicAttr) { attrValue = (dynamicAttr.base || 0) + (dynamicAttr.perm || 0) + (dynamicAttr.arma || 0) + (buffModifiers.attributes[attrName] || 0); }
                }
                totalResult += attrValue;
                rollResultsForFeed.push({ type: 'attribute', value: attrValue, displayValue: `${attrName}(${attrValue})` });
            } else if (comp.type === 'critDice') { // Novo tipo: Dado Crítico
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
                            let bonusAttributeValue = 0;
                            const bonusAttrName = comp.critBonusAttribute;
                            if (['Iniciativa', 'FA', 'FM', 'FD'].includes(bonusAttrName)) {
                                bonusAttributeValue = (character.mainAttributes[bonusAttrName.toLowerCase()] || 0) + (buffModifiers.attributes[bonusAttrName] || 0);
                            } else {
                                const bonusAttr = (character.attributes || []).find(a => a.name === bonusAttrName);
                                if (bonusAttr) { bonusAttributeValue = (bonusAttr.base || 0) + (bonusAttr.perm || 0) + (bonusAttr.arma || 0) + (buffModifiers.attributes[bonusAttrName] || 0); }
                            }
                            const totalBonus = bonusAttributeValue * (comp.critBonusMultiplier || 1);
                            diceRollResult += totalBonus;
                            criticals.push(`Crítico no ${roll}! Adiciona ${bonusAttrName} (${totalBonus})`);
                        }
                    }
                    totalResult += diceRollResult;
                    rollResultsForFeed.push({ type: 'dice', value: diceRollResult, displayValue: `${comp.value}(${rolls.join('+')})` });
                } else {
                    const num = parseInt(comp.value, 10) || 0;
                    totalResult += num;
                    rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${num}` });
                }
            } else { // dice (dado comum) ou number
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
                    const num = parseInt(comp.value, 10) || 0;
                    totalResult += num;
                    
                    if (comp.label) {
                        rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${comp.label}(${num >= 0 ? '+' : ''}${num})` });
                    } else {
                        rollResultsForFeed.push({ type: 'number', value: num, displayValue: `${num}` });
                    }
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
    setModalState({ type: 'confirm', props: { message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"?`, onConfirm: async () => { const fieldsToReset = { photoUrl: '', age: '', height: '', gender: '', race: '', class: '', alignment: '', level: 1, xp: 0, mainAttributes: { hp: { current: 10, max: 10, temp: 0 }, mp: { current: 10, max: 10 }, initiative: 0, fa: 0, fm: 0, fd: 0 }, attributes: [], inventory: [], wallet: { zeni: 0, inspiration: 0 }, advantages: [], disadvantages: [], abilities: [], specializations: [], equippedItems: [], history: [], notes: [], buffs: [], formulaActions: [], discordWebhookUrl: '', }; for (const [field, value] of Object.entries(fieldsToReset)) { await updateCharacterField(field, value); } closeModal(); }, onCancel: closeModal } });
  };
  
  const handleExportJson = () => { const { collapsedStates, ...exportData } = character; const jsonString = JSON.stringify(exportData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${character.name || 'ficha'}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); };
  
  if (loading) { return <div className="text-center p-8"><p className="text-xl text-textSecondary">A carregar ficha...</p></div>; }
  if (!character) { return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>; }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
          <ModalManager modalState={modalState} closeModal={closeModal} />
          <FloatingNav character={character} />
          
          <button onClick={onBack} className="mb-4 px-4 py-2 bg-bgSurface hover:opacity-80 text-textPrimary font-bold rounded-lg">        ← Voltar para a Lista
      </button>

      <div id="info"><CharacterInfo character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.info} toggleSection={() => toggleSection('info')} /></div>
      <div id="main-attributes"><MainAttributes character={character} onUpdate={updateCharacterField} isMaster={isMaster} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.main} toggleSection={() => toggleSection('main')} /></div>
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.actions} toggleSection={() => toggleSection('actions')} onOpenActionModal={handleOpenActionModal} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.buffs} toggleSection={() => toggleSection('buffs')} /></div>
      <div id="attributes"><AttributesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.attributes} toggleSection={() => toggleSection('attributes')} onOpenRollModal={handleOpenRollModal} /></div>
      <div id="wallet"><Wallet character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.wallet} toggleSection={() => toggleSection('wallet')} /></div>
      
      <div id="inventory"><InventoryList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.inventory} toggleSection={() => toggleSection('inventory')} /></div>
      <div id="equipped"><EquippedItemsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.equipped} toggleSection={() => toggleSection('equipped')} /></div>
      <div id="perks"><PerksList character={character} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.perks} toggleSection={() => toggleSection('perks')} /></div>
      <div id="skills"><SkillsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.skills} toggleSection={() => toggleSection('skills')} /></div>
      <div id="specializations"><SpecializationsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.specializations} toggleSection={() => toggleSection('specializations')} allAttributes={allAttributes} onExecuteFormula={handleExecuteFormulaAction} /></div>

      <div id="story"><Story character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.story} toggleSection={() => toggleSection('story')} /></div>
      <div id="notes"><Notes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.notes} toggleSection={() => toggleSection('notes')} /></div>
      
      <div id="discord"><DiscordIntegration character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.discord} toggleSection={() => toggleSection('discord')} /></div>
      
      <ActionButtons character={character} onExport={handleExportJson} onReset={handleReset} />
    </div>
  );
};

export default CharacterSheet;