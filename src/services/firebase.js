// 1. Importe as funções necessárias dos SDKs do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1Mpdmg4sF1U5Gr-kc0yOHofcPYYssS6Y",
  authDomain: "storycraft-v2.firebaseapp.com",
  projectId: "storycraft-v2",
  storageBucket: "storycraft-v2.firebasestorage.app",
  messagingSenderId: "20874394730",
  appId: "1:20874394730:web:d7219bb7810b2da7161e13"
};

// 3. Inicialize os serviços do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Exporte os serviços inicializados para que possam ser usados em outras partes do app
export { auth, db };

