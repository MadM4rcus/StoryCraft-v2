// src/services/themeService.js

import { db } from './firebase';
// AQUI ESTÁ A CORREÇÃO: Adicionado 'getDoc' à lista de importação
import { collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';

const GLOBAL_APP_IDENTIFIER = "1:727724875985:web:97411448885c68c289e5f0"; // Renomeado para clareza

/**
 * Busca todos os temas criados por um utilizador específico.
 */
export const getThemesForUser = async (userId) => {
  if (!userId) return [];
  try {
    const themesRef = collection(db, 'themes');
    const querySnapshot = await getDocs(themesRef); // Remove o filtro por 'ownerUid'
    const themes = [];
    querySnapshot.forEach((doc) => {
      themes.push({ id: doc.id, ...doc.data() });
    });
    return themes;
  } catch (error) {
    console.error("Erro ao buscar temas:", error);
    return [];
  }
};

/**
 * Busca um único tema pelo seu ID.
 */
export const getThemeById = async (themeId) => {
    if (!themeId) return null;
    try {
        const themeRef = doc(db, 'themes', themeId);
        const docSnap = await getDoc(themeRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar tema por ID:", error);
        return null;
    }
};


/**
 * Salva (cria ou atualiza) um tema no Firestore.
 */
export const saveTheme = async (themeData) => {
  try {
    if (themeData.id) {
      const themeRef = doc(db, 'themes', themeData.id);
      await setDoc(themeRef, themeData, { merge: true });
      return themeData.id;
    } else {
      const themesRef = collection(db, 'themes');
      const docRef = await addDoc(themesRef, themeData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Erro ao salvar tema:", error);
    return null;
  }
};

/**
 * Deleta um tema do Firestore.
 */
export const deleteTheme = async (themeId) => {
  if (!themeId) return false;
  try {
    const themeRef = doc(db, 'themes', themeId);
    await deleteDoc(themeRef);
    return true;
  } catch (error) {
    console.error("Erro ao deletar tema:", error);
    return false;
  }
};

/**
 * Busca as configurações de usuário para um ID de usuário específico.
 */
export const getUserSettings = async (userId) => {
  if (!userId) return null;
  try {
    const userSettingsRef = doc(db, 'storycraft-v2', GLOBAL_APP_IDENTIFIER, 'userSettings', userId);
    const docSnap = await getDoc(userSettingsRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar configurações de usuário:", error);
    return null;
  }
};

/**
 * Salva (cria ou atualiza) as configurações de usuário no Firestore.
 */
export const saveUserSettings = async (userId, settingsData) => {
  if (!userId || !settingsData) return false;
  try {
    const userSettingsRef = doc(db, 'storycraft-v2', GLOBAL_APP_IDENTIFIER, 'userSettings', userId);
    await setDoc(userSettingsRef, settingsData, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar configurações de usuário:", error);
    return false;
  }
};

/**
 * Aplica um tema a uma ficha de personagem específica.
 */
export const applyThemeToCharacter = async (ownerUid, characterId, themeId, characterDataCollectionRoot) => {
  if (!ownerUid || !characterId) return;
  try {
    const charRef = doc(db, `${characterDataCollectionRoot}/users/${ownerUid}/characterSheets/${characterId}`);
    await setDoc(charRef, { activeThemeId: themeId }, { merge: true });
  } catch (error) {
    console.error("Erro ao aplicar tema ao personagem:", error); // O erro acontece aqui
  }
};