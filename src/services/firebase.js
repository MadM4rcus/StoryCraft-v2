import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Configuração do seu projeto Firebase v1 (storycraft-a5f7e)
const firebaseConfig = {
  apiKey: "AIzaSyDfsK4K4vhOmSSGeVHOlLnJuNlHGNha4LU",
  authDomain: "storycraft-a5f7e.firebaseapp.com",
  databaseURL: "https://storycraft-a5f7e-default-rtdb.firebaseio.com",
  projectId: "storycraft-a5f7e",
  storageBucket: "storycraft-a5f7e.firebasestorage.app", // Corrigido para corresponder ao seu projeto v1
  messagingSenderId: "727724875985",
  appId: "1:727724875985:web:97411448885c68c289e5f0",
  measurementId: "G-JH03Y2NZDK"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LewwAssAAAAAHgqpfFBuCWQGGyEh4dxQNYJGPS2'),

  // Opcional: defina como 'true' para permitir que o app funcione em ambientes
  // onde o App Check não é suportado. Para produção, o ideal é 'false'.
  isTokenAutoRefreshEnabled: true
});

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);