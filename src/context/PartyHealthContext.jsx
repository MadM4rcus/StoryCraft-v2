import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { db } from '@/services';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

const APP_ID = '1:727724875985:web:97411448885c68c289e5f0';

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [partyHealthData, setPartyHealthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca todas as fichas disponíveis para o mestre
  useEffect(() => {
    if (!isMaster) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    // Esta query busca todas as fichas. Pode ser ajustada se necessário.
    const allUnsubscribers = [];
    const usersRef = collection(db, `artifacts2/${APP_ID}/users`);

    const unsubscribeUsers = onSnapshot(usersRef, (usersSnapshot) => {
      // Limpa listeners de sheets antigos antes de criar novos
      allUnsubscribers.forEach(unsub => unsub());
      allUnsubscribers.splice(0, allUnsubscribers.length); // Esvazia o array

      const currentChars = [];
      const newSheetsUnsubscribers = [];

      usersSnapshot.docs.forEach(userDoc => {
        const sheetsRef = collection(db, `artifacts2/${APP_ID}/users/${userDoc.id}/characterSheets`);
        const unsubscribeSheets = onSnapshot(sheetsRef, (snapshot) => {
          snapshot.docChanges().forEach(change => {
            const charData = { id: change.doc.id, ownerUid: userDoc.id, ...change.doc.data() };
            const index = currentChars.findIndex(c => c.id === charData.id);

            if (change.type === "added" || change.type === "modified") {
              if (index > -1) { currentChars[index] = charData; }
              else { currentChars.push(charData); }
            } else if (change.type === "removed") {
              if (index > -1) { currentChars.splice(index, 1); }
            }
          });
          setAllCharacters([...currentChars]); // Atualiza o estado com a lista consolidada
        });
        newSheetsUnsubscribers.push(unsubscribeSheets);
      });
      allUnsubscribers.push(...newSheetsUnsubscribers); // Adiciona os novos unsubscribers de sheets
      setIsLoading(false);
    });
    allUnsubscribers.push(unsubscribeUsers); // Adiciona o unsubscriber de usuários
    return () => allUnsubscribers.forEach(unsub => unsub());
  }, [isMaster, user]);

  // Ouve as atualizações das fichas selecionadas
  useEffect(() => {
    if (selectedCharIds.length === 0) {
      setPartyHealthData([]);
      return;
    }

    const unsubscribers = selectedCharIds.map(charId => {
      const char = allCharacters.find(c => c.id === charId);
      if (!char) return () => {};

      const docRef = collection(db, `artifacts2/${APP_ID}/users/${char.ownerUid}/characterSheets`);
      const q = query(docRef, where('__name__', '==', charId));

      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const updatedChar = { id: change.doc.id, ownerUid: char.ownerUid, ...change.doc.data() };
            setPartyHealthData(currentData => {
              const index = currentData.findIndex(c => c.id === updatedChar.id);
              if (index > -1) {
                const newData = [...currentData];
                newData[index] = updatedChar;
                return newData;
              }
              return [...currentData, updatedChar];
            });
          }
        });
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [selectedCharIds, allCharacters]);

  const toggleCharacterSelection = useCallback((charId) => {
    setSelectedCharIds(prev =>
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  }, []);

  const value = {
    allCharacters,
    selectedCharIds,
    partyHealthData,
    isLoading,
    toggleCharacterSelection,
  };

  return (
    <PartyHealthContext.Provider value={value}>
      {children}
    </PartyHealthContext.Provider>
  );
};