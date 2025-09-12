import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

// Este hook gere os dados de um único personagem
export const useCharacter = (characterId, ownerUid) => {
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efeito para ouvir as alterações no Firestore em tempo real
  useEffect(() => {
    if (!characterId || !ownerUid) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, `artifacts2/${appId}/users/${ownerUid}/characterSheets/${characterId}`);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Deserializa os dados que foram guardados como JSON string
        const deserializedData = { ...data };
        Object.keys(deserializedData).forEach(key => {
          if (typeof deserializedData[key] === 'string') {
            try {
              deserializedData[key] = JSON.parse(deserializedData[key]);
            } catch (e) { /* Ignora se não for um JSON válido */ }
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

    return () => unsubscribe(); // Limpa a escuta quando o componente é desmontado
  }, [characterId, ownerUid]);

  // Função para atualizar um campo específico do personagem
  const updateCharacterField = useCallback(async (field, value) => {
    if (!characterId || !ownerUid) return;
    const docRef = doc(db, `artifacts2/${appId}/users/${ownerUid}/characterSheets/${characterId}`);
    
    // Se o valor for um objeto (como mainAttributes), serializa-o antes de guardar
    const valueToSave = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;

    try {
      await setDoc(docRef, { [field]: valueToSave }, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar o campo:", error);
    }
  }, [characterId, ownerUid]);

  return { character, loading, updateCharacterField };
};