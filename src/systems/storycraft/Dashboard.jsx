// src/systems/storycraft/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import CharacterList from './CharacterList';
import CharacterSheet from './CharacterSheet';
import ModalManager from '@/components/ModalManager';
import ThemeEditor from '@/components/ThemeEditor';
import PartyHealthMonitor from '@/components/PartyHealthMonitor';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { useUIState } from '@/context/UIStateContext'; // Importar o contexto de UI
import { useGlobalControls } from '@/context/GlobalControlsContext'; // 1. Importar o contexto dos controles
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '@/services/firestoreService';
import { getThemeById } from '@/services/themeService';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const Dashboard = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();  
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);  
  const { isPartyHealthMonitorVisible } = useUIState(); // Pega o estado de visibilidade
  const { isThemeEditorOpen, setIsThemeEditorOpen } = useGlobalControls(); // 2. Usar o estado global

  const { currentSystem, setCurrentSystem, characterDataCollectionRoot, activeCharacter, setActiveCharacter } = useSystem();
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  useEffect(() => {
    if (activeCharacter?.id && activeCharacter?.ownerUid) {
        // CORREÇÃO: O characterDataCollectionRoot já contém o caminho completo.
        const unsubscribe = onSnapshot(doc(db, `${characterDataCollectionRoot}/users/${activeCharacter.ownerUid}/characterSheets/${activeCharacter.id}`), async (docSnap) => {
            if (docSnap.exists()) {
                const characterData = docSnap.data();
                if (characterData.activeThemeId) {
                    const theme = await getThemeById(characterData.activeThemeId);
                    setActiveTheme(theme);
                } else {
                    setActiveTheme(null);
                }
            }
        });
        return () => unsubscribe();
    } else {
      setActiveTheme(null); // Limpa o tema se não houver personagem ativo
    }
  }, [activeCharacter, setActiveTheme, characterDataCollectionRoot, db]);

  const handleCloseEditor = () => {
    setIsThemeEditorOpen(false);
    setPreviewTheme(null); // Limpa a pré-visualização ao fechar
  };

  const handleCharacterClickFromMonitor = (character) => {
    setActiveCharacter(character);
  };

  const fetchCharacters = async () => {
    if (user) {
      // FERRAMENTA DE DIAGNÓSTICO
      console.log('%c[DIAGNÓSTICO DASHBOARD]', 'color: #00A8E8; font-weight: bold;', `Buscando fichas. isMaster: ${isMaster}, viewingAll: ${viewingAll}`);
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
              const newCharRef = doc(collection(db, `${characterDataCollectionRoot}/users/${user.uid}/characterSheets`));
              const finalData = { ...importedData, ownerUid: user.uid, system: currentSystem }; // Adiciona o sistema ao personagem importado
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

  const handleExportClick = (charToExport) => {
    const { collapsedStates, ...exportData } = charToExport;
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${charToExport.name || 'ficha'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const partyMonitor = isPartyHealthMonitorVisible ? <PartyHealthMonitor onCharacterClick={handleCharacterClickFromMonitor} /> : null;

  return (
    <>
      {partyMonitor} {/* Renderiza o monitor condicionalmente */}
      {isThemeEditorOpen && <ThemeEditor character={activeCharacter} originalTheme={activeTheme} setPreviewTheme={setPreviewTheme} onClose={handleCloseEditor} />}

      {activeCharacter ? (
        <CharacterSheet character={activeCharacter} onBack={() => setActiveCharacter(null)} isMaster={isMaster} />
      ) : (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <ModalManager modalState={modalState} closeModal={closeModal} />
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Painel StoryCraft V1</h1>
          <p className="text-textSecondary">Bem-vindo, {user.displayName}!</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Botão para voltar à tela de seleção de sistema */}
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
        <CharacterList user={user} onSelectCharacter={setActiveCharacter} handleImportClick={handleImportClick} handleDeleteClick={handleDeleteClick} handleCreateClick={handleCreateClick} characters={characters} isMaster={isMaster} viewingAll={viewingAll} onToggleView={setViewingAll} onExportClick={handleExportClick} />
      </main>
    </div>
      )}
    </>
  );
};

export default Dashboard;