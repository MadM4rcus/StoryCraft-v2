import React, { useState, useEffect } from 'react';
import { useRollFeed } from '@/context';

const RollFeed = () => {
  const { rolls } = useRollFeed(); // Pega as rolagens do contexto
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // Agora o timestamp é um objeto Date do JS
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRollResult = (roll) => {
    const total = roll.results.reduce((acc, r) => acc + r.value, 0);
    const formula = roll.results.map(r => r.displayValue).join(' + ');

    return (
      <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span>{roll.characterName}</span>
          <span>{formatTimestamp(roll.timestamp)}</span>
        </div>
        <p className="font-semibold text-textPrimary">{roll.rollName}</p>
        <p className="text-sm text-textSecondary break-all">
          {formula} = <span className="font-bold text-lg text-textAccent">{total}</span>
        </p>
        {roll.discordText && <p className="text-xs italic text-textSecondary mt-1">"{roll.discordText}"</p>}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div 
        className="fixed bottom-4 left-4 bg-btnHighlightBg text-btnHighlightText p-3 rounded-full shadow-lg cursor-pointer hover:opacity-90 z-50"
        onClick={() => setIsCollapsed(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-full max-w-sm h-[60vh] bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-50">
      <div 
        className="flex justify-between items-center p-3 bg-bgElement cursor-pointer"
        onClick={() => setIsCollapsed(true)}
      >
        <h3 className="font-bold text-textAccent">Feed de Rolagens</h3>
        <button className="text-textSecondary hover:text-textPrimary">
          —
        </button>
      </div>
      <div className="flex-grow p-3 overflow-y-auto">
        {rolls.length === 0 && <p className="text-textSecondary italic">Nenhuma rolagem ainda...</p>}
        {rolls.map(renderRollResult)}
      </div>
    </div>
  );
};

export default RollFeed;