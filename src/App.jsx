import React from 'react';
import { useAuth } from './hooks/useAuth.js';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const { user, loading, googleSignIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {user ? (
        // Se o utilizador estiver logado, mostra o Dashboard
        <Dashboard />
      ) : (
        // Se não, mostra a tela de login
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">StoryCraft</h1>
          <p className="text-xl mb-4">Faça login para começar.</p>
          <button
            onClick={googleSignIn}
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