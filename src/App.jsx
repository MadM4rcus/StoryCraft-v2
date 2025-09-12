import { useAuth } from './hooks/useAuth'; // 1. Importa o nosso hook

function App() {
  // 2. Usa o hook para pegar as informações e funções de login
  const { user, signInWithGoogle, signOutUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">StoryCraft V2</h1>

      {/* 3. Lógica de exibição condicional */}
      {user ? (
        // Se houver um usuário logado...
        <div className="text-center">
          <p className="text-xl mb-4">
            Bem-vindo, <span className="font-bold text-purple-400">{user.displayName}!</span>
          </p>
          <button
            onClick={signOutUser}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg"
          >
            Sair
          </button>
        </div>
      ) : (
        // Se NÃO houver um usuário logado...
        <div className="text-center">
          <p className="text-xl mb-4">Faça login para começar.</p>
          <button
            onClick={signInWithGoogle}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg"
          >
            Entrar com Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

