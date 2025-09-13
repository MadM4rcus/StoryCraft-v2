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
import SkillsSection from './SkillsSection.jsx'; // <-- Importa a nova secção

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, useCollapsibleState } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  
  const [collapsedSections, toggleSection] = useCollapsibleState({
      isCharacterInfoCollapsed: false,
      isMainAttributesCollapsed: false,
      isActionsCollapsed: true,
      isBuffsCollapsed: true,
      isAttributesCollapsed: false,
      isWalletCollapsed: false,
      isInventoryCollapsed: false,
      isPerksCollapsed: false,
      isSkillsCollapsed: false, // <-- Adicionado, começa aberta
  });

  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-gray-300">A carregar ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }

  // A ordem dos componentes agora reflete a do V1
  return (
    <div className="w-full max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg"
      >
        ← Voltar para a Lista
      </button>

      <CharacterInfoSection 
        character={character} 
        onUpdate={updateCharacterField}
        isMaster={isMaster}
        isCollapsed={collapsedSections.isCharacterInfoCollapsed}
        toggleSection={() => toggleSection('isCharacterInfoCollapsed')}
      />
      <MainAttributesSection 
        character={character}
        onUpdate={updateCharacterField}
        isMaster={isMaster}
        isCollapsed={collapsedSections.isMainAttributesCollapsed}
        toggleSection={() => toggleSection('isMainAttributesCollapsed')}
      />
      <ActionsSection 
        isCollapsed={collapsedSections.isActionsCollapsed}
        toggleSection={() => toggleSection('isActionsCollapsed')}
      />
      <BuffsSection
        isCollapsed={collapsedSections.isBuffsCollapsed}
        toggleSection={() => toggleSection('isBuffsCollapsed')}
      />
      <AttributesSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isAttributesCollapsed}
        toggleSection={() => toggleSection('isAttributesCollapsed')}
      />
      <WalletSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isWalletCollapsed}
        toggleSection={() => toggleSection('isWalletCollapsed')}
      />
      <InventorySection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isInventoryCollapsed}
        toggleSection={() => toggleSection('isInventoryCollapsed')}
      />
      <PerksSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isPerksCollapsed}
        toggleSection={() => toggleSection('isPerksCollapsed')}
      />
      {/* Nova secção de Habilidades adicionada na ordem correta */}
      <SkillsSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isSkillsCollapsed}
        toggleSection={() => toggleSection('isSkillsCollapsed')}
      />
    </div>
  );
};

export default CharacterSheet;