import React, { useState, useEffect, useRef } from 'react';
import { useRollFeed } from '@/context/RollFeedContext';
import { useAuth } from '@/hooks/useAuth';
import ChatInput from '@/components/ChatInput';

const RollFeed = () => {
  const { feedItems, isLoading } = useRollFeed();

  const formatTimestamp = (timestamp) => {
    // O timestamp do Firebase pode ser null (enquanto está sendo setado) ou um objeto com toDate()
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderChatMessage = (message) => {
    return (
      <div key={message.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span className="font-bold text-base text-textPrimary">{message.characterName}</span>
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
    const isCrit = (roll.acertoResult && roll.acertoResult.isCrit) || (roll.criticals && roll.criticals.length > 0);

    const formula = roll.results.map((r, index) => (
      <React.Fragment key={index}>
        {index > 0 && ' + '}
        {r.value === 1 && r.dice === 'd20' ? (
          <span className="text-red-500 font-bold">{r.displayValue}</span>
        ) : (
          r.displayValue
        )}
      </React.Fragment>
    ));

    return (
      <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span className="font-bold text-base text-textPrimary">{roll.characterName}</span>
          <span>{formatTimestamp(roll.timestamp)}</span>
        </div>
        
        {/* Nome da Ação */}
        <p className="font-semibold text-lg text-textPrimary">{roll.rollName || 'Rolagem de Dados'}</p>
        
        {/* --- NOVO: Bloco de Acerto (Layout 2.0) --- */}
        {roll.acertoResult && (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            {/* Linha 1: Acerto: 19 (Misticismo) */}
            <p className={`font-semibold ${isCrit ? 'text-green-400' : 'text-textPrimary/90'}`}>
              Acerto: 
              <span className={`font-bold text-lg ml-2 ${isCrit ? 'text-green-400' : 'text-textAccent'}`}>
                {roll.acertoResult.total}
              </span>
              <span className="text-sm text-textSecondary ml-2">
                ({roll.acertoResult.skillName})
              </span>
            </p>
            {/* Linha 2: 1d20(16) + 3 CRITICO */}
            <p className="text-sm text-textSecondary mt-1">
              1d20(<span className={roll.acertoResult.isCrit ? 'text-green-400 font-bold' : roll.acertoResult.roll === 1 ? 'text-red-500 font-bold' : ''}>{roll.acertoResult.roll}</span>) + {roll.acertoResult.bonus}
              {roll.acertoResult.isCrit && <span className="text-green-400 font-bold ml-2">🎯 CRÍTICO!</span>}
              {roll.acertoResult.roll === 1 && <span className="text-red-500 font-bold ml-2">💥 FALHA CRÍTICA!</span>}
            </p>
          </div>
        )}
        
        {/* Bloco de Dano/Resultado (Layout 2.0) */}
        {(formula || !roll.acertoResult || (roll.criticals && roll.criticals.length > 0)) && (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            
            {/* Linha 1: Dano: 668 */}
            <p className={`font-semibold ${isCrit ? 'text-green-400' : 'text-textPrimary/90'}`}>
              {roll.acertoResult ? 'Dano/Resultado:' : 'Resultado:'}
              <span className={`font-bold text-3xl ml-2 ${isCrit ? 'text-green-400' : 'text-textAccent'}`}>
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
                <p className="text-sm text-green-400 font-semibold whitespace-pre-wrap mt-1">
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

  const feedRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feedItems]);

  return (
    <div className="fixed bottom-4 left-4 w-full max-w-sm h-[60vh] bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-50">
      <div 
        className="flex justify-between items-center p-3 bg-bgElement cursor-pointer"
        // O botão de recolher foi movido para o GlobalControls
      >
        <h3 className="font-bold text-textAccent">Feed de Rolagens</h3>
        <button className="text-textSecondary hover:text-textPrimary">
          —
        </button>
      </div>
      <div ref={feedRef} className="flex-grow p-3 overflow-y-auto flex flex-col-reverse">
        {isLoading && <p className="text-textSecondary italic">Carregando feed...</p>}
        {!isLoading && feedItems.length === 0 && (
          <p className="text-textSecondary italic">Nenhuma rolagem ou mensagem ainda...</p>
        )}
        {feedItems.map(renderFeedItem)}
      </div>
      <ChatInput />
    </div>
  );
};

export default RollFeed;