import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  limit, // 1. Importar a função 'limit' do Firestore
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming you export 'db' from firebase.js

export const addItemToFeed = async (sessionPath, messageData) => {
  try {
    console.log("[DIAGNÓSTICO FIRESTORE] Adicionando item à coleção:", sessionPath, messageData);
    const feedCollectionRef = collection(db, sessionPath, "feed");
    await addDoc(feedCollectionRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding document to feed: ", error);
    // Adicione um tratamento de erro mais robusto se necessário
  }
};

export const subscribeToFeed = (sessionPath, callback) => {
  console.log("[DIAGNÓSTICO FIRESTORE] Assinando coleção:", sessionPath);
  const feedCollectionRef = collection(db, sessionPath, "feed");
  const q = query(feedCollectionRef, orderBy("timestamp", "desc"));

  return onSnapshot(q, (querySnapshot) => {
    const feedItems = [];
    querySnapshot.forEach((doc) => {
      // console.log("[DIAGNÓSTICO FIRESTORE] Item recebido:", { id: doc.id, ...doc.data() }); // Descomente para ver cada item individualmente
      feedItems.push({ id: doc.id, ...doc.data() });
    });
    callback(feedItems);
  }, (error) => {
    console.error("Error subscribing to feed:", error);
    // Adicione um tratamento de erro mais robusto se necessário
  });
};

// 2. Criar e exportar a nova função com limite
export const subscribeToFeedWithLimit = (sessionPath, feedLimit, callback) => {
  console.log(`[DIAGNÓSTICO FIRESTORE] Assinando coleção com limite(${feedLimit}):`, sessionPath);
  const feedCollectionRef = collection(db, sessionPath, "feed");
  // Adiciona o 'limit(feedLimit)' à consulta do Firestore
  const q = query(feedCollectionRef, orderBy("timestamp", "desc"), limit(feedLimit));

  return onSnapshot(q, (querySnapshot) => {
    const feedItems = [];
    querySnapshot.forEach((doc) => {
      feedItems.push({ id: doc.id, ...doc.data() });
    });
    // O feed já vem na ordem correta (mais novo primeiro) e o CSS o inverte.
    callback(feedItems);
  }, (error) => {
    console.error("Error subscribing to feed with limit:", error);
    // Adicione um tratamento de erro mais robusto se necessário
  });
};