// src/systems/storycraft_v2/ClassicSheet.jsx

import React, { useState } from 'react';
// 1. CORRIGIDO: O import precisa apontar para o arquivo .js
import { useCharacter } from '@/hooks/useCharacter'; 
// 2. CORRIGIDO: O import precisa apontar para o componente .jsx
import ModalManager from '@/components/ModalManager'; 

// 3. CORRIGIDO: O nome do arquivo de background
import bgImage from '@/package/storycraft-bg-classic.png'; 
import ClassicHeader from './ClassicHeader'; // Nosso primeiro componente de UI

// Importar o CSS para os inputs
import './classicSheetStyles.css';

const ClassicSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  // Conectar a lógica de dados da V1
  const { character, loading, updateCharacterField, toggleSection } = useCharacter(
    initialCharacter.id,
    initialCharacter.ownerUid
  );
  
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  if (loading) {
    return <div className="text-center p-8"><p className="text-xl text-textSecondary">Carregando ficha...</p></div>;
  }
  if (!character) {
    return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>;
  }

  // A função de atualização que passaremos para os filhos
  const handleUpdate = (fieldName, value) => {
    updateCharacterField(fieldName, value);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <ModalManager modalState={modalState} closeModal={closeModal} />
      <button 
        onClick={onBack} 
        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg mb-4"
      >
        ← Voltar para a Lista (V2)
      </button>

      {/* --- O PALCO PRINCIPAL --- */}
      <div
        className="w-full"
        style={{
          position: 'relative',
          // Usamos a proporção da imagem de referência (827x1170)
          aspectRatio: '827 / 1170', 
          backgroundImage: `url(${bgImage})`, // <- Usa a variável corrigida
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* --- OS ATORES --- */}
        
        <ClassicHeader 
          character={character} 
          onUpdate={handleUpdate} 
        />
        
        {/* Próximos componentes virão aqui:
          <ClassicAttributes character={character} onUpdate={handleUpdate} />
          <ClassicVitality character={character} onUpdate={handleUpdate} />
          ...etc
        */}
        
      </div>
    </div>
  );
};

export default ClassicSheet;