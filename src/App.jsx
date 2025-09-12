import React from 'react';
import { useAuth } from './hooks/useAuth.js';

function App() {
  const { user, loading, googleSignIn, googleSignOut } = useAuth();

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {/* O título foi alterado aqui */}
      <h1 className="text-4xl font-bold mb-8">StoryCraft</h1>
      {user ? (
        <div className="text-center">
          <p className="text-xl mb-4">Bem-vindo, {user.displayName}!</p>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
          >
            Sair
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xl mb-4">Faça login para começar.</p>
          <button
            onClick={handleSignIn}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Entrar com Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;