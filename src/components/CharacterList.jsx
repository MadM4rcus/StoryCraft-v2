import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCharactersForUser, createNewCharacter } from '../services/firestoreService';

const CharacterList = ({ onSelectCharacter }) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar os personagens do Firestore
  const fetchCharacters = async () => {
    if (user) {
      setIsLoading(true);
      const userCharacters = await getCharactersForUser(user.uid);
      setCharacters(userCharacters);
      setIsLoading(false);
    }
  };

  // Carrega os personagens quando o componente aparece
  useEffect(() => {
    fetchCharacters();
  }, [user]);

  // Função para o botão de criar personagem
  const handleCreateCharacter = async () => {
    if (user) {
      const newCharacter = await createNewCharacter(user.uid);
      if (newCharacter) {
        // Se um personagem foi criado, atualiza a lista
        fetchCharacters();
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-full">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Meus Personagens</h2>
      
      {isLoading ? (
        <p className="text-gray-400 italic">A carregar...</p>
      ) : characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-gray-700 p-4 rounded-md flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white">{char.name}</h3>
                <p className="text-sm text-gray-300">Nível: {char.level || '1'}</p>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => onSelectCharacter(char)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
                >
                  Ver/Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Nenhum personagem encontrado. Crie um novo!</p>
      )}

      <div className="mt-6 text-center">
        <button 
          onClick={handleCreateCharacter}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md"
        >
          Criar Novo Personagem
        </button>
      </div>
    </div>
  );
};

export default CharacterList;