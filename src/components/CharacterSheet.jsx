// src/components/CharacterSheet.jsx

import React, { useState, useMemo } from 'react';
import { useCharacter } from '../hooks/useCharacter.js';
import ModalManager from './ModalManager.jsx';
import FloatingNav from './FloatingNav.jsx';
import ActionButtons from './ActionButtons.jsx';

// NOVAS IMPORTAÇÕES DETALHADAS DOS NOSSOS ARQUIVOS AGRUPADORES
import { CharacterInfo, MainAttributes, Wallet, DiscordIntegration } from './CorePanels.jsx';
import { InventoryList, EquippedItemsList, SkillsList, PerksList, SpecializationsList } from './ListSections.jsx';
import { Story, Notes } from './ContentSections.jsx';

// IMPORTAÇÕES DOS COMPONENTES COMPLEXOS QUE MANTIVEMOS SEPARADOS
import ActionsSection from './ActionsSection.jsx';
import BuffsSection from './BuffsSection.jsx';
import AttributesSection from './AttributesSection.jsx';

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  // --- Toda a lógica interna do CharacterSheet permanece a mesma ---
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
    // ... (lógica inalterada)
  };
  const handleOpenActionModal = (type) => {
    setModalState({ type: 'action', props: { type, title: type === 'heal' ? 'Curar / Restaurar' : 'Receber Dano / Perder', onConfirm: handleConfirmAction, onClose: closeModal } });
  };
  const handleConfirmAction = (amount, target) => {
    // ... (lógica inalterada)
    closeModal();
  };
  const handleOpenRollModal = (attributeId) => {
    const attribute = (character.attributes || []).find(attr => attr.id === attributeId);
    if (attribute) { setModalState({ type: 'rollAttribute', props: { attribute, attributeName: attribute.name, onConfirm: handleConfirmAttributeRoll, onClose: closeModal } }); }
  };
  const handleConfirmAttributeRoll = (dice, bonus) => {
    // ... (lógica inalterada)
    closeModal();
  };
  const handleExecuteFormulaAction = async (actionId) => {
    // ... (lógica inalterada)
  };
  const handleReset = () => {
    setModalState({ type: 'confirm', props: { message: `Tem a certeza que deseja resetar PERMANENTEMENTE a ficha de "${character.name}"?`, onConfirm: async () => { /* ... */ closeModal(); }, onCancel: closeModal } });
  };
  const handleExportJson = () => {
    // ... (lógica inalterada)
  };
  
  if (loading) { return <div className="text-center p-8"><p className="text-xl text-textSecondary">A carregar ficha...</p></div>; }
  if (!character) { return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>; }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <ModalManager modalState={modalState} closeModal={closeModal} />
      <FloatingNav />
      
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-bgSurface hover:opacity-80 text-textPrimary font-bold rounded-lg">
        ← Voltar para a Lista
      </button>

      {/* A ORDEM FINAL E CORRETA DA FICHA, TOTALMENTE SOB NOSSO CONTROLE */}
      <div id="info"><CharacterInfo character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.info} toggleSection={() => toggleSection('info')} /></div>
      <div id="main-attributes"><MainAttributes character={character} onUpdate={updateCharacterField} isMaster={isMaster} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.main} toggleSection={() => toggleSection('main')} /></div>
      <div id="actions"><ActionsSection character={character} isMaster={isMaster} isCollapsed={character.collapsedStates?.actions} toggleSection={() => toggleSection('actions')} onOpenActionModal={handleOpenActionModal} allAttributes={allAttributes} onUpdate={updateCharacterField} onExecuteFormula={handleExecuteFormulaAction} /></div>
      <div id="buffs"><BuffsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} allAttributes={allAttributes} isCollapsed={character.collapsedStates?.buffs} toggleSection={() => toggleSection('buffs')} /></div>
      <div id="attributes"><AttributesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} buffModifiers={buffModifiers.attributes} isCollapsed={character.collapsedStates?.attributes} toggleSection={() => toggleSection('attributes')} onOpenRollModal={handleOpenRollModal} /></div>
      <div id="wallet"><Wallet character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.wallet} toggleSection={() => toggleSection('wallet')} /></div>
      
      {/* Ordem de Listas Corrigida */}
      <div id="inventory"><InventoryList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.inventory} toggleSection={() => toggleSection('inventory')} /></div>
      <div id="equipped"><EquippedItemsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.equipped} toggleSection={() => toggleSection('equipped')} /></div>
      <div id="perks"><PerksList character={character} onUpdate={updateCharacterField} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.perks} toggleSection={() => toggleSection('perks')} /></div>
      <div id="skills"><SkillsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} onShowDiscord={handleShowOnDiscord} isCollapsed={character.collapsedStates?.skills} toggleSection={() => toggleSection('skills')} /></div>
      <div id="specializations"><SpecializationsList character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.specializations} toggleSection={() => toggleSection('specializations')} /></div>

      {/* Seções de Conteúdo */}
      <div id="story"><Story character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.story} toggleSection={() => toggleSection('story')} /></div>
      <div id="notes"><Notes character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.notes} toggleSection={() => toggleSection('notes')} /></div>
      
      {/* Seção Final */}
      <div id="discord"><DiscordIntegration character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.discord} toggleSection={() => toggleSection('discord')} /></div>
      
      <ActionButtons character={character} onExport={handleExportJson} onReset={handleReset} />
    </div>
  );
};

export default CharacterSheet;