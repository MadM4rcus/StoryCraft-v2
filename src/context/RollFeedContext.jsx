import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { addItemToFeed, subscribeToFeed } from '@/services/sessionService';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

const GLOBAL_FEED_PATH = 'storycraft-v2/default-session';

export const RollFeedProvider = ({ children }) => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFeedItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Passa o caminho global para a função de inscrição
    const unsubscribe = subscribeToFeed(GLOBAL_FEED_PATH, (items) => {
      setFeedItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addRollToFeed = useCallback((newRoll) => {
    if (!user) return;
    addItemToFeed(GLOBAL_FEED_PATH, { ...newRoll, type: 'roll' });
  }, [user]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user) return; // Check for user instead of sessionPath
    addItemToFeed(GLOBAL_FEED_PATH, { ...newMessage, type: 'message' });
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