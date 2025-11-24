import React, { useState, useEffect, useRef } from 'react';
import { useRollFeed } from '@/context/RollFeedContext';
import { useUIState } from '@/context/UIStateContext';
import { useAuth } from '@/hooks/useAuth';
import ChatInput from '@/components/ChatInput';

const RollFeed = () => {
  const { feedItems, isLoading } = useRollFeed();
  const { layout, updateLayout } = useUIState();

  const togglePosition = () => {
    updateLayout({ rollFeed: layout.rollFeed === 'bottom-left' ? 'top-right' : 'bottom-left' });
  };
  
  const formatTimestamp = (timestamp) => {
    // O timestamp do RTDB pode não existir ou não ser um objeto com toDate()
    // A lógica no context agora garante que ele seja um objeto compatível.
    if (!timestamp || typeof timestamp.toDate !== 'function') return ''; // Mantém a checagem por segurança

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

    // --- CORREÇÃO FINAL ---
    // Determina se é uma rolagem de perícia ou atributo puro (sem dano).
    // Isso acontece se houver um 'acertoResult', mas nenhum 'totalResult' de dano.
    const isSimpleCheckRoll = roll.acertoResult && (roll.totalResult === undefined || roll.totalResult === 0);


    // --- CORREÇÃO FINAL ---
    // Determina se é uma ação puramente descritiva (sem acerto e sem resultados de dados).
    const isDescriptiveAction = !roll.acertoResult && (!roll.results || roll.results.length === 0);

    // --- NOVO: Bloco para Modo Secreto ---
    if (roll.isSecret) {
      // --- LÓGICA REFINADA ---
      // Uma "Ação" é uma rolagem com múltiplos componentes (ex: perícia + dano)
      // ou com componentes que não são de perícia (ex: uma cura com dados).
      // Uma rolagem de perícia pura (1 componente do tipo 'skillRoll') não é uma "Ação".
      const isComplexActionRoll = roll.components && (
        roll.components.length > 1 || (roll.components.length === 1 && roll.components[0].type !== 'skillRoll')
      );

      return (
        <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-red-500/50 mb-2 shadow-lg shadow-red-900/30">
          <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
            <span className="font-bold text-base text-textPrimary">{roll.characterName}</span>
            <span>{formatTimestamp(roll.timestamp)}</span>
          </div>
          <div className="text-center py-2">
            <p className="font-semibold text-lg text-textPrimary">{roll.rollName}</p>
            {/* --- LÓGICA DE EXIBIÇÃO PARA MODO SECRETO --- */}
            {isComplexActionRoll ? ( // É uma ação complexa?
              roll.acertoResult?.isCritFail ? ( // 1. E é uma falha crítica no acerto?
                // Mostra apenas a mensagem de falha, sem dano.
                <p className="font-bold text-3xl text-red-500 animate-pulse">💥 Falha Crítica!</p>
              ) : (
                // 2. Se não for falha crítica, mostra os detalhes.
                <>
                  {roll.acertoResult && (
                    <p className="font-semibold text-textPrimary/90">
                      {roll.acertoResult.skillName}:
                      {roll.acertoResult.isCrit ? (
                          <span className="font-bold text-3xl ml-2 text-green-400 animate-pulse">CRÍTICO! 🎯</span>
                      ) : (
                          <span className={`font-bold text-3xl ml-2 text-textAccent`}>
                              {roll.acertoResult.total}
                          </span>
                      )}
                    </p>
                  )}
                  <p className={`font-semibold ${roll.acertoResult ? 'text-textPrimary/90' : 'text-textPrimary'}`}>
                    {roll.acertoResult ? 'Dano/Resultado:' : 'Resultado:'}
                    <span className={`font-bold text-3xl ml-2 text-textAccent`}>{total}</span>
                  </p>
                </>
              )
            ) : roll.acertoResult?.isCrit ? ( // Não é ação complexa, mas é sucesso crítico?
              // 2. Se for ROLAGEM SIMPLES e CRÍTICO, mostra a mensagem
              <p className="font-bold text-3xl text-green-400 animate-pulse">🎯 Sucesso Crítico!</p>
            ) : roll.acertoResult?.isCritFail ? ( // Não é ação complexa, mas é falha crítica?
              // 3. Se for ROLAGEM SIMPLES e FALHA, mostra a mensagem
              <p className="font-bold text-3xl text-red-500 animate-pulse">💥 Falha Crítica!</p>
            ) : (
              // 4. Se for ROLAGEM SIMPLES e NORMAL, mostra o resultado
              <p className="font-semibold text-textPrimary/90">
                Resultado:
                <span className="font-bold text-3xl ml-2 text-textAccent">{roll.acertoResult?.total ?? total}</span>
              </p>
            )}
          </div>
        </div>
      );
    }

    // --- NOVO: Bloco para Rolagem Rápida ---
    if (roll.isQuickRoll) {
      return (
        <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
          <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
            <span className="font-bold text-base text-textPrimary">{roll.characterName}</span>
            <span>{formatTimestamp(roll.timestamp)}</span>
          </div>
          <div className="text-center py-2">
            <p className="text-textPrimary">
              Rolou <span className="font-bold text-4xl text-textAccent">{roll.totalResult}</span> em um {roll.rollName}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div key={roll.id} className="p-3 bg-bgElement rounded-md border border-bgInput mb-2">
        <div className="flex justify-between items-center text-xs text-textSecondary mb-1">
          <span className="font-bold text-base text-textPrimary">{roll.characterName}</span>
          <span>{formatTimestamp(roll.timestamp)}</span>
        </div>
        
        {/* Nome da Ação */}
        <p className="font-semibold text-lg text-textPrimary">{roll.rollName || 'Rolagem de Dados'}</p>
        
        {/* --- NOVO: Bloco para Ações Descritivas (sem rolagens) --- */}
        {isDescriptiveAction ? (
          // Não renderiza nada extra além do nome, descrição e custo.
          // A descrição e o custo são renderizados no final do componente.
          null
        )
        /* --- Bloco para Rolagem de Atributo ou Perícia Simples --- */
        : isSimpleCheckRoll ? (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            {/* Linha 1: Resultado: 12 */}
            <p className={`font-semibold text-textPrimary/90`}>
              Resultado:
              <span className={`font-bold text-3xl ml-2 ${roll.acertoResult.isCrit ? 'text-green-400' : roll.acertoResult.isCritFail ? 'text-red-500' : 'text-textAccent'}`}>
                {roll.acertoResult.total}
              </span>
            </p>
            {/* Linha 2: 1d20(1) + 11 */}
            <p className="text-sm text-textSecondary mt-1">
              1d20(<span className={roll.acertoResult.isCrit ? 'text-green-400 font-bold' : roll.acertoResult.isCritFail ? 'text-red-500 font-bold' : ''}>{roll.acertoResult.roll}</span>) + {roll.acertoResult.bonus}
              {roll.acertoResult.isCrit && <span className="text-green-400 font-bold ml-2">🎯 CRÍTICO!</span>}
              {roll.acertoResult.isCritFail && <span className="text-red-500 font-bold ml-2">💥 FALHA CRÍTICA!</span>}
            </p>
          </div>
        ) : (
          <>
            {/* --- Bloco de Acerto para Perícias/Ataques --- */}
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
              {roll.acertoResult.isCritFail && <span className="text-red-500 font-bold ml-2">💥 FALHA CRÍTICA!</span>}
            </p>
          </div>
        )}
        
            {/* Bloco de Dano/Resultado (Layout 2.0) */}
            {(roll.detailsText || (roll.acertoResult && roll.totalResult > 0)) && (
          <div className="mt-2 pt-2 border-t border-bgInput/50">
            
            {/* Linha 1: Dano: 668 */}
            <p className={`font-semibold ${isCrit ? 'text-green-400' : 'text-textPrimary/90'}`}>
              {roll.acertoResult ? 'Dano/Resultado:' : 'Resultado:'}
              <span className={`font-bold text-3xl ml-2 ${isCrit ? 'text-green-400' : 'text-textAccent'}`}>
                {total}
              </span>
            </p>
            
            {/* Linha 2: <dados da magia normalmente> */}
            {/* --- CORREÇÃO: Usa o `detailsText` para mostrar o cálculo do dano base --- */}
            {roll.detailsText && (
                <p className="text-sm text-textSecondary break-words mt-1">
                  {roll.detailsText}
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
          </>
        )} 

        {/* O Bloco de Críticos antigo foi removido pois foi fundido com o Dano/Resultado */}
        
        {roll.discordText && <p className="text-xs italic text-textSecondary mt-2">"{roll.discordText}"</p>}

        {/* --- NOVO: Exibição do Custo da Ação --- */}
        {roll.costText && (
            <p className="text-xs font-semibold text-purple-400 mt-2 border-t border-bgInput/50 pt-1">
                {roll.costText}
            </p>
        )}
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

  // Define as classes de posicionamento e tamanho com base no layout
  const getPositionClasses = () => {
    const { partyMonitor, rollFeed } = layout;

    if (rollFeed === 'top-right') {
      return 'top-4 right-4 w-full max-w-sm h-[60vh]';
    }

    // Padrão: bottom-left
    if (partyMonitor === 'top-left') {
      return 'bottom-4 left-4 w-full max-w-sm h-[calc(100vh-8rem-100px)]'; // Altura ajustada se o monitor estiver acima
    }
    return 'bottom-4 left-4 w-full max-w-sm h-[calc(100vh-8rem)]'; // Altura maior se o monitor não estiver acima
  };

  return (
    <div className={`fixed ${getPositionClasses()} bg-bgSurface/90 backdrop-blur-md rounded-lg shadow-2xl border border-bgElement flex flex-col z-40`}>
      <div 
        className="flex justify-between items-center p-3 bg-bgElement cursor-pointer"
        // O botão de recolher foi movido para o GlobalControls
      >
        <h3 className="font-bold text-textAccent">Feed de Rolagens</h3>
        <button
          onClick={togglePosition}
          className="text-textSecondary hover:text-textPrimary"
          title={layout.rollFeed === 'bottom-left' ? 'Mover para o canto superior direito' : 'Mover para o canto inferior esquerdo'}
        >
          <span className="text-xl">
            🔃
          </span>
        </button>
      </div>
      {/* CORREÇÃO: A classe `flex-col-reverse` foi removida.
          O scroll automático para o final já é feito via `useEffect`,
          garantindo que o comportamento seja o de um chat padrão. */}
      <div ref={feedRef} className="flex-grow p-3 overflow-y-auto space-y-2">
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