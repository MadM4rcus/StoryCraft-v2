import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

export const useCharacter = (characterId, ownerUid) => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId || !ownerUid) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, `artifacts2/${appId}/users/${ownerUid}/characterSheets/${characterId}`);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const deserializedData = { ...data };
        Object.keys(deserializedData).forEach(key => {
          if (typeof deserializedData[key] === 'string') {
            try { deserializedData[key] = JSON.parse(deserializedData[key]); } catch (e) { /* Ignora */ }
          }
        });
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
  }, [characterId, ownerUid]);

  const updateCharacterField = useCallback(async (field, value) => {
    if (!characterId || !ownerUid) return;
    const docRef = doc(db, `artifacts2/${appId}/users/${ownerUid}/characterSheets/${characterId}`);
    const valueToSave = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    try {
      await setDoc(docRef, { [field]: valueToSave }, { merge: true });
    } catch (error) {
      console.error(`Erro ao atualizar o campo ${field}:`, error);
    }
  }, [characterId, ownerUid]);
  
  // NOVA FUNÇÃO PARA SALVAR O ESTADO COLAPSÁVEL
  const toggleSection = useCallback((sectionName) => {
      if (character) {
          const currentCollapsedState = character.collapsedStates?.[sectionName] ?? false;
          const newCollapsedStates = {
              ...character.collapsedStates,
              [sectionName]: !currentCollapsedState
          };
          updateCharacterField('collapsedStates', newCollapsedStates);
      }
  }, [character, updateCharacterField]);


  return { character, loading, updateCharacterField, toggleSection };
};