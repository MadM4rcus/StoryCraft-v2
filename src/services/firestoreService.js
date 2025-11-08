import { db } from './firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

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

/**
 * Busca as configurações de um usuário no Firestore.
 * @param {string} userId - O UID do usuário.
 * @returns {Promise<object|null>} As configurações do usuário ou null se não encontradas.
 */
export const getUserSettings = async (userId) => {
  if (!userId) return null;
  // As configurações do usuário são globais e não dependem do sistema (v1 ou v2)
  const settingsDocRef = doc(db, `artifacts2/storycraft/users/${userId}`);
  try {
    const docSnap = await getDoc(settingsDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar configurações do usuário:", error);
    return null;
  }
};

/**
 * Salva as configurações de um usuário no Firestore.
 * @param {string} userId - O UID do usuário.
 * @param {object} settings - O objeto de configurações a ser salvo.
 */
export const saveUserSettings = async (userId, settings) => {
  if (!userId) return;
  const settingsDocRef = doc(db, `artifacts2/storycraft/users/${userId}`);
  await setDoc(settingsDocRef, settings, { merge: true });
};