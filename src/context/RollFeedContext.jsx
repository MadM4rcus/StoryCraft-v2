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
    console.log("[DIAGNÓSTICO ROLLFEED] Assinando feed global:", GLOBAL_FEED_PATH);
    // Passa o caminho global para a função de inscrição
    const unsubscribe = subscribeToFeed(GLOBAL_FEED_PATH, (items) => {
      setFeedItems(items);
      setIsLoading(false);
      console.log("[DIAGNÓSTICO ROLLFEED] Feed atualizado. Total de itens:", items.length);
    });

    return () => unsubscribe();
  }, [user]);

  const addRollToFeed = useCallback((newRoll) => {
    if (!user) { console.warn("[DIAGNÓSTICO ROLLFEED] Tentativa de adicionar rolagem sem usuário logado."); return; }
    console.log("[DIAGNÓSTICO ROLLFEED] Adicionando rolagem ao feed global:", GLOBAL_FEED_PATH, newRoll);
    addItemToFeed(GLOBAL_FEED_PATH, { ...newRoll, type: 'roll' });
  }, [user]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user) { console.warn("[DIAGNÓSTICO ROLLFEED] Tentativa de adicionar mensagem sem usuário logado."); return; }
    console.log("[DIAGNÓSTICO ROLLFEED] Adicionando mensagem ao feed global:", GLOBAL_FEED_PATH, newMessage);
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