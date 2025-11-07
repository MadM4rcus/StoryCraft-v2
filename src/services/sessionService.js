import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming you export 'db' from firebase.js

export const addItemToFeed = async (sessionPath, messageData) => {
  try {
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
  const feedCollectionRef = collection(db, sessionPath, "feed");
  const q = query(feedCollectionRef, orderBy("timestamp", "desc"));

  return onSnapshot(q, (querySnapshot) => {
    const feedItems = [];
    querySnapshot.forEach((doc) => {
      feedItems.push({ id: doc.id, ...doc.data() });
    });
    callback(feedItems);
  }, (error) => {
    console.error("Error subscribing to feed:", error);
    // Adicione um tratamento de erro mais robusto se necessário
  });
};