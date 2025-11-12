import { useState, useEffect, useCallback } from 'react';

// Importa ambos os serviços
import { doc as firestoreDoc, onSnapshot as firestoreOnSnapshot, setDoc as firestoreSetDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as localStore from '../services/localStoreService';

import { useSystem } from '../context/SystemContext'; // 1. Importa o hook do SystemContext

export const useCharacter = (characterId, ownerUid) => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsedStates, setCollapsedStates] = useState({});
  const { characterDataCollectionRoot, dataSource } = useSystem(); // Obtém o dataSource

  useEffect(() => {
    if (!characterId || !ownerUid || !characterDataCollectionRoot) {
      setLoading(false);
      return;
    }

    // Escolhe as funções corretas com base na fonte de dados
    const onSnapshot = dataSource === 'local' ? localStore.onSnapshot : firestoreOnSnapshot;
    const doc = dataSource === 'local' ? localStore.doc : firestoreDoc;

    const docPath = `${characterDataCollectionRoot}/users/${ownerUid}/characterSheets/${characterId}`;
    const docRef = doc(dataSource === 'local' ? null : db, docPath); // 'db' só é necessário para o firestore
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const deserializedData = { ...data };
        Object.keys(deserializedData).forEach(key => {
          if (typeof deserializedData[key] === 'string') {
            try { deserializedData[key] = JSON.parse(deserializedData[key]); } catch (e) { /* Ignora */ }
          }
        });
        setCollapsedStates(deserializedData.collapsedStates || {});
        setCharacter({ id: docSnap.id, ...deserializedData });
      } else {
        console.error("Personagem não encontrado!");
        setCharacter(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar o personagem:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [characterId, ownerUid, characterDataCollectionRoot, dataSource]); // Adiciona dataSource às dependências

  const updateCharacterField = useCallback(async (field, value) => {
    if (!characterId || !ownerUid || !characterDataCollectionRoot) return;

    // Escolhe as funções corretas
    const setDoc = dataSource === 'local' ? localStore.setDoc : firestoreSetDoc;
    const doc = dataSource === 'local' ? localStore.doc : firestoreDoc;

    const docRef = doc(dataSource === 'local' ? null : db, `${characterDataCollectionRoot}/users/${ownerUid}/characterSheets/${characterId}`);
    const valueToSave = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    try {
      await setDoc(docRef, { [field]: valueToSave }, { merge: true });
    } catch (error) {
      console.error(`Erro ao atualizar o campo ${field}:`, error);
    }
  }, [characterId, ownerUid, characterDataCollectionRoot, dataSource]); // Adiciona dataSource
  
  const toggleSection = useCallback((sectionName) => {
    const newCollapsedStates = {
      ...collapsedStates,
      [sectionName]: !collapsedStates[sectionName]
    };
    // Atualiza o estado local imediatamente para uma UI responsiva
    setCollapsedStates(newCollapsedStates);
    // Envia a atualização para o Firestore
    updateCharacterField('collapsedStates', newCollapsedStates);
  }, [collapsedStates, updateCharacterField]);


  return { character, loading, updateCharacterField, toggleSection };
};