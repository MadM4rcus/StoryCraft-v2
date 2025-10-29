// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { useAuth, useSystem } from '@/hooks'; // Import useSystem
import { db } from '@/services';
import { collection, onSnapshot, query } from 'firebase/firestore';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER } = useSystem(); // Use SystemContext
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const charMap = new Map();

    const processSnapshot = (snapshot, userId) => {
      let hasChanges = false;
      snapshot.docChanges().forEach(change => {
        const rawCharData = change.doc.data();
        let mainAttributes = rawCharData.mainAttributes;
        if (typeof mainAttributes === 'string') {
          try {
            mainAttributes = JSON.parse(mainAttributes);
          } catch (e) {
            console.error(`Erro ao parsear mainAttributes para o personagem ${change.doc.id}:`, e);
          }
        }
        const charData = { id: change.doc.id, ownerUid: userId, ...rawCharData, mainAttributes: mainAttributes };

        if (change.type === "added" || change.type === "modified") {
          charMap.set(charData.id, charData);
          hasChanges = true;
        } else if (change.type === "removed") {
          charMap.delete(charData.id);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        const newChars = Array.from(charMap.values());
        setAllCharacters(newChars);
      }
      setIsLoading(false);
    };

    if (isMaster) {
      // Lógica para o Mestre (ouve todos os usuários)
      let sheetUnsubscribers = [];
      const usersRef = collection(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users`);
      const unsubscribeUsers = onSnapshot(usersRef, (usersSnapshot) => {
        sheetUnsubscribers.forEach(unsub => unsub());
        sheetUnsubscribers = [];

        if (usersSnapshot.empty) {
          charMap.clear();
          setAllCharacters([]);
          setIsLoading(false);
          return;
        }

        usersSnapshot.docs.forEach(userDoc => {
          const userId = userDoc.id;
          const sheetsRef = collection(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users/${userId}/characterSheets`);
          const unsubscribeSheets = onSnapshot(sheetsRef, (snapshot) => processSnapshot(snapshot, userId), (error) => {
            console.error(`Erro ao ouvir fichas do usuário ${userId}:`, error);
            setIsLoading(false);
          });
          sheetUnsubscribers.push(unsubscribeSheets);
        });
      }, (error) => {
        console.error("Erro ao ouvir coleção de usuários:", error);
        setIsLoading(false);
      });

      return () => {
        unsubscribeUsers();
        sheetUnsubscribers.forEach(unsub => unsub());
      };
    } else {
      // Lógica para Jogadores (ouve apenas as próprias fichas)
      const sheetsRef = collection(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users/${user.uid}/characterSheets`);
      const unsubscribe = onSnapshot(sheetsRef, (snapshot) => processSnapshot(snapshot, user.uid), (error) => {
        console.error(`Erro ao ouvir as próprias fichas:`, error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } // Adicionado characterDataCollectionRoot e GLOBAL_APP_IDENTIFIER às dependências
  }, [user, isMaster, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER]);

  
  // Deriva os dados dos selecionados
  const partyHealthData = useMemo(() => {
    return allCharacters.filter(char => selectedCharIds.includes(char.id));
  }, [allCharacters, selectedCharIds]);
  

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