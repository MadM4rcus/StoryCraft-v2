import React from 'react';
import { useCharacter } from '../hooks/useCharacter'; // Importa o nosso novo motor
import CharacterInfoSection from './CharacterInfoSection'; // Importa a nova secção

const CharacterSheet = ({ character: initialCharacter, onBack }) => {
  // Usa o motor para obter os dados do personagem em tempo real
  const { character, loading, updateCharacterField } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);

  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-gray-300">A carregar ficha do personagem...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-red-400">Erro: Personagem não encontrado.</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg"
      >
        ← Voltar para a Lista
      </button>

      {/* Renderiza a secção de informações, passando os dados e a função para atualizar */}
      <CharacterInfoSection 
        character={character} 
        onUpdate={updateCharacterField} 
      />

      {/* Outras secções (Atributos, Inventário, etc.) serão adicionadas aqui */}
    </div>
  );
};

export default CharacterSheet;