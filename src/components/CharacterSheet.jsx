import React, { useState, useMemo } from 'react';
import { useCharacter } from '../hooks/useCharacter.js';
import Modal from './Modal.jsx';
import ActionModal from './ActionModal.jsx';
import RollAttributeModal from './RollAttributeModal.jsx';
import FloatingNav from './FloatingNav.jsx';
import CharacterInfoSection from './CharacterInfoSection.jsx';
import MainAttributesSection from './MainAttributesSection.jsx';
import ActionsSection from './ActionsSection.jsx';
import BuffsSection from './BuffsSection.jsx';
import AttributesSection from './AttributesSection.jsx';
import WalletSection from './WalletSection.jsx';
import InventorySection from './InventorySection.jsx';
import PerksSection from './PerksSection.jsx';
import SkillsSection from './SkillsSection.jsx';
import SpecializationsSection from './SpecializationsSection.jsx';
import EquippedItemsSection from './EquippedItemsSection.jsx';
import StorySection from './StorySection.jsx';
import NotesSection from './NotesSection.jsx';
import DiscordIntegrationSection from './DiscordIntegrationSection.jsx';
import ActionButtons from './ActionButtons.jsx';

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  const [modal, setModal] = useState({ isVisible: false });
  const [actionModal, setActionModal] = useState({ isVisible: false, type: '' });
  const [rollModal, setRollModal] = useState({ isVisible: false, attribute: null });

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
      if (buff.isActive && buff.target && buff.type === 'attribute') {
        const value = parseInt(buff.value, 10) || 0;
        modifiers.attributes[buff.target] = (modifiers.attributes[buff.target] || 0) + value;
      } else if (buff.isActive && buff.value && buff.type === 'dice') {
        modifiers.dice.push({ name: buff.name, value: buff.value });
      }
    });
    return modifiers;
  }, [character?.buffs]);

  const handleShowOnDiscord = async (title, description, fields = [], footerText = '') => {
    if (!character) return;
    const embed = {
      author: { name: character.name || 'Personagem', icon_url: character.photoUrl || 'https://placehold.co/64x64/7c3aed/FFFFFF?text=SC' },
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
      } catch (e) {
        setModal({ isVisible: true, message: `Falha ao enviar para o Discord: ${e.message}`, type: 'info', onConfirm: () => setModal({ isVisible: false }) });
      }
    } else {
      const discordCommand = `**${title || "Sem Título"}**\n${description || "Sem Descrição."}`;
      setModal({
        isVisible: true,
        message: 'Webhook do Discord não configurado. Copie e cole no Discord:',
        type: 'info', copyText: discordCommand, showCopyButton: true,
        onConfirm: () => setModal({ isVisible: false }),
      });
    }
  };

  const handleOpenActionModal = (type) => setActionModal({ isVisible: true, type });

  const handleConfirmAction = (amount, target) => {
    if (!character?.mainAttributes) return;
    let message = '';
    const charName = character.name || 'Personagem';
    const newMainAttributes = JSON.parse(JSON.stringify(character.mainAttributes));

    if (actionModal.type === 'heal') {
        switch(target) {
            case 'HP': newMainAttributes.hp.current = Math.min(newMainAttributes.hp.max, newMainAttributes.hp.current + amount); message = `${charName} recuperou ${amount} de HP.`; break;
            case 'HP Bonus': newMainAttributes.hp.temp = (newMainAttributes.hp.temp || 0) + amount; message = `${charName} recebeu ${amount} de HP Bonus.`; break;
            case 'MP': newMainAttributes.mp.current = Math.min(newMainAttributes.mp.max, newMainAttributes.mp.current + amount); message = `${charName} recuperou ${amount} de MP.`; break;
            default: break;
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
            default: break;
        }
    }
    
    updateCharacterField('mainAttributes', newMainAttributes);
    handleShowOnDiscord(actionModal.type === 'heal' ? '❤️ Cura / Restauração' : '💥 Dano Sofrido', message);
  };
  
  const handleExecuteFormulaAction = async (actionId) => {
    const action = (character.formulaActions || []).find(a => a.id === actionId);
    if (!action) return;
    let totalCost = { HP: 0, MP: 0 };
    let costDetails = [];
    const activeBuffs = (character.buffs || []).filter(b => b.isActive);
    if (action.costType && action.costValue > 0) {
        totalCost[action.costType] += action.costValue;
        costDetails.push(`Ação: ${action.costValue} ${action.costType}`);
    }
    activeBuffs.forEach(buff => {
        if(buff.costType && buff.costValue > 0) {
            totalCost[buff.costType] += buff.costValue;
            costDetails.push(`${buff.name}: ${buff.costValue} ${buff.costType}`);
        }
    });
    if (character.mainAttributes.hp.current < totalCost.HP || character.mainAttributes.mp.current < totalCost.MP) {
        setModal({ isVisible: true, message: `Custo de HP/MP insuficiente!`, type: 'info', onConfirm: () => setModal({ isVisible: false }) });
        return;
    }
    let totalResult = 0;
    let rollDetails = [];
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
                    if (dynamicAttr) {
                        attrValue = (dynamicAttr.base || 0) + (dynamicAttr.perm || 0) + (dynamicAttr.arma || 0) + (buffModifiers.attributes[attrName] || 0);
                    }
                }
                totalResult += attrValue;
                rollDetails.push(`${attrName}(${attrValue})`);
            } else { // dice
                const match = (comp.value || '').match(/(\d+)d(\d+)/i);
                if (match) {
                    const numDice = parseInt(match[1], 10); const numSides = parseInt(match[2], 10);
                    let rolls = [];
                    for (let d = 0; d < numDice; d++) {
                        const roll = Math.floor(Math.random() * numSides) + 1;
                        rolls.push(roll);
                        totalResult += roll;
                    }
                    rollDetails.push(`${comp.value}(${rolls.join('+')})`);
                } else {
                    const num = parseInt(comp.value, 10) || 0;
                    totalResult += num;
                    rollDetails.push(`${num}`);
                }
            }
        }
    }
    activeBuffs.forEach(buff => {
        if (buff.type === 'dice' && buff.value) {
            const match = (buff.value || '').match(/(\d+)d(\d+)/i);
            if (match) {
                const numDice = parseInt(match[1], 10); const numSides = parseInt(match[2], 10);
                let rolls = [];
                for (let d = 0; d < numDice; d++) {
                    const roll = Math.floor(Math.random() * numSides) + 1;
                    rolls.push(roll);
                    totalResult += roll;
                }
                rollDetails.push(`${buff.name}(${rolls.join('+')})`);
            } else {
                const num = parseInt(buff.value, 10) || 0;
                totalResult += num;
                rollDetails.push(`${buff.name}(${num})`);
            }
        }
    });
    if (totalCost.HP > 0 || totalCost.MP > 0) {
      const newMainAttributes = { ...character.mainAttributes };
      newMainAttributes.hp.current -= totalCost.HP;
      newMainAttributes.mp.current -= totalCost.MP;
      await updateCharacterField('mainAttributes', newMainAttributes);
    }
    const discordFields = [ { name: 'Detalhes da Rolagem', value: rollDetails.join(' + ') || 'N/A', inline: false } ];
    if (activeBuffs.length > 0) {
        discordFields.push({ name: 'Buffs Ativos', value: activeBuffs.map(b => b.name).join(', '), inline: false });
    }
    const footerText = costDetails.length > 0 ? `Custo Total: ${costDetails.join(' | ')}` : '';
    handleShowOnDiscord(action.name, `${action.discordText || ''}\n\n**Resultado Final: ${totalResult}**`, discordFields, footerText);
  };

  const handleOpenRollModal = (attributeId) => {
    const attribute = (character.attributes || []).find(attr => attr.id === attributeId);
    if (attribute) {
        setRollModal({ isVisible: true, attribute: attribute });
    }
  };

  const handleConfirmAttributeRoll = (dice, bonus) => {
    if (!rollModal.attribute) return;
    
    const attribute = rollModal.attribute;
    const tempValue = buffModifiers.attributes[attribute.name] || 0;
    const attributeTotal = (attribute.base || 0) + (attribute.perm || 0) + tempValue + (attribute.arma || 0);

    let diceResult = 0;
    let diceDetails = '';
    
    const match = dice.match(/(\d+)d(\d+)/i);
    if (match) {
        const numDice = parseInt(match[1], 10);
        const numSides = parseInt(match[2], 10);
        let rolls = [];
        for (let d = 0; d < numDice; d++) {
            const roll = Math.floor(Math.random() * numSides) + 1;
            rolls.push(roll);
            diceResult += roll;
        }
        diceDetails = `${dice}(${rolls.join('+')})`;
    } else {
        diceResult = parseInt(dice, 10) || 0;
        diceDetails = `${diceResult}`;
    }
    
    const finalTotal = diceResult + attributeTotal + bonus;
    
    const details = [diceDetails, `${attribute.name}(${attributeTotal})`];
    if (bonus !== 0) {
        details.push(`Bónus(${bonus > 0 ? '+' : ''}${bonus})`);
    }

    handleShowOnDiscord(
        `Rolagem de ${attribute.name}`, 
        `**Resultado Final: ${finalTotal}**`,
        [{ name: 'Detalhes', value: details.join(' + '), inline: false }]
    );
    
    setRollModal({ isVisible: false, attribute: null });
  };


  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-gray-300">A carregar ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }
  
  const sections = {
    info: 'info', main: 'mainAttributes', actions: 'actions',
    buffs: 'buffs', attributes: 'attributes', wallet: 'wallet',
    inventory: 'inventory', perks: 'perks', skills: 'skills',
    specializations: 'specializations', equipped: 'equipped', discord: 'discord',
    story: 'story', notes: 'notes'
  };

  const handleExportJson = () => {
    const { collapsedStates, ...exportData } = character;
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${character.name || 'ficha'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleReset = () => {
    setModal({
      isVisible: true,
      message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        const fieldsToReset = {
          photoUrl: '', age: '', height: '', gender: '', race: '', class: '', alignment: '', level: 1, xp: 0,
          mainAttributes: { hp: { current: 10, max: 10, temp: 0 }, mp: { current: 10, max: 10 }, initiative: 0, fa: 0, fm: 0, fd: 0 },
          attributes: [], inventory: [], wallet: { zeni: 0, inspiration: 0 }, advantages: [], disadvantages: [], abilities: [],
          specializations: [], equippedItems: [], history: [], notes: [], buffs: [], formulaActions: [],
          discordWebhookUrl: '',
        };
        for (const [field, value] of Object.entries(fieldsToReset)) {
          await updateCharacterField(field, value);
        }
        setModal({ isVisible: false });
      },
      onCancel: () => setModal({ isVisible: false }),
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FloatingNav />
      {modal.isVisible && <Modal {...modal} onCancel={() => setModal({ isVisible: false })} />}
      {actionModal.isVisible && <ActionModal type={actionModal.type} title={actionModal.type === 'heal' ? 'Curar / Restaurar' : 'Receber Dano / Perder'} onConfirm={handleConfirmAction} onClose={() => setActionModal({ isVisible: false, type: '' })} />}
      {rollModal.isVisible && <RollAttributeModal attributeName={rollModal.attribute.name} onConfirm={handleConfirmAttributeRoll} onClose={() => setRollModal({ isVisible: false, attribute: null })} />}
      
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg">
        ← Voltar para a Lista
      </button>

      <div id="info"><CharacterInfoSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.info]} toggleSection={() => toggleSection(sections.info)} /></div>
      <div id="main-attributes"><MainAttributesSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.[sections.main]} toggleSection={() => toggleSection(sections.main)} /></div>
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.actions]} toggleSection={() => toggleSection(sections.actions)} onOpenActionModal={handleOpenActionModal} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.[sections.buffs]} toggleSection={() => toggleSection(sections.buffs)} /></div>
      <div id="attributes">
        <AttributesSection 
            character={character} isMaster={isMaster} onUpdate={updateCharacterField} 
            buffModifiers={buffModifiers.attributes} 
            isCollapsed={character.collapsedStates?.[sections.attributes]} 
            toggleSection={() => toggleSection(sections.attributes)}
            onOpenRollModal={handleOpenRollModal}
        />
      </div>
      <div id="wallet"><WalletSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.wallet]} toggleSection={() => toggleSection(sections.wallet)} /></div>
      <div id="inventory"><InventorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.inventory]} toggleSection={() => toggleSection(sections.inventory)} /></div>
      <div id="perks"><PerksSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.perks]} toggleSection={() => toggleSection(sections.perks)} /></div>
      <div id="skills"><SkillsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.skills]} toggleSection={() => toggleSection(sections.skills)} /></div>
      <div id="specializations"><SpecializationsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.specializations]} toggleSection={() => toggleSection(sections.specializations)} /></div>
      <div id="equipped"><EquippedItemsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.[sections.equipped]} toggleSection={() => toggleSection(sections.equipped)} /></div>
      <div id="story"><StorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.story]} toggleSection={() => toggleSection(sections.story)} /></div>
      <div id="notes"><NotesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.notes]} toggleSection={() => toggleSection(sections.notes)} /></div>
      <div id="discord"><DiscordIntegrationSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.discord]} toggleSection={() => toggleSection(sections.discord)} /></div>
      
      <ActionButtons character={character} onExport={handleExportJson} onReset={handleReset} />
    </div>
  );
};

export default CharacterSheet;