import React, { createContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../services/firebase.js";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const appId = "1:727724875985:web:97411448885c68c289e5f0";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setIsMaster(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, `artifacts2/${appId}/users/${user.uid}`);

      const unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            await setDoc(userDocRef, {
              displayName: user.displayName,
              email: user.email,
              isMaster: false,
            });
            setIsMaster(false);
          } catch (error) {
            console.error("Erro ao criar o documento do utilizador:", error);
          }
        } else {
          setIsMaster(docSnap.data().isMaster === true);
        }
        setLoading(false);
      }, (error) => {
        console.error("Erro ao escutar documento do utilizador:", error);
        setLoading(false);
      });

      return () => unsubscribeFirestore();
    }
  }, [user]);

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