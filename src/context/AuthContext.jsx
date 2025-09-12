import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';

// Cria o Contexto que compartilhará os dados de autenticação
export const AuthContext = createContext();

// Cria o componente "Provedor" que vai envolver nossa aplicação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para fazer login com a conta do Google
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Função para fazer logout
  const signOutUser = () => {
    return signOut(auth);
  };

  // Efeito que roda uma vez para verificar o estado do login
  useEffect(() => {
    // A função onAuthStateChanged fica "ouvindo" o Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Define o usuário (ou null se não estiver logado)
      setIsLoading(false); // Marca que a verificação inicial terminou
    });

    // Função de limpeza para parar de "ouvir" quando o componente for desmontado
    return () => unsubscribe();
  }, []);

  // O valor que será compartilhado com toda a aplicação
  const value = {
    user,
    isLoading,
    signInWithGoogle,
    signOutUser,
  };

  // Retorna o Provedor com os dados, mostrando os componentes filhos apenas quando o carregamento inicial terminar
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

