// src/components/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { CharacterList, CharacterSheet } from './index';
import { ModalManager, ThemeEditor, PartyHealthMonitor } from '@/components';
import { useAuth } from '@/hooks';
import { getCharactersForUser, createNewCharacter, deleteCharacter, getThemeById, db } from '@/services';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

const Dashboard = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);

  // NOVO ESTADO UNIFICADO PARA MODAIS DO DASHBOARD
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  useEffect(() => {
    if (selectedCharacter?.id && selectedCharacter?.ownerUid) {
        const charRef = doc(db, `artifacts2/${appId}/users/${selectedCharacter.ownerUid}/characterSheets/${selectedCharacter.id}`);
        const unsubscribe = onSnapshot(charRef, async (docSnap) => {
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
        setActiveTheme(null);
    }
  }, [selectedCharacter, setActiveTheme]);

  const handleCloseEditor = () => {
    setIsThemeEditorOpen(false);
    setPreviewTheme(null);
  };

  const handleCharacterClickFromMonitor = (character) => {
    setSelectedCharacter(character);
  };

  const fetchCharacters = async () => {
    if (user) {
      const userCharacters = await getCharactersForUser(user.uid, isMaster && viewingAll);
      setCharacters(userCharacters);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user, viewingAll, isMaster]);

  const handleCreateClick = async () => {
    const newChar = await createNewCharacter(user.uid);
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
        // ATUALIZADO PARA USAR O NOVO SISTEMA DE MODAL
        setModalState({
          type: 'confirm',
          props: {
            message: `Deseja criar um novo personagem com os dados de "${importedData.name}"?`,
            onConfirm: async () => {
              const newCharRef = doc(collection(db, `artifacts2/${appId}/users/${user.uid}/characterSheets`));
              const finalData = { ...importedData, ownerUid: user.uid };
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
    // ATUALIZADO PARA USAR O NOVO SISTEMA DE MODAL
    setModalState({
      type: 'confirm',
      props: {
        message: `Tem a certeza que deseja excluir permanentemente a ficha de "${charToDelete.name}"?`,
        onConfirm: async () => {
          const success = await deleteCharacter(ownerId, charToDelete.id);
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

  if (selectedCharacter) {
    return (
      <>
        {isMaster && <PartyHealthMonitor onCharacterClick={handleCharacterClickFromMonitor} />}
        {isThemeEditorOpen && <ThemeEditor character={selectedCharacter} originalTheme={activeTheme} setPreviewTheme={setPreviewTheme} onClose={handleCloseEditor} />}
        <button onClick={() => setIsThemeEditorOpen(true)} className="fixed top-4 right-4 z-[60] px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg shadow-lg">Editor de Temas</button>
        <CharacterSheet character={selectedCharacter} onBack={() => setSelectedCharacter(null)} isMaster={isMaster} />
      </>
    );
  }

  return (
    <>
      {isMaster && <PartyHealthMonitor onCharacterClick={handleCharacterClickFromMonitor} />}
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* RENDERIZA O NOVO GERENCIADOR DE MODAIS */}
      <ModalManager modalState={modalState} closeModal={closeModal} />
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      {isThemeEditorOpen && <ThemeEditor originalTheme={activeTheme} setPreviewTheme={setPreviewTheme} onClose={handleCloseEditor} />}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Seu Painel</h1>
          <p className="text-textSecondary">Bem-vindo, {user.displayName}!</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsThemeEditorOpen(true)} className="px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-semibold rounded-lg">Editor de Temas</button>
          <button onClick={googleSignOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">Sair</button>
        </div>
      </header>
      <main>
        <CharacterList user={user} onSelectCharacter={setSelectedCharacter} handleImportClick={handleImportClick} handleDeleteClick={handleDeleteClick} handleCreateClick={handleCreateClick} characters={characters} isMaster={isMaster} viewingAll={viewingAll} onToggleView={setViewingAll} />
      </main>
    </div>
    </>
  );
};

export default Dashboard;