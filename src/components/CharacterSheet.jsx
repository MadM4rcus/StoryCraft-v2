// src/components/CharacterSheet.jsx

import React, { useState, useMemo } from 'react';
import { useCharacter } from '../hooks/useCharacter.js';
import ModalManager from './ModalManager.jsx'; // <--- NOVA IMPORTAÇÃO
import FloatingNav from './FloatingNav.jsx';
import CharacterInfoSection from './CharacterInfoSection.jsx';
import MainAttributesSection from './MainAttributesSection.jsx';
import ActionsSection from './ActionsSection.jsx';
import BuffsSection from './BuffsSection.jsx';
import AttributesSection from './AttributesSection.jsx';
import WalletSection from './WalletSection.jsx';
import ListSections from './ListSections.jsx';
import ContentSections from './ContentSections.jsx';
import DiscordIntegrationSection from './DiscordIntegrationSection.jsx';
import ActionButtons from './ActionButtons.jsx';

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  
  // 1. O NOVO ESTADO UNIFICADO PARA MODAIS
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  // ... (useMemo e outras lógicas permanecem iguais)
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

  // 2. FUNÇÕES ATUALIZADAS PARA ABRIR MODAIS
  const handleOpenActionModal = (type) => {
    setModalState({
      type: 'action',
      props: {
        type: type,
        title: type === 'heal' ? 'Curar / Restaurar' : 'Receber Dano / Perder',
        onConfirm: handleConfirmAction,
        onClose: closeModal,
      }
    });
  };
  const handleConfirmAction = (amount, target) => {
    if (!character?.mainAttributes) return;
    let message = '';
    const charName = character.name || 'Personagem';
    const newMainAttributes = JSON.parse(JSON.stringify(character.mainAttributes));
    if (modalState.props.type === 'heal') {
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
    handleShowOnDiscord(modalState.props.type === 'heal' ? '❤️ Cura / Restauração' : '💥 Dano Sofrido', message);
    closeModal(); // Fecha o modal após a ação
  };
  const handleOpenRollModal = (attributeId) => {
    const attribute = (character.attributes || []).find(attr => attr.id === attributeId);
    if (attribute) {
        setModalState({
            type: 'rollAttribute',
            props: {
                attribute: attribute,
                attributeName: attribute.name,
                onConfirm: handleConfirmAttributeRoll,
                onClose: closeModal,
            }
        });
    }
  };
  const handleConfirmAttributeRoll = (dice, bonus) => {
    const { attribute } = modalState.props;
    if (!attribute) return;
    const tempValue = buffModifiers.attributes[attribute.name] || 0;
    const attributeTotal = (attribute.base || 0) + (attribute.perm || 0) + tempValue + (attribute.arma || 0);
    let diceResult = 0;
    let diceDetails = '';
    const match = dice.match(/(\d+)d(\d+)/i);
    if (match) {
        const numDice = parseInt(match[1], 10); const numSides = parseInt(match[2], 10);
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
    handleShowOnDiscord(`Rolagem de ${attribute.name}`, `**Resultado Final: ${finalTotal}**`, [{ name: 'Detalhes', value: details.join(' + '), inline: false }]);
    closeModal();
  };
  const handleExecuteFormulaAction = async (actionId) => {
    // ...lógica de execução da fórmula...
    // Se precisar de um modal (ex: custo insuficiente), use setModalState
  };
  const handleReset = () => {
    setModalState({
      type: 'confirm',
      props: {
        message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"?`,
        onConfirm: async () => {
          const fieldsToReset = { /* ... campos para resetar ... */ };
          for (const [field, value] of Object.entries(fieldsToReset)) {
            await updateCharacterField(field, value);
          }
          closeModal();
        },
        onCancel: closeModal,
      }
    });
  };


  if (loading) { return <div className="text-center p-8"><p className="text-xl text-textSecondary">A carregar ficha...</p></div>; }
  if (!character) { return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>; }
  const sections = { /* ... */ };
  const handleExportJson = () => { /* ... */ };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 3. ÚNICO PONTO DE RENDERIZAÇÃO DE MODAIS */}
      <ModalManager modalState={modalState} closeModal={closeModal} />
      
      <FloatingNav />
      
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-bgSurface hover:opacity-80 text-textPrimary font-bold rounded-lg">
        ← Voltar para a Lista
      </button>

      {/* O resto do JSX da ficha permanece o mesmo */}
      <div id="info"><CharacterInfoSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.info]} toggleSection={() => toggleSection(sections.info)} /></div>
      <div id="main-attributes"><MainAttributesSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.[sections.main]} toggleSection={() => toggleSection(sections.main)} /></div>
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.actions]} toggleSection={() => toggleSection(sections.actions)} onOpenActionModal={handleOpenActionModal} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.[sections.buffs]} toggleSection={() => toggleSection(sections.buffs)} /></div>
      <div id="attributes"><AttributesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.[sections.attributes]} toggleSection={() => toggleSection(sections.attributes)} onOpenRollModal={handleOpenRollModal} /></div>
      <div id="wallet"><WalletSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.wallet]} toggleSection={() => toggleSection(sections.wallet)} /></div>
      <ListSections character={character} isMaster={isMaster} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} collapsedStates={character.collapsedStates} toggleSection={toggleSection} />
      <ContentSections character={character} isMaster={isMaster} onUpdate={updateCharacterField} collapsedStates={character.collapsedStates} toggleSection={toggleSection} />
      <div id="discord"><DiscordIntegrationSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.discord]} toggleSection={() => toggleSection(sections.discord)} /></div>
      <ActionButtons character={character} onExport={handleExportJson} onReset={handleReset} />
    </div>
  );
};

export default CharacterSheet;