import React, { useState, useEffect, useRef } from 'react';
import CharacterList from './CharacterList.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import Modal from './Modal.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '../services/firestoreService';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase.js';

const appId = "1:727724875985:web:97411448885c68c289e5f0";

const Dashboard = () => {
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [modal, setModal] = useState({ isVisible: false });
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);

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

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.name || !importedData.mainAttributes) {
            throw new Error("Ficheiro JSON inválido ou incompatível.");
        }
        setModal({
          isVisible: true,
          message: `Deseja criar um novo personagem com os dados de "${importedData.name}"?`,
          type: 'confirm',
          onConfirm: async () => {
            const newCharRef = doc(collection(db, `artifacts2/${appId}/users/${user.uid}/characterSheets`));
            await setDoc(newCharRef, { ...importedData, ownerUid: user.uid, id: newCharRef.id });
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
          alert("Não foi possível excluir a ficha. Verifique a consola para mais detalhes.");
        }
        setModal({ isVisible: false });
      },
      onCancel: () => setModal({ isVisible: false }),
    });
  };

  if (selectedCharacter) {
    return (
      <CharacterSheet 
        character={selectedCharacter} 
        onBack={() => {
          setSelectedCharacter(null);
          fetchCharacters();
        }}
        isMaster={isMaster}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {modal.isVisible && <Modal {...modal} onCancel={() => setModal({ isVisible: false })} />}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      
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
        <CharacterList 
          user={user} // Propriedade que faltava
          onSelectCharacter={setSelectedCharacter}
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
  );
};

export default Dashboard;