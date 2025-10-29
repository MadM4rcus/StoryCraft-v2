// src/systems/storycraft-v2/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
// import { CharacterList, CharacterSheet } from './index'; // Componentes V2 virão aqui
import { ModalManager, PartyHealthMonitor } from '@/components';
import { useAuth, useSystem } from '@/hooks';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '@/services';

const Dashboard = () => { // Removidas as props relacionadas a temas
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);

  const { currentSystem, setCurrentSystem, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER } = useSystem();
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  const fetchCharacters = async () => {
    if (user) {
      const userCharacters = await getCharactersForUser(user.uid, isMaster && viewingAll, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER);
      setCharacters(userCharacters);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user, viewingAll, isMaster, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER]); // eslint-disable-line react-hooks/exhaustive-deps

  // Placeholder para o futuro
  const handleCreateClick = () => alert("Criação de personagem para V2 em breve!");
  const handleImportClick = () => alert("Importação para V2 em breve!");
  const handleDeleteClick = () => alert("Deleção para V2 em breve!");

  const partyMonitor = <PartyHealthMonitor onCharacterClick={setSelectedCharacter} />;

  // Renderização temporária enquanto o V2 está em construção
  if (true) { // Mantenha `true` para mostrar a mensagem de construção
    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8 text-center">
            <h1 className="text-3xl font-bold text-textPrimary mb-4">Dashboard StoryCraft V2</h1>
            <p className="text-textSecondary">
                Este espaço está reservado para a nova e empolgante versão do sistema de fichas!
            </p>
            <p className="text-textSecondary mt-2">
                O monitor de vida do grupo abaixo já está funcionando com as fichas V2 que você criar.
            </p>
            <div className="mt-8">
                {partyMonitor}
            </div>
        </div>
    );
  }

  // O código abaixo é um placeholder para quando o Dashboard V2 for implementado
  return (
    <>
      {partyMonitor}
      {selectedCharacter ? (
        // <CharacterSheetV2 character={selectedCharacter} onBack={() => setSelectedCharacter(null)} isMaster={isMaster} />
        <div>Ficha V2 selecionada: {selectedCharacter.name}</div>
      ) : (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
          <ModalManager modalState={modalState} closeModal={closeModal} />
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-textPrimary">Painel StoryCraft V2</h1>
              <p className="text-textSecondary">Bem-vindo, {user.displayName}!</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentSystem(null)}
                className="px-4 py-2 bg-bgElement hover:bg-opacity-80 text-textPrimary font-semibold rounded-lg shadow-lg"
              >
                Trocar Sistema
              </button>
              <button onClick={googleSignOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">Sair</button>
            </div>
          </header>
          <main>
            {/* <CharacterListV2 ... /> */}
            <div>Lista de Personagens V2 aqui.</div>
          </main>
        </div>
      )}
    </>
  );
};

export default Dashboard;