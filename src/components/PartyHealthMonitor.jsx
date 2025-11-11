// src/components/PartyHealthMonitor.jsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIState } from '@/context/UIStateContext';
import { usePartyHealth } from '@/context/PartyHealthContext';

const PartyHealthMonitor = ({ onCharacterClick }) => {
  const { isMaster } = useAuth();
  const { layout, updateLayout } = useUIState();
  const { allCharacters, selectedCharIds, partyHealthData, toggleCharacterSelection } = usePartyHealth();
  const [showSelector, setShowSelector] = useState(false);

  const togglePosition = () => {
    updateLayout({ partyMonitor: layout.partyMonitor === 'top-left' ? 'top-right' : 'top-left' });
  };

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

  const positionClass = layout.partyMonitor === 'top-left' ? 'left-4' : 'right-4';

  return (
    <div className={`fixed top-4 ${positionClass} w-full max-w-xs bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-40`}>
      <div className="flex justify-between items-center p-3 bg-bgElement">
        <h3 className="font-bold text-textAccent">Monitor de Grupo</h3>
        <div className="flex items-center">
          <button
            className="text-textSecondary hover:text-textPrimary mr-2"
            onClick={togglePosition}
            title={layout.partyMonitor === 'top-left' ? 'Mover para a direita' : 'Mover para a esquerda'}
          >
            <span className="text-xl">🔃</span>
          </button>
          <button 
            className="text-textSecondary hover:text-textPrimary mr-2"
            onClick={(e) => { e.stopPropagation(); setShowSelector(!showSelector); }}
            title="Selecionar Personagens"
          >
            ⚙️
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

      <div className="flex-grow p-3 overflow-y-auto space-y-2 max-h-[calc(100vh-150px)]">
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