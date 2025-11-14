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
        // CORREÇÃO: Remove o .reverse(). A ordem natural (mais antigo primeiro) é a correta
        // para que novos itens apareçam no final do feed, como um chat.
        setFeedItems(itemsList);
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

    // PENTE FINO: Garante que todos os campos obrigatórios pelas regras do RTDB existam.
    const rollData = { ...newRoll, ownerUid: user.uid };

    // Garante um nome para a rolagem, se não houver.
    if (!rollData.rollName) {
      rollData.rollName = 'Rolagem de Dados';
    }

    // Garante que rolagens rápidas (que podem não ter totalResult) tenham um total.
    if (rollData.totalResult === undefined && rollData.results && rollData.results.length > 0) {
      // Se não houver total, mas houver resultados, soma-os.
      // Útil para rolagens simples como 1d20.
      rollData.totalResult = rollData.results.reduce((acc, r) => acc + (r.value || 0), 0);
    }

    // Envia a rolagem completa para o Firebase.
    push(feedRef, { ...rollData, type: 'roll', timestamp: serverTimestamp() });
  }, [user, sessionDataCollectionRoot]);

  const addMessageToFeed = useCallback((newMessage) => {
    if (!user || !sessionDataCollectionRoot) return;
    const feedRef = ref(rtdb, sessionDataCollectionRoot);

    // PENTE FINO: Garante que todos os campos obrigatórios pelas regras do RTDB existam.
    const messageData = { ...newMessage, ownerUid: user.uid }; // Garante o ownerUid.

    // Garante que a mensagem tenha um campo 'text', que é obrigatório na regra de validação.
    if (!messageData.text) {
      messageData.text = 'Ação de Cura/Dano registrada no feed.';
    }

    // Envia a mensagem completa para o Firebase.
    push(feedRef, { ...messageData, type: 'message', timestamp: serverTimestamp() });
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