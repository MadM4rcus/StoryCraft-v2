// src/systems/storycraft_v2/ClassicDashboard.jsx
// --- VERSÃO CORRIGIDA (Fluxo Correto de Usuário) ---

import React, { useState, useEffect, useRef } from 'react';
import CharacterList from '@/systems/storycraft/CharacterList';
import ClassicSheet from './ClassicSheet'; // 1. DESCOMENTADO - A ficha real
import ClassicSheetAdjuster from './ClassicSheetAdjuster'; // 2. MANTIDO - A ferramenta de GM
import ModalManager from '@/components/ModalManager';
import ThemeEditor from '@/components/ThemeEditor';
import PartyHealthMonitor from '@/components/EventManager';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '@/services/firestoreService';
import { getThemeById } from '@/services/themeService';
import { db } from '@/services/firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

const DashboardV2 = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // 3. NOVO ESTADO para controlar a ferramenta de layout
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);
  
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const handleCloseEditor = () => {
    setIsThemeEditorOpen(false);
    setPreviewTheme(null);
  };
  
  const { currentSystem, setCurrentSystem, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER } = useSystem();
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  /* ... (o useEffect de tema comentado permanece o mesmo) ... */

  const handleCharacterClickFromMonitor = (character) => {
    setSelectedCharacter(character);
    setIsAdjusterOpen(false); // Garante que a ferramenta feche
  };

  const fetchCharacters = async () => {
    if (user) {
      console.log(`%c[DIAGNÓSTICO DASHBOARD V2]`, 'color: #f59e0b; font-weight: bold;', `Buscando fichas V2. isMaster: ${isMaster}, viewingAll: ${viewingAll}`);
      const userCharacters = await getCharactersForUser(characterDataCollectionRoot, user.uid, isMaster && viewingAll);
      setCharacters(userCharacters);
    }
  };
  useEffect(() => {
    fetchCharacters();
  }, [user, viewingAll, isMaster, characterDataCollectionRoot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateClick = async () => {
    const newChar = await createNewCharacter(characterDataCollectionRoot, user.uid);
    if (newChar) {
      fetchCharacters();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    // ... (função original sem alterações)
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.name) {
          throw new Error("Ficheiro JSON inválido ou incompatível.");
        }
        setModalState({
          type: 'confirm',
          props: {
            message: `Deseja criar um novo personagem para o sistema ${currentSystem.toUpperCase()} com os dados de "${importedData.name}"?`,
            onConfirm: async () => {
              const newCharRef = doc(collection(db, `${basePath}/users/${user.uid}/characterSheets`));
              const finalData = { ...importedData, ownerUid: user.uid, system: currentSystem };
              delete finalData.id;
              await setDoc(newCharRef, finalData);
              fetchCharacters();
              closeModal();
            },
            onCancel: closeModal,
          }
        });
      } catch (error) {
        setModalState({ type: 'info', props: { message: `Erro ao ler arquivo: ${error.message}`, onConfirm: closeModal } });
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleDeleteClick = (charToDelete) => {
    // ... (função original sem alterações)
    const ownerId = charToDelete.ownerUid || user.uid;
    setModalState({
      type: 'confirm',
      props: {
        message: `Tem a certeza que deseja excluir permanentemente a ficha de "${charToDelete.name}" do sistema ${currentSystem.toUpperCase()}?`,
        onConfirm: async () => {
          const success = await deleteCharacter(characterDataCollectionRoot, ownerId, charToDelete.id);
          if (success) {
            setCharacters(prevChars => prevChars.filter(c => c.id !== charToDelete.id));
          } else {
            alert("Não foi possível excluir a ficha.");
          }
          closeModal();
        },
        onCancel: closeModal,
      }
    });
  };

  const partyMonitor = <PartyHealthMonitor onCharacterClick={handleCharacterClickFromMonitor} />;

  // 4. LÓGICA DE RENDERIZAÇÃO CORRIGIDA
  // Prioridade:
  // 1. A ferramenta de GM está aberta?
  // 2. Uma ficha de personagem está selecionada?
  // 3. Senão, mostrar o painel (lista de personagens).
  
  if (isAdjusterOpen) {
    return (
      <ClassicSheetAdjuster 
        onBack={() => setIsAdjusterOpen(false)} 
      />
    );
  }

  if (selectedCharacter) {
    return (
      <>
        {partyMonitor} 
        <ClassicSheet 
          character={selectedCharacter} 
          onBack={() => setSelectedCharacter(null)} 
          isMaster={isMaster} 
        />
      </>
    );
  }

  // Se nenhum dos acima for verdadeiro, mostra o Dashboard (lista)
  return (
    <>
      {partyMonitor}
      
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
        <ModalManager modalState={modalState} closeModal={closeModal} />
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">Painel StoryCraft V2 (Clássico)</h1>
            <p className="text-textSecondary">Bem-vindo, {user.displayName}!</p>
          </div>
          <div className="flex items-center gap-4">
            
            {/* 5. NOVO BOTÃO (SÓ PARA GM) */}
            {isMaster && (
              <button
                onClick={() => setIsAdjusterOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-lg"
                title="Ajustar Layout da Ficha (GM)"
              >
                Ajustar Layout
              </button>
            )}

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
          <CharacterList 
            user={user} 
            onSelectCharacter={setSelectedCharacter} // Ação de clique normal
            handleImportClick={handleImportClick} 
            handleDeleteClick={handleDeleteClick} 
            handleCreateClick={handleCreateClick} 
            characters={characters} 
            isMaster={isMaster} 
            viewingAll={viewingAll} 
            onToggleView={setViewingAll} 
          />
        </main>
      </div>
    </>
  );
};

export default DashboardV2;