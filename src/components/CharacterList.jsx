import React from 'react';
import { useCharacter } from '../hooks/useCharacter';
import CharacterInfoSection from './CharacterInfoSection';
import MainAttributesSection from './MainAttributesSection';
import ActionsSection from './ActionsSection';
import BuffsSection from './BuffsSection';
import AttributesSection from './AttributesSection'; // <-- Importa a nova secção de Atributos

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  const { character, loading, updateCharacterField, useCollapsibleState } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
  
  const [collapsedSections, toggleSection] = useCollapsibleState({
      isCharacterInfoCollapsed: false,
      isMainAttributesCollapsed: false,
      isActionsCollapsed: true,
      isBuffsCollapsed: true,
      isAttributesCollapsed: false, // Começa aberta por defeito
  });

  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-gray-300">A carregar ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }

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

      {/* A nova secção é adicionada aqui */}
      <AttributesSection
        character={character}
        isMaster={isMaster}
        onUpdate={updateCharacterField}
        isCollapsed={collapsedSections.isAttributesCollapsed}
        toggleSection={() => toggleSection('isAttributesCollapsed')}
      />

      <ActionsSection 
        isCollapsed={collapsedSections.isActionsCollapsed}
        toggleSection={() => toggleSection('isActionsCollapsed')}
      />
      <BuffsSection
        isCollapsed={collapsedSections.isBuffsCollapsed}
        toggleSection={() => toggleSection('isBuffsCollapsed')}
      />

    </div>
  );
};

export default CharacterSheet;