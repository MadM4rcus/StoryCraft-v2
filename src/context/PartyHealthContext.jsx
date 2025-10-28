// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks';
import { db } from '@/services';
import { collection, onSnapshot, query } from 'firebase/firestore';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

const APP_ID = '1:727724875985:web:97411448885c68c289e5f0';

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isMaster) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }
 
    setIsLoading(true);
    const charMap = new Map();
    let sheetUnsubscribers = [];
 
    const usersRef = collection(db, `artifacts2/${APP_ID}/users`);
 
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
        const sheetsRef = collection(db, `artifacts2/${APP_ID}/users/${userId}/characterSheets`);
 
        const unsubscribeSheets = onSnapshot(sheetsRef, (snapshot) => {
          let hasChanges = false;
 
          snapshot.docChanges().forEach(change => {
            const rawCharData = change.doc.data();
            let mainAttributes = rawCharData.mainAttributes;
            // Tenta parsear mainAttributes se for uma string (para compatibilidade com dados antigos ou importados incorretamente)
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
            setAllCharacters(Array.from(charMap.values()));
          }
          setIsLoading(false);
        }, (error) => {
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
  }, [isMaster]);

  
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