import React, { createContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../services/firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Importa as funções do Firestore

const appId = "1:727724875985:web:97411448885c68c289e5f0"; // ID do App para o caminho

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para criar/verificar o documento do utilizador no Firestore
  const handleUserDocument = async (currentUser) => {
    if (!currentUser) return;

    // Define o caminho para o documento do utilizador no nosso novo universo 'artifacts2'
    const userDocRef = doc(db, `artifacts2/${appId}/users/${currentUser.uid}`);
    
    const userDocSnap = await getDoc(userDocRef);

    // Se o documento não existir, cria-o com os campos padrão
    if (!userDocSnap.exists()) {
      try {
        await setDoc(userDocRef, {
          displayName: currentUser.displayName,
          email: currentUser.email,
          isMaster: false, // Por padrão, ninguém é mestre
        });
        console.log("Documento do utilizador criado em artifacts2!");
      } catch (error) {
        console.error("Erro ao criar o documento do utilizador:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      handleUserDocument(currentUser); // Chama a função para lidar com o documento
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const googleSignOut = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    googleSignIn,
    googleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};