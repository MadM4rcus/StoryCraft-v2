// src/systems/storycraft_v2/ClassicSheet.jsx

import React, { useState } from 'react';
import { useCharacter } from '@/hooks';
import { ModalManager } from '@/components';

// 1. Importar o background e os novos componentes
import bgImage from '@/package/sheet/background castle paper.png';
import ClassicHeader from './ClassicHeader'; // Nosso primeiro componente de UI

// 2. Importar o CSS para os inputs (vamos criar este arquivo)
import './classicSheetStyles.css';

const ClassicSheet = ({ character: initialCharacter, onBack, isMaster }) => {
  // 3. Conectar a lógica de dados da V1
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

  // 4. A função de atualização que passaremos para os filhos
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

      {/* --- O PALCO PRINCIPAL ---
        Este é o container que segura a ficha inteira.
        - position: 'relative' é crucial para que o 'position: absolute' dos filhos funcione.
        - A imagem de fundo define o tamanho e a aparência.
      */}
      <div
        className="w-full"
        style={{
          position: 'relative',
          // Usamos a proporção da imagem de referência (827x1170)
          // Isso torna o container responsivo à largura.
          aspectRatio: '827 / 1170', 
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* --- OS ATORES ---
          Aqui é onde vamos "empilhar" nossos componentes de UI.
          Cada componente usará 'position: absolute' para se fixar no lugar certo.
        */}
        
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