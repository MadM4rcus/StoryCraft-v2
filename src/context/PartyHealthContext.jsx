// src/context/PartyHealthContext.jsx

import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
// --- CORREÇÃO AQUI ---
import { useAuth } from '@/hooks/useAuth'; // Importa direto do useAuth.js
import { db } from '@/services/firebase'; // O 'db' vem do firebase.js
// --- FIM DA CORREÇÃO ---
import { collection, onSnapshot, query } from 'firebase/firestore';

const PartyHealthContext = createContext();

export const usePartyHealth = () => useContext(PartyHealthContext);

const APP_ID = '1:727724875985:web:97411448885c68c289e5f0';

export const PartyHealthProvider = ({ children }) => {
  const { user, isMaster } = useAuth();
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Este useEffect agora gerencia os listeners de forma correta
  useEffect(() => {
    if (!isMaster) {
      setAllCharacters([]);
      setIsLoading(false);
      return;
    }

    // Checagem para garantir que os imports funcionaram
    if (!user || !db) {
      console.error("PartyHealthContext: 'user' ou 'db' (do firebase) não estão disponíveis. Verifique imports diretos.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Este Map vai guardar todos os personagens de forma consolidada.
    const charMap = new Map();
    
    // Este array vai guardar todas as funções 'unsubscribe' dos sheets.
    let sheetUnsubscribers = [];

    const usersRef = collection(db, `artifacts2/${APP_ID}/users`);
    
    // 1. Ouve a coleção de usuários
    const unsubscribeUsers = onSnapshot(usersRef, (usersSnapshot) => {
      
      // Limpa listeners de sheets antigos antes de criar novos
      sheetUnsubscribers.forEach(unsub => unsub());
      sheetUnsubscribers = [];
      
      if (usersSnapshot.empty) {
        charMap.clear();
        setAllCharacters([]);
        setIsLoading(false);
        return;
      }

      // Itera sobre cada documento de usuário
      usersSnapshot.docs.forEach(userDoc => {
        const userId = userDoc.id;
        const sheetsRef = collection(db, `artifacts2/${APP_ID}/users/${userId}/characterSheets`);
        
        // 2. Ouve a coleção de sheets de CADA usuário
        const unsubscribeSheets = onSnapshot(sheetsRef, (snapshot) => {
          
          let hasChanges = false; 
          
          snapshot.docChanges().forEach(change => {
            const charData = { id: change.doc.id, ownerUid: userId, ...change.doc.data() };
            
            if (change.type === "added" || change.type === "modified") {
              charMap.set(charData.id, charData); // Adiciona ou ATUALIZA no Map
              hasChanges = true;
            } else if (change.type === "removed") {
              charMap.delete(charData.id); // Remove do Map
              hasChanges = true;
            }
          });
          
          // 3. Se houveram mudanças, ATUALIZA O ESTADO UMA VEZ com a lista completa
          if (hasChanges) {
            setAllCharacters(Array.from(charMap.values()));
          }
          setIsLoading(false);
        }, (error) => {
            console.error(`Erro ao ouvir fichas do usuário ${userId}:`, error);
            setIsLoading(false);
        });
        
        // Guarda a função de unsubscribe
        sheetUnsubscribers.push(unsubscribeSheets);
      });
    }, (error) => {
        console.error("Erro ao ouvir coleção de usuários:", error);
        setIsLoading(false);
    });

    // Função de limpeza (quando o componente desmonta)
    return () => {
      unsubscribeUsers();
      sheetUnsubscribers.forEach(unsub => unsub());
    };
  }, [isMaster, user]); // Adicionado 'user' aqui

  
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