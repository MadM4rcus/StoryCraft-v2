import { db } from './firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

// A função agora pode buscar todas as fichas se fetchAll for verdadeiro
export const getCharactersForUser = async (userId, fetchAll = false) => {
  if (!userId) return [];
  try {
    let characters = [];
    if (fetchAll) {
      // Busca em todos os utilizadores
      const usersRef = collection(db, `artifacts2/${appId}/users`);
      const usersSnapshot = await getDocs(usersRef);
      for (const userDoc of usersSnapshot.docs) {
        const charactersRef = collection(db, `artifacts2/${appId}/users/${userDoc.id}/characterSheets`);
        const q = query(charactersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          characters.push({ id: doc.id, ownerUid: userDoc.id, ...doc.data() });
        });
      }
    } else {
      // Busca apenas no utilizador atual
      const charactersRef = collection(db, `artifacts2/${appId}/users/${userId}/characterSheets`);
      const q = query(charactersRef);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        characters.push({ id: doc.id, ...doc.data() });
      });
    }
    return characters;
  } catch (error) {
    console.error("Erro ao buscar personagens:", error);
    return [];
  }
};

export const createNewCharacter = async (userId) => {
  if (!userId) return null;
  const characterName = prompt("Qual o nome do novo personagem?");
  if (!characterName) return null;
  try {
    const charactersRef = collection(db, `artifacts2/${appId}/users/${userId}/characterSheets`);
    const newCharData = {
      name: characterName,
      ownerUid: userId,
      createdAt: serverTimestamp(),
      level: 1,
      // ... (resto dos dados iniciais)
    };
    const docRef = await addDoc(charactersRef, newCharData);
    return { id: docRef.id, ...newCharData };
  } catch (error) {
    console.error("Erro ao criar novo personagem:", error);
    return null;
  }
};

export const deleteCharacter = async (userId, characterId) => {
  if (!userId || !characterId) return false;
  try {
    const charDocRef = doc(db, `artifacts2/${appId}/users/${userId}/characterSheets/${characterId}`);
    await deleteDoc(charDocRef);
    console.log("Ficha deletada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao deletar personagem:", error);
    return false;
  }
};