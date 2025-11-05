import React, { useState } from 'react';
import { useRollFeed } from '@/context';
import { useAuth } from '@/hooks';
import { ChatInput } from '@/components';

const RollFeed = () => {
  const { feedItems } = useRollFeed();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // Agora o timestamp é um objeto Date do JS
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderChatMessage = (message) => {
    return (
      <div key={message.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span className="font-bold">{message.characterName}</span>
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
        
        {/* Se tiver um TÍTULO (como Vantagens), mostra-o */}
        {message.title && (
          <h4 className="font-semibold text-textAccent text-lg mb-1">
            {message.title}
          </h4>
        )}
        
        {/* Mostra a DESCRIÇÃO (se for Vantagem/Item) 
          OU o TEXTO (se for uma mensagem de chat)
        */}
        <p className="text-sm text-textPrimary break-words whitespace-pre-wrap">
          {message.description || message.text}
        </p>
      </div>
    );
  };

  const renderRollResult = (roll) => {
    // O total agora vem diretamente do 'roll', em vez de ser calculado aqui
    const total = roll.totalResult; 
    const formula = roll.results.map(r => r.displayValue).join(' + ');

    return (
      <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span>{roll.characterName}</span>
          <span>{formatTimestamp(roll.timestamp)}</span>
        </div>
        
        {/* Nome da Ação */}
        <p className="font-semibold text-lg text-textPrimary">{roll.rollName}</p>
        
        {/* --- NOVO: Bloco de Acerto (Layout 2.0) --- */}
        {roll.acertoResult && (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            {/* Linha 1: Acerto: 19 (Misticismo) */}
            <p className="font-semibold text-textPrimary/90">
              Acerto: 
              <span className="font-bold text-lg text-textAccent ml-2">
                {roll.acertoResult.total}
              </span>
              <span className="text-sm text-textSecondary ml-2">
                ({roll.acertoResult.skillName})
              </span>
            </p>
            {/* Linha 2: 1d20(16) + 3 CRITICO */}
            <p className="text-sm text-textSecondary mt-1">
              1d20(<span className={roll.acertoResult.isCrit ? 'text-red-400 font-bold' : ''}>{roll.acertoResult.roll}</span>) + {roll.acertoResult.bonus}
              {roll.acertoResult.isCrit && <span className="text-red-400 font-bold ml-2">🎯 CRÍTICO!</span>}
            </p>
          </div>
        )}
        
        {/* Bloco de Dano/Resultado (Layout 2.0) */}
        {(formula || !roll.acertoResult || (roll.criticals && roll.criticals.length > 0)) && (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            
            {/* Linha 1: Dano: 668 */}
            <p className="font-semibold text-textPrimary/90">
              {roll.acertoResult ? 'Dano/Resultado:' : 'Resultado:'}
              <span className="font-bold text-3xl text-textAccent ml-2">
                {total}
              </span>
            </p>
            
            {/* Linha 2: <dados da magia normalmente> */}
            {formula && (
                <p className="text-sm text-textSecondary break-words mt-2">
                  {formula}
                </p>
            )}
            
            {/* Linha 3: <dados da função de critico> (Vem do array 'criticals') */}
            {roll.criticals && roll.criticals.length > 0 && (
                <p className="text-sm text-red-400 font-semibold whitespace-pre-wrap mt-1">
                  {/* Filtra a msg "Acerto Crítico..." para não repetir aqui */}
                  {roll.criticals.filter(c => !c.startsWith('Acerto Crítico')).join('\n')}
                </p>
            )}
          </div>
        )}

        {/* O Bloco de Críticos antigo foi removido pois foi fundido com o Dano/Resultado */}
        
        {roll.discordText && <p className="text-xs italic text-textSecondary mt-2">"{roll.discordText}"</p>}
      </div>
    );
  };


  const renderFeedItem = (item) => {
    switch (item.type) {
      case 'roll':
        return renderRollResult(item);
      case 'message':
        return renderChatMessage(item);
      default:
        return null;
    }
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
        {feedItems.length === 0 && <p className="text-textSecondary italic">Nenhuma rolagem ou mensagem ainda...</p>}
        {feedItems.map(renderFeedItem)}
      </div>
      <ChatInput />
    </div>
  );
};

export default RollFeed;