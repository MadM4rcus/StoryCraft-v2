// src/components/LoginScreen.jsx

import React from 'react';
import { useAuth } from '@/hooks';

const LoginScreen = () => {
  const { googleSignIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary mb-2">StoryCraft V2</h1>
        <p className="text-xl text-secondary mb-8">Sua ficha de RPG, do seu jeito.</p>
        <button onClick={handleGoogleSignIn} className="px-8 py-4 bg-highlight hover:bg-opacity-80 text-primary font-bold rounded-lg shadow-lg text-lg">
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;