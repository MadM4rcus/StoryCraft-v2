import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase"; // Assuming you export 'db' from firebase.js

// Use a constant global identifier for the session/app.
const GLOBAL_APP_IDENTIFIER = "storycraft-v2-main-session";

const feedCollectionRef = collection(db, "storycraft-v2", GLOBAL_APP_IDENTIFIER, "feed");

export const addItemToFeed = async (messageData) => {
  try {
    await addDoc(feedCollectionRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding document to feed: ", error);
  }
};

export const subscribeToFeed = (callback) => {
  const q = query(feedCollectionRef, orderBy("timestamp", "desc"));
  return onSnapshot(q, (querySnapshot) => {
    const feedItems = [];
    querySnapshot.forEach((doc) => {
      feedItems.push({ id: doc.id, ...doc.data() });
    });
    callback(feedItems);
  });
};