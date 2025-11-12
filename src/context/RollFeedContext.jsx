import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const { user } = useAuth(); // Ainda precisamos do usuário para identificar quem está enviando
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // O feed não carrega mais nada

  // Efeito foi esvaziado. Não há mais conexão com Firestore ou simulação de WebSocket.
  useEffect(() => {
    // Adiciona uma mensagem inicial para explicar o novo comportamento.
    if (user) {
      setFeedItems([{
        id: 'local-feed-welcome',
        type: 'message',
        characterName: 'Sistema',
        text: 'O feed agora funciona localmente para sua conveniência. As rolagens ainda são enviadas para o Discord.',
        timestamp: { toDate: () => new Date() }
      }]);
    }
  }, [user]);

  // As funções agora não fazem nada, apenas existem para não quebrar os componentes que as chamam.
  const addRollToFeed = useCallback((newRoll) => {
    if (!user) return;
    setFeedItems(prev => [{ ...newRoll, id: crypto.randomUUID(), type: 'roll', timestamp: { toDate: () => new Date() } }, ...prev]);
  }, [user]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user) return;
    setFeedItems(prev => [{ ...newMessage, id: crypto.randomUUID(), type: 'message', timestamp: { toDate: () => new Date() } }, ...prev]);
  }, [user]);

  const value = {
    feedItems,
    isLoading,
    addRollToFeed,
    addMessageToFeed,
  };

  return (
    <RollFeedContext.Provider value={value}>
      {children}
    </RollFeedContext.Provider>
  );
};