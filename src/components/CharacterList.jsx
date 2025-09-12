import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCharactersForUser, createNewCharacter } from '../services/firestoreService';

const CharacterList = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar os personagens
  const fetchCharacters = async () => {
    if (user) {
      setIsLoading(true);
      const userCharacters = await getCharactersForUser(user.uid);
      setCharacters(userCharacters);
      setIsLoading(false);
    }
  };

  // useEffect para carregar os personagens quando o componente é montado
  useEffect(() => {
    fetchCharacters();
  }, [user]);

  // Função para o botão de criar personagem
  const handleCreateCharacter = async () => {
    if (user) {
      const newCharacter = await createNewCharacter(user.uid);
      if (newCharacter) {
        fetchCharacters(); // Atualiza a lista após a criação
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Meus Personagens</h2>
      
      {isLoading ? (
        <p className="text-gray-400 italic">A carregar a lista de personagens...</p>
      ) : characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-gray-700 p-4 rounded-md">
              <h3 className="font-bold text-white">{char.name}</h3>
              {/* Tentamos deserializar os dados para exibição */}
              <p className="text-sm text-gray-300">Nível: {
                (() => {
                  try {
                    return JSON.parse(char.mainAttributes).level || char.level || 'N/A';
                  } catch (e) {
                    return char.level || 'N/A';
                  }
                })()
              }</p>
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