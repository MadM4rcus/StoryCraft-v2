// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth, useSystem } from '@/hooks'; // Import useSystem
import { db } from '@/services';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getUserSettings, saveUserSettings } from '@/services';
import debounce from 'lodash/debounce';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

const GLOBAL_SESSION_PATH = 'storycraft-v2/default-session'; // <-- ADICIONADO: A mesma constante global

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot, sessionDataCollectionRoot } = useSystem(); // Use SystemContext
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
    if (!user) { // <-- SIMPLIFICADO: Não depende mais de um caminho de sessão dinâmico
      return;
    }

    const fetchSettings = async () => {
      const settings = await getUserSettings(user.uid);
      if (settings && settings.selectedCharIds) {
        setSelectedCharIds(settings.selectedCharIds);
      }
    };

    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (!user || !characterDataCollectionRoot) { // <-- ADICIONADO: Não executa se o caminho da sessão for nulo
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    // Limpa os personagens ao trocar de sistema para evitar mostrar dados incorretos
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
      // Lógica para o Mestre (ouve todos os usuários)
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
      // Lógica para Jogadores (ouve apenas as próprias fichas)
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
      if (uid) { // <-- SIMPLIFICADO: Não depende mais do caminho
        saveUserSettings(uid, { selectedCharIds: ids });
      }
    }, 1000)
  ).current;

  useEffect(() => {
    if (user) { 
      debouncedSave(GLOBAL_SESSION_PATH, user.uid, selectedCharIds); // <-- Usa o caminho global
    }
  }, [selectedCharIds, user, debouncedSave]);

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