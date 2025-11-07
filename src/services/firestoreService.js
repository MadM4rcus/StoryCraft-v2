import { db } from './firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

// A função agora pode buscar todas as fichas se fetchAll for verdadeiro
export const getCharactersForUser = async (basePath, userId, fetchAll = false) => {
  if (!userId || !basePath) return [];
  try {
    let characters = [];
    if (fetchAll) {
      // Busca em todos os utilizadores
      const usersRef = collection(db, `${basePath}/users`);
      const usersSnapshot = await getDocs(usersRef);
      for (const userDoc of usersSnapshot.docs) {
        const charactersRef = collection(db, `${basePath}/users/${userDoc.id}/characterSheets`);
        const q = query(charactersRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          characters.push({ id: doc.id, ownerUid: userDoc.id, ...doc.data() });
        });
      }
    } else {
      // Busca apenas no utilizador atual
      const charactersRef = collection(db, `${basePath}/users/${userId}/characterSheets`);
      const q = query(charactersRef);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        characters.push({ id: doc.id, ownerUid: userId, ...doc.data() });
      });
    }
    return characters;
  } catch (error) {
    console.error("Erro ao buscar personagens:", error);
    return [];
  }
};

export const createNewCharacter = async (basePath, userId) => {
  if (!userId || !basePath) return null;
  const characterName = prompt("Qual o nome do novo personagem?");
  if (!characterName) return null;
  try {
    const charactersRef = collection(db, `${basePath}/users/${userId}/characterSheets`);
    const newCharData = {
      name: characterName,
      ownerUid: userId,
      createdAt: serverTimestamp(),
      level: 1, // Valor padrão
      mainAttributes: { // Inicializa com valores padrão para HP e MP
        hp: {
          current: 100,
          max: 100,
          temp: 0,
        },
        mp: {
          current: 50,
          max: 50,
        },
      },
      // ... (resto dos dados iniciais)
    };
    const docRef = await addDoc(charactersRef, newCharData);
    return { id: docRef.id, ...newCharData };
  } catch (error) {
    console.error("Erro ao criar novo personagem:", error);
    return null;
  }
};

export const deleteCharacter = async (basePath, userId, characterId) => {
  if (!userId || !characterId || !basePath) return false;
  try {
    const charDocRef = doc(db, `${basePath}/users/${userId}/characterSheets/${characterId}`);
    await deleteDoc(charDocRef);
    console.log("Ficha deletada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao deletar personagem:", error);
    return false;
  }
};