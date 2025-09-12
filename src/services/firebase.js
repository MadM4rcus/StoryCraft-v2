import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do seu projeto Firebase v1 (storycraft-a5f7e)
const firebaseConfig = {
  apiKey: "AIzaSyDfsK4K4vhOmSSGeVHOlLnJuNlHGNha4LU",
  authDomain: "storycraft-a5f7e.firebaseapp.com",
  projectId: "storycraft-a5f7e",
  storageBucket: "storycraft-a5f7e.firebasestorage.app", // Corrigido para corresponder ao seu projeto v1
  messagingSenderId: "727724875985",
  appId: "1:727724875985:web:97411448885c68c289e5f0",
  measurementId: "G-JH03Y2NZDK"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);