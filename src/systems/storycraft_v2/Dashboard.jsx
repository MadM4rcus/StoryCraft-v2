// src/systems/storycraft_v2/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
// 1. IMPORTAÇÕES AJUSTADAS
// Reutilizamos o CharacterList do V1, pois a aparência é a mesma
import CharacterList from '@/systems/storycraft/CharacterList'; 
// Importamos nossa *nova* ficha clássica V2
import ClassicSheet from './ClassicSheet'; 
// Componentes globais reutilizados
import { ModalManager, ThemeEditor, PartyHealthMonitor } from '@/components';
import { useAuth, useSystem } from '@/hooks';
import { getCharactersForUser, createNewCharacter, deleteCharacter, getThemeById, db } from '@/services';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

const DashboardV2 = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);
  
  // O ThemeEditor não será usado por este painel, mas mantemos a lógica para consistência da prop
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const handleCloseEditor = () => {
    setIsThemeEditorOpen(false);
    setPreviewTheme(null);
  };
  
  const { currentSystem, setCurrentSystem, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER } = useSystem();
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  // NOTA: O V2 não usa temas dinâmicos (activeTheme), 
  // então podemos remover o useEffect de 'onSnapshot' que buscava o tema.
  // Deixei comentado caso queiramos reativar para algo no futuro.
  /*
  useEffect(() => {
    if (selectedCharacter?.id && selectedCharacter?.ownerUid) {
        const unsubscribe = onSnapshot(doc(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users/${selectedCharacter.ownerUid}/characterSheets/${selectedCharacter.id}`), async (docSnap) => {
            if (docSnap.exists()) {
                // Lógica de tema V1 removida
            }
        });
        return () => unsubscribe();
    } else {
        // Lógica de tema V1 removida
    }
  }, [selectedCharacter, setActiveTheme, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER, db, getThemeById]);
  */

  const handleCharacterClickFromMonitor = (character) => {
    setSelectedCharacter(character);
  };

  const fetchCharacters = async () => {
    if (user) {
      console.log(`%c[DIAGNÓSTICO DASHBOARD V2]`, 'color: #f59e0b; font-weight: bold;', `Buscando fichas V2. isMaster: ${isMaster}, viewingAll: ${viewingAll}`);
      const userCharacters = await getCharactersForUser(user.uid, isMaster && viewingAll, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER);
      setCharacters(userCharacters);
    }
  };
  useEffect(() => {
    fetchCharacters();
  }, [user, viewingAll, isMaster, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateClick = async () => {
    const newChar = await createNewCharacter(user.uid, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER);
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
              const newCharRef = doc(collection(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users/${user.uid}/characterSheets`));
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
    const ownerId = charToDelete.ownerUid || user.uid;
    setModalState({
      type: 'confirm',
      props: {
        message: `Tem a certeza que deseja excluir permanentemente a ficha de "${charToDelete.name}" do sistema ${currentSystem.toUpperCase()}?`,
        onConfirm: async () => {
          const success = await deleteCharacter(ownerId, charToDelete.id, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER);
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

  // O PartyMonitor é global e funciona para ambos os sistemas
  const partyMonitor = <PartyHealthMonitor onCharacterClick={handleCharacterClickFromMonitor} />;

  return (
    <>
      {partyMonitor}
      
      {/* O Editor de Temas V1 não é relevante para o V2, então o botão foi removido */}
      {/* {isThemeEditorOpen && <ThemeEditor ... />} */}

      {selectedCharacter ? (
        // 2. A MUDANÇA PRINCIPAL
        // Em vez de <CharacterSheet...>, chamamos o <ClassicSheet...>
        <ClassicSheet character={selectedCharacter} onBack={() => setSelectedCharacter(null)} isMaster={isMaster} />
      ) : (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
          <ModalManager modalState={modalState} closeModal={closeModal} />
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <header className="flex justify-between items-center mb-8">
            <div>
              {/* 3. MUDANÇA DE TÍTULO */}
              <h1 className="text-2xl font-bold text-textPrimary">Painel StoryCraft V2 (Clássico)</h1>
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
            {/* Reutilizamos o CharacterList do V1 */}
            <CharacterList user={user} onSelectCharacter={setSelectedCharacter} handleImportClick={handleImportClick} handleDeleteClick={handleDeleteClick} handleCreateClick={handleCreateClick} characters={characters} isMaster={isMaster} viewingAll={viewingAll} onToggleView={setViewingAll} />
          </main>
        </div>
      )}
    </>
  );
};

export default DashboardV2;