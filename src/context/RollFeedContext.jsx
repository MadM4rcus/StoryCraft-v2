import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from './SystemContext';
import { rtdb } from '@/services/firebase';
import { ref, onValue, push, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';

const RollFeedContext = createContext();

export const useRollFeed = () => useContext(RollFeedContext);

export const RollFeedProvider = ({ children }) => {
  const { user } = useAuth();
  const { sessionDataCollectionRoot } = useSystem();
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para ouvir o Realtime Database
  useEffect(() => {
    if (!user || !sessionDataCollectionRoot) {
      setFeedItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const feedRef = ref(rtdb, sessionDataCollectionRoot);
    const feedQuery = query(
      feedRef,
      orderByChild('timestamp'),
      limitToLast(20) // Limita a busca às últimas 20 mensagens para performance
    );

    const unsubscribe = onValue(feedQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          // Converte o timestamp do RTDB para um objeto compatível com a função formatTimestamp
          timestamp: { toDate: () => new Date(data[key].timestamp) }
        }));
        setFeedItems(itemsList.reverse()); // Inverte para mostrar o mais novo primeiro
      } else {
        setFeedItems([]);
      }
      setIsLoading(false);
    });

    // Limpa o listener ao desmontar
    return () => unsubscribe();

  }, [user, sessionDataCollectionRoot]);

  const addRollToFeed = useCallback((newRoll) => {
    if (!user || !sessionDataCollectionRoot) return;
    const feedRef = ref(rtdb, sessionDataCollectionRoot);
    push(feedRef, { ...newRoll, type: 'roll', timestamp: serverTimestamp() });
  }, [user, sessionDataCollectionRoot]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user || !sessionDataCollectionRoot) return;
    const feedRef = ref(rtdb, sessionDataCollectionRoot);
    push(feedRef, { ...newMessage, type: 'message', timestamp: serverTimestamp() });
  }, [user, sessionDataCollectionRoot]);

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