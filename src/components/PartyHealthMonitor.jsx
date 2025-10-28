// src/components/PartyHealthMonitor.jsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { usePartyHealth } from '@/context';

const PartyHealthMonitor = ({ onCharacterClick }) => {
  const { isMaster } = useAuth();
  const { allCharacters, selectedCharIds, partyHealthData, toggleCharacterSelection } = usePartyHealth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

    const handleCharacterClick = (char) => {
    if (onCharacterClick) {
      onCharacterClick(char);
    }
  };

  const renderCharacterHealth = (char) => {
    // O mainAttributes agora deve ser um objeto devido ao parsing no PartyHealthContext
    // ou um objeto vazio se não existia.
    const hp = char.mainAttributes?.hp || { current: '?', max: '?', temp: 0 };
    const mp = char.mainAttributes?.mp || { current: '?', max: '?' };

    return (
      <div 
        key={char.id} 
        className="p-2 bg-bgElement rounded-md border border-bgInput cursor-pointer hover:border-btnHighlightBg"
        onClick={() => handleCharacterClick(char)}
        title={`Clique para ir para a ficha de ${char.name}`}
      >
        <p className="font-bold text-textPrimary truncate">{char.name}</p>
        <div className="text-sm flex justify-between">
          <span className="text-red-400">HP: {hp.current}/{hp.max} {hp.temp > 0 ? `(+${hp.temp})` : ''}</span>
          <span className="text-blue-400">MP: {mp.current}/{mp.max}</span>
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div 
        className="fixed top-4 left-4 bg-btnHighlightBg text-btnHighlightText p-3 rounded-full shadow-lg cursor-pointer hover:opacity-90 z-50"
        onClick={() => setIsCollapsed(false)}
        title="Expandir Monitor de Grupo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-5M3 4h5V9" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16l-4-4M3 8l4 4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 w-full max-w-xs bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-50">
      <div className="flex justify-between items-center p-3 bg-bgElement cursor-pointer" onClick={() => setIsCollapsed(true)}>
        <h3 className="font-bold text-textAccent">Monitor de Grupo</h3>
        <div className="flex items-center">
          <button 
            className="text-textSecondary hover:text-textPrimary mr-2"
            onClick={(e) => { e.stopPropagation(); setShowSelector(!showSelector); }}
            title="Selecionar Personagens"
          >
            ⚙️
          </button>
          <button className="text-textSecondary hover:text-textPrimary" title="Recolher">
            —
          </button>
        </div>
      </div>

      {showSelector && (
        <div className="p-3 border-b border-bgElement max-h-48 overflow-y-auto">
          <h4 className="text-sm font-semibold text-textSecondary mb-2">Selecionar Personagens</h4>
          {allCharacters.length > 0 ? allCharacters.map(char => (
            <div key={char.id} className="flex items-center">
              <input
                type="checkbox"
                id={`char-select-${char.id}`}
                checked={selectedCharIds.includes(char.id)}
                onChange={() => toggleCharacterSelection(char.id)}
                className="form-checkbox h-4 w-4 text-btnHighlightBg bg-bgInput border-bgElement rounded"
              />
              <label htmlFor={`char-select-${char.id}`} className="ml-2 text-textPrimary text-sm truncate">{char.name}</label>
            </div>
          )) : <p className="text-xs text-textSecondary italic">Nenhuma ficha encontrada.</p>}
        </div>
      )}

      <div className="flex-grow p-3 overflow-y-auto space-y-2 max-h-[60vh]">
        {partyHealthData.length > 0 ? (
          partyHealthData.map(renderCharacterHealth)
        ) : (
          <p className="text-textSecondary italic text-sm text-center py-4">
            Nenhum personagem selecionado. Clique na engrenagem ⚙️ para selecionar.
          </p>
        )}
      </div>
    </div>
  );
};

export default PartyHealthMonitor;