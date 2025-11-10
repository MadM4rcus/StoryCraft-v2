// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext'; // Import useSystem
import { db } from '@/services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getUserSettings, saveUserSettings } from '@/services/firestoreService';
import debounce from 'lodash/debounce';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot, GLOBAL_SESSION_PATH } = useSystem(); // Use SystemContext
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharIds, setSelectedCharIds] = useState(() => {
    // Tenta carregar do localStorage como valor inicial para evitar piscar
    try {
      const saved = localStorage.getItem('selectedCharIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true); 

  // Efeito para buscar as configurações do usuário APENAS quando o usuário ou o caminho da sessão mudam.
  useEffect(() => {
    if (!user || !characterDataCollectionRoot) { // <-- ADICIONADO: Espera o root da coleção
      return;
    }

    const fetchSettings = async () => {
      // 1. CORRIGIDO: Passa o 'basePath' (characterDataCollectionRoot) como primeiro argumento
      const settings = await getUserSettings(characterDataCollectionRoot, user.uid);
      if (settings && settings.selectedCharIds) {
        setSelectedCharIds(settings.selectedCharIds);
      }
    };

    fetchSettings();
  }, [user, characterDataCollectionRoot]); // <-- ADICIONADO: Depende do root da coleção

  useEffect(() => {
    if (!user || !characterDataCollectionRoot) { 
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    // ... (resto da função sem alteração) ...
    setAllCharacters([]);
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
      let sheetUnsubscribers = [];
      const usersRef = collection(db, `${characterDataCollectionRoot}/users`);
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
          const sheetsRef = collection(db, `${characterDataCollectionRoot}/users/${userId}/characterSheets`);
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
      const sheetsRef = collection(db, `${characterDataCollectionRoot}/users/${user.uid}/characterSheets`);
      const unsubscribe = onSnapshot(sheetsRef, (snapshot) => processSnapshot(snapshot, user.uid), (error) => {
        console.error(`Erro ao ouvir as próprias fichas:`, error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, isMaster, characterDataCollectionRoot]);

  // Debounce para salvar as alterações no Firestore e no localStorage
  const debouncedSave = useRef(
    debounce((path, uid, ids) => {
      localStorage.setItem('selectedCharIds', JSON.stringify(ids)); 
      if (uid && path) { // <-- ADICIONADO: Verifica se o 'path' (basePath) existe
        // 2. CORRIGIDO: Passa 'path' (basePath) como primeiro argumento
        saveUserSettings(path, uid, { selectedCharIds: ids });
      }
    }, 1000)
  ).current;

  useEffect(() => {
    if (user && characterDataCollectionRoot) { // <-- ADICIONADO: Espera o root da coleção
      // 3. CORRIGIDO: Passa 'characterDataCollectionRoot' em vez de 'GLOBAL_SESSION_PATH'
      debouncedSave(characterDataCollectionRoot, user.uid, selectedCharIds); 
    }
  }, [selectedCharIds, user, debouncedSave, characterDataCollectionRoot]); // <-- ADICIONADO: Depende do root da coleção

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