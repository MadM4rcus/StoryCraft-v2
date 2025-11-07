// src/services/sessionService.js

import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

/**
 * Adiciona um item (rolagem ou mensagem) ao feed da sessão.
 * @param {string} collectionPath - O caminho base da coleção de dados.
 * @param {object} itemData - O objeto da mensagem ou rolagem.
 */
export const addItemToFeed = async (collectionPath, itemData) => {
  try {
    const feedRef = collection(db, `${collectionPath}/feed`);
    await addDoc(feedRef, {
      ...itemData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao adicionar item ao feed:", error);
  }
};

/**
 * Ouve as atualizações em tempo real do feed.
 * @param {string} collectionPath - O caminho base da coleção de dados.
 * @param {function} callback - Função para ser chamada com os novos itens do feed.
 * @returns {function} - Função para cancelar a inscrição (unsubscribe).
 */
export const subscribeToFeed = (collectionPath, callback) => {
  const feedRef = collection(db, `${collectionPath}/feed`);
  const q = query(feedRef, orderBy('timestamp', 'desc'), limit(100)); // Busca os 100 itens mais recentes

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error("Erro ao ouvir o feed:", error);
  });
};

/**
 * Salva as configurações de um usuário.
 * @param {string} collectionPath - O caminho base da coleção de dados.
 * @param {string} userId - O ID do usuário.
 * @param {object} settings - O objeto de configurações a ser salvo.
 */
export const saveUserSettings = (collectionPath, userId, settings) => {
  const userSettingsRef = doc(db, `${collectionPath}/userSettings`, userId);
  return setDoc(userSettingsRef, settings, { merge: true });
};

/**
 * Busca as configurações de um usuário.
 * @param {string} collectionPath - O caminho base da coleção de dados.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<object|null>} - As configurações do usuário ou null.
 */
export const getUserSettings = async (collectionPath, userId) => {
  const userSettingsRef = doc(db, `${collectionPath}/userSettings`, userId);
  const docSnap = await getDoc(userSettingsRef);
  return docSnap.exists() ? docSnap.data() : null;
};