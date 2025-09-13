import React from 'react';
import { useCharacter } from '../hooks/useCharacter.js';
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
import NotesSection from './NotesSection.jsx'; // <-- Importa a nova secção

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);

  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-gray-300">A carregar ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }

  const sections = {
      info: 'isCharacterInfoCollapsed', main: 'isMainAttributesCollapsed', actions: 'isActionsCollapsed',
      buffs: 'isBuffsCollapsed', attributes: 'isAttributesCollapsed', wallet: 'isWalletCollapsed',
      inventory: 'isInventoryCollapsed', perks: 'isPerksCollapsed', skills: 'isSkillsCollapsed',
      specializations: 'isSpecializationsCollapsed', equipped: 'isEquippedItemsCollapsed',
      story: 'isStoryCollapsed', notes: 'isNotesCollapsed' // <-- Adicionado
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg">
        ← Voltar para a Lista
      </button>

      <CharacterInfoSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.info]} toggleSection={() => toggleSection(sections.info)} />
      <MainAttributesSection character={character} onUpdate={updateCharacterField} isMaster={isMaster} isCollapsed={character.collapsedStates?.[sections.main]} toggleSection={() => toggleSection(sections.main)} />
      <ActionsSection isCollapsed={character.collapsedStates?.[sections.actions]} toggleSection={() => toggleSection(sections.actions)} />
      <BuffsSection isCollapsed={character.collapsedStates?.[sections.buffs]} toggleSection={() => toggleSection(sections.buffs)} />
      <AttributesSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.attributes]} toggleSection={() => toggleSection(sections.attributes)} />
      <WalletSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.wallet]} toggleSection={() => toggleSection(sections.wallet)} />
      <InventorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.inventory]} toggleSection={() => toggleSection(sections.inventory)} />
      <PerksSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.perks]} toggleSection={() => toggleSection(sections.perks)} />
      <SkillsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.skills]} toggleSection={() => toggleSection(sections.skills)} />
      <SpecializationsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.specializations]} toggleSection={() => toggleSection(sections.specializations)} />
      <EquippedItemsSection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.equipped]} toggleSection={() => toggleSection(sections.equipped)} />
      <StorySection character={character} isMaster={isMaster} onUpdate={updateCharacterField} isCollapsed={character.collapsedStates?.[sections.story]} toggleSection={() => toggleSection(sections.story)} />
      
      {/* Nova secção de Anotações adicionada na ordem correta */}
      <NotesSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={character.collapsedStates?.[sections.notes]}
        toggleSection={() => toggleSection(sections.notes)}
      />
    </div>
  );
};

export default CharacterSheet;