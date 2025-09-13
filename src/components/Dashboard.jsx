import React, { useState } from 'react';
import CharacterList from './CharacterList.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import { useAuth } from '../hooks/useAuth.js';

const Dashboard = () => {
  const { user, googleSignOut, isMaster } = useAuth(); // Pega o isMaster do hook
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  if (selectedCharacter) {
    return (
      <CharacterSheet 
        character={selectedCharacter} 
        onBack={() => setSelectedCharacter(null)}
        isMaster={isMaster} // Passa o valor real para a ficha
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Seu Painel</h1>
          <p className="text-gray-400">Bem-vindo, {user.displayName}!</p>
        </div>
        <button
          onClick={googleSignOut}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
        >
          Sair
        </button>
      </header>

      <main>
        <CharacterList onSelectCharacter={setSelectedCharacter} />
      </main>
    </div>
  );
};

export default Dashboard;