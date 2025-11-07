import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useSystem, useAuth } from '@/hooks';
import { addItemToFeed, subscribeToFeed } from '@/services/sessionService';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const { user } = useAuth();
  const { sessionDataCollectionRoot } = useSystem();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const sessionPath = sessionDataCollectionRoot; // O root já contém o caminho completo necessário

  useEffect(() => {
    if (!user || !sessionPath) { // <-- SIMPLIFICADO: Apenas verifica se o caminho da sessão é nulo/falsy
      setFeedItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToFeed(sessionPath, (items) => {
      setFeedItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, sessionPath]);

  const addRollToFeed = useCallback((newRoll) => {
    if (!sessionPath) return;
    addItemToFeed(sessionPath, { ...newRoll, type: 'roll' });
  }, [sessionPath]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!sessionPath) return;
    addItemToFeed(sessionPath, { ...newMessage, type: 'message' });
  }, [sessionPath]);

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