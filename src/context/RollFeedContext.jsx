import React, { createContext, useState, useContext, useCallback } from 'react';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const [feedItems, setFeedItems] = useState([]);

  const addRollToFeed = useCallback((newRoll) => {
    // Adiciona um ID único e um timestamp do lado do cliente
    const rollWithMeta = {
      ...newRoll,
      type: 'roll',
      id: Date.now() + Math.random(), // ID simples para a key do React
      timestamp: new Date(), // Timestamp do cliente
    };
    
    // Adiciona a nova rolagem no início e mantém apenas as últimas 50
    setFeedItems(currentItems => [rollWithMeta, ...currentItems].slice(0, 50));
  }, []);

  const addMessageToFeed = useCallback((newMessage) => {
    const messageWithMeta = {
      ...newMessage,
      type: 'message',
      id: Date.now() + Math.random(),
      timestamp: new Date(),
    };
    setFeedItems(currentItems => [messageWithMeta, ...currentItems].slice(0, 50));
  }, []);

  const value = {
    feedItems,
    addRollToFeed,
    addMessageToFeed,
  };

  return (
    <RollFeedContext.Provider value={value}>
      {children}
    </RollFeedContext.Provider>
  );
};