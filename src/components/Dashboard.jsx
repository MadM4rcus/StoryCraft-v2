// src/components/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import CharacterList from './CharacterList.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import Modal from './Modal.jsx';
import ThemeEditor from './ThemeEditor.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '../services/firestoreService';
import { getThemeById } from '../services/themeService';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

const Dashboard = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [modal, setModal] = useState({ isVisible: false });
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);

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
        setModal({
          isVisible: true,
          message: `Deseja criar um novo personagem com os dados de "${importedData.name}"?`,
          type: 'confirm',
          onConfirm: async () => {
            const newCharRef = doc(collection(db, `artifacts2/${appId}/users/${user.uid}/characterSheets`));
            const finalData = { ...importedData, ownerUid: user.uid };
            delete finalData.id;
            await setDoc(newCharRef, finalData);
            fetchCharacters();
            setModal({ isVisible: false });
          },
          onCancel: () => setModal({ isVisible: false }),
        });
      } catch (error) {
        setModal({ isVisible: true, message: `Erro ao ler arquivo: ${error.message}`, type: 'info', onConfirm: () => setModal({ isVisible: false }) });
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleDeleteClick = (charToDelete) => {
    const ownerId = charToDelete.ownerUid || user.uid;
    setModal({
      isVisible: true,
      message: `Tem a certeza que deseja excluir permanentemente a ficha de "${charToDelete.name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        const success = await deleteCharacter(ownerId, charToDelete.id);
        if (success) {
          setCharacters(prevChars => prevChars.filter(c => c.id !== charToDelete.id));
        } else {
          alert("Não foi possível excluir a ficha.");
        }
        setModal({ isVisible: false });
      },
      onCancel: () => setModal({ isVisible: false }),
    });
  };

  if (selectedCharacter) {
    return (
      <>
        {isThemeEditorOpen && <ThemeEditor character={selectedCharacter} originalTheme={activeTheme} setPreviewTheme={setPreviewTheme} onClose={handleCloseEditor} />}
        <button onClick={() => setIsThemeEditorOpen(true)} className="fixed top-4 right-4 z-[60] px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg shadow-lg">Editor de Temas</button>
        <CharacterSheet character={selectedCharacter} onBack={() => setSelectedCharacter(null)} isMaster={isMaster} />
      </>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {modal.isVisible && <Modal {...modal} onCancel={() => setModal({ isVisible: false })} />}
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
  );
};

export default Dashboard;