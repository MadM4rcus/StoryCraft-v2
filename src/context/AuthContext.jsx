import React, { createContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, getIdTokenResult } from "firebase/auth";
import { auth, db } from "../services/firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Removido onSnapshot, adicionado getDoc
import { useSystem } from "./SystemContext.jsx";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const { GLOBAL_APP_IDENTIFIER } = useSystem();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setIsMaster(false);
        return;
      }

      // OTIMIZAÇÃO: Em vez de um listener (onSnapshot), verificamos o token do usuário uma vez.
      // Isso não custa leituras no Firestore.
      try {
        // Força a atualização do token para pegar os claims mais recentes.
        const idTokenResult = await currentUser.getIdTokenResult(true);
        // A flag 'isMaster' é um "Custom Claim" que deve ser definido no backend.
        const isUserMaster = idTokenResult.claims.isMaster === true;
        setIsMaster(isUserMaster);
        
        // Lógica para garantir que o documento do usuário exista no Firestore.
        // Isso só executa uma escrita se o usuário for novo.
        const userDocRef = doc(db, `artifacts2/${GLOBAL_APP_IDENTIFIER}/users/${currentUser.uid}`);
        const docSnap = await getDoc(userDocRef); // Usa getDoc em vez de onSnapshot
        if (!docSnap.exists()) {
          await setDoc(userDocRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            isMaster: false, // O padrão é sempre false no DB. A promoção é feita manualmente.
          }, { merge: true });
        }
      } catch (error) {
        console.error("Erro ao verificar claims do usuário:", error);
        setIsMaster(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [GLOBAL_APP_IDENTIFIER]); // Roda apenas uma vez quando o contexto é montado.

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
    isMaster,
    googleSignIn,
    googleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};