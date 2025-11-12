// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Corrigido para usar o hook
import { useSystem } from '@/context/SystemContext';
import { db } from '@/services/firebase';
import { collection, onSnapshot, query, collectionGroup } from 'firebase/firestore'; // 1. Importar collectionGroup
import { getUserSettings, saveUserSettings } from '@/services/firestoreService';
import debounce from 'lodash/debounce';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const { characterDataCollectionRoot } = useSystem(); // Removido GLOBAL_SESSION_PATH que não é usado aqui
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

  // Efeito para buscar as configurações do usuário APENAS quando o usuário ou o caminho da coleção mudam.
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

  // Otimização Principal: Centraliza a lógica de inscrição do Firestore
  useEffect(() => {
    if (!user || !characterDataCollectionRoot) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let q;
    // 2. Lógica de consulta otimizada
    // ALTERADO: A lógica agora aponta para uma coleção 'partyStatus' dedicada.
    // Esta é uma preparação para uma futura otimização com Cloud Functions.
    if (isMaster) {
      // O Mestre agora ouve uma coleção de alto nível 'partyStatus' que conteria
      // apenas os dados essenciais (HP, MP, Nome) de cada personagem.
      // Esta coleção seria atualizada por uma Cloud Function.
      const collectionPath = `${characterDataCollectionRoot}/partyStatus`;
      q = query(collection(db, collectionPath));
    } else {
      // Para o Jogador: A consulta também pode ser otimizada para ouvir um documento
      // específico em 'partyStatus', mas por enquanto, mantemos a busca nas suas fichas.
      const collectionPath = `${characterDataCollectionRoot}/users/${user.uid}/characterSheets`;
      q = query(collection(db, collectionPath));
    }

    // O ouvinte agora usa a consulta otimizada 'q'
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const charactersData = [];
      snapshot.forEach(doc => {
        const charData = doc.data();
        // Garante que mainAttributes seja um objeto para evitar erros
        if (typeof charData.mainAttributes === 'string') {
          try { 
            charData.mainAttributes = JSON.parse(charData.mainAttributes);
          } catch {
            charData.mainAttributes = {};
          }
        }
        // 3. Adiciona a ficha à lista. O ownerUid já vem no documento da ficha.
        charactersData.push({ id: doc.id, ...charData });
      });

      setAllCharacters(charactersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir coleção de personagens:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
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