import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { addItemToFeed, subscribeToFeed } from '@/services/sessionService';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const { user } = useAuth();
  const { GLOBAL_SESSION_PATH } = useSystem();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFeedItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log("[DIAGNÓSTICO ROLLFEED] Assinando feed global:", GLOBAL_SESSION_PATH);
    // Passa o caminho global para a função de inscrição
    const unsubscribe = subscribeToFeed(GLOBAL_SESSION_PATH, (items) => {
      setFeedItems(items);
      setIsLoading(false);
      console.log("[DIAGNÓSTICO ROLLFEED] Feed atualizado. Total de itens:", items.length);
    });

    return () => unsubscribe();
  }, [user, GLOBAL_SESSION_PATH]);

  const addRollToFeed = useCallback((newRoll) => {
    if (!user) { console.warn("[DIAGNÓSTICO ROLLFEED] Tentativa de adicionar rolagem sem usuário logado."); return; }
    console.log("[DIAGNÓSTICO ROLLFEED] Adicionando rolagem ao feed global:", GLOBAL_SESSION_PATH, newRoll);
    addItemToFeed(GLOBAL_SESSION_PATH, { ...newRoll, type: 'roll' });
  }, [user, GLOBAL_SESSION_PATH]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user) { console.warn("[DIAGNÓSTICO ROLLFEED] Tentativa de adicionar mensagem sem usuário logado."); return; }
    console.log("[DIAGNÓSTICO ROLLFEED] Adicionando mensagem ao feed global:", GLOBAL_SESSION_PATH, newMessage);
    addItemToFeed(GLOBAL_SESSION_PATH, { ...newMessage, type: 'message' });
  }, [user, GLOBAL_SESSION_PATH]);

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