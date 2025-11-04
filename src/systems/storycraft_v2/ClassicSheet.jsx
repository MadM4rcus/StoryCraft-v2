// src/systems/storycraft_v2/ClassicSheet.jsx

import React from 'react';

const ClassicSheet = ({ character, onBack, isMaster }) => {
  if (!character) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-yellow-100 text-black">
      <button 
        onClick={onBack} 
        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg mb-4"
      >
        ← Voltar para a Lista (V2)
      </button>
      
      <h1 className="text-3xl font-bold mb-4">Ficha Clássica (V2) - Placeholder</h1>
      <p className="text-xl">Personagem selecionado: <span className="font-bold">{character.name}</span></p>
      <p>ID: {character.id}</p>
      <p>Owner: {character.ownerUid}</p>
      
      <pre className="bg-gray-800 text-white p-4 rounded-md overflow-auto mt-4">
        {JSON.stringify(character, null, 2)}
      </pre>
    </div>
  );
};

export default ClassicSheet;