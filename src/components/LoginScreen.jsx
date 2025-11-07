// src/components/LoginScreen.jsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks';

const LoginScreen = () => {
  const { googleSignIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await googleSignIn();
      // O redirecionamento será tratado pelo listener de autenticação na raiz do app
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      // Evita mostrar erro se o usuário simplesmente fechou o popup
      if (error.code !== 'auth/popup-closed-by-user') {
        setError("Ocorreu um erro ao tentar fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-5xl font-bold text-primary mb-2">StoryCraft V2</h1>
        <p className="text-xl text-secondary mb-8">Sua ficha de RPG, do seu jeito.</p>
        <button 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          className="px-8 py-4 bg-highlight hover:bg-opacity-80 text-primary font-bold rounded-lg shadow-lg text-lg transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Carregando...' : 'Entrar com Google'}
        </button>
        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;