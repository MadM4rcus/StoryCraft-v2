import React, { createContext, useState, useContext, useCallback } from 'react';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const [rolls, setRolls] = useState([]);

  const addRollToFeed = useCallback((newRoll) => {
    // Adiciona um ID único e um timestamp do lado do cliente
    const rollWithMeta = {
      ...newRoll,
      id: Date.now() + Math.random(), // ID simples para a key do React
      timestamp: new Date(), // Timestamp do cliente
    };
    
    // Adiciona a nova rolagem no início e mantém apenas as últimas 50
    setRolls(currentRolls => [rollWithMeta, ...currentRolls].slice(0, 50));
  }, []);

  const value = {
    rolls,
    addRollToFeed,
  };

  return (
    <RollFeedContext.Provider value={value}>
      {children}
    </RollFeedContext.Provider>
  );
};