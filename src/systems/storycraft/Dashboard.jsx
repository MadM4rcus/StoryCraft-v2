// src/systems/storycraft/Dashboard.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import CharacterList from './CharacterList';
import CharacterSheet from './CharacterSheet';
import ModalManager from '@/components/ModalManager';
import ThemeEditor from '@/components/ThemeEditor';
import PartyHealthMonitor from '@/components/EventManager'; // Já está sendo usado
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { useUIState } from '@/context/UIStateContext'; // Corrigido
import { useGlobalControls } from '@/context/GlobalControlsContext'; // 1. Importar o contexto dos controles
import { getCharactersForUser, createNewCharacter, deleteCharacter } from '@/services/firestoreService';
import { getThemeById } from '@/services/themeService';
import { doc, setDoc, collection, onSnapshot, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/services/firebase';

const Dashboard = ({ activeTheme, setActiveTheme, setPreviewTheme }) => {
  const { user, googleSignOut, isMaster } = useAuth();  
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);
  const [viewingAll, setViewingAll] = useState(false);  
  const { isPartyHealthMonitorVisible, isSpoilerMode } = useUIState(); // Corrigido
  const { isThemeEditorOpen, setIsThemeEditorOpen } = useGlobalControls();
  const [activeFilters, setActiveFilters] = useState([]); // NOVO: Estado para os filtros de flag ativos
  const [sortOrder, setSortOrder] = useState('creationDate'); // 'creationDate', 'name', 'flags'

  const { currentSystem, setCurrentSystem, characterDataCollectionRoot, activeCharacter, setActiveCharacter } = useSystem();
  const [modalState, setModalState] = useState({ type: null, props: {} });
  const closeModal = () => setModalState({ type: null, props: {} });

  // Otimização: Armazena o ID do tema ativo em um estado local.
  const [activeThemeId, setActiveThemeId] = useState(null);

  useEffect(() => {
    if (activeCharacter?.id && activeCharacter?.ownerUid) {
      // Este listener apenas atualiza o ID do tema ativo, sem buscar o tema completo.
      // Isso evita leituras no Firestore a cada mudança na ficha.
      const unsubscribe = onSnapshot(doc(db, `${characterDataCollectionRoot}/users/${activeCharacter.ownerUid}/characterSheets/${activeCharacter.id}`), (docSnap) => {
        setActiveThemeId(docSnap.exists() ? docSnap.data().activeThemeId : null);
      });
      return () => unsubscribe();
    } else {
      // Limpa o ID e o tema se não houver personagem ativo
      setActiveThemeId(null);
      setActiveTheme(null);
    }
  }, [activeCharacter, characterDataCollectionRoot]);

  // Este novo useEffect só executa a busca do tema quando o ID do tema realmente mudar.
  useEffect(() => {
    if (activeThemeId) {
      getThemeById(activeThemeId).then(setActiveTheme);
    } else {
      setActiveTheme(null);
    }
  }, [activeThemeId, setActiveTheme]);

  const handleCloseEditor = () => {
    setIsThemeEditorOpen(false);
    setPreviewTheme(null); // Limpa a pré-visualização ao fechar
  };

  const handleCharacterClickFromMonitor = (character) => {
    setActiveCharacter(character);
  };

  const fetchCharacters = async () => {
    if (user) {
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

  // Coleta todas as flags customizadas de todos os personagens para sugestão
  const allCustomFlags = useMemo(() => {
    const flagSet = new Set();
    characters.forEach(char => {
      if (char.flags) {
        Object.keys(char.flags).forEach(flag => {
          if (flag !== 'spoiler') flagSet.add(flag);
        });
      }
    });
    return Array.from(flagSet).sort();
  }, [characters]);

  const handleToggleFlag = async (char, flagName, isAdding) => {
    const ownerId = char.ownerUid || user.uid;

    const newFlags = { ...(char.flags || {}) };
    if (isAdding) newFlags[flagName] = true;
    else delete newFlags[flagName];

    try {
      const charRef = doc(db, `${characterDataCollectionRoot}/users/${ownerId}/characterSheets`, char.id);
      if (Object.keys(newFlags).length === 0) {
        await updateDoc(charRef, { flags: deleteField() });
      } else {
        await updateDoc(charRef, { flags: newFlags });
      }
      setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, flags: newFlags } : c));
    } catch (error) {
      console.error("Erro ao atualizar a flag:", error);
      alert(`Não foi possível atualizar a flag "${flagName}".`);
    }
  };

  const handleFilterToggle = (flagName) => {
    setActiveFilters(prev =>
      prev.includes(flagName)
        ? prev.filter(f => f !== flagName)
        : [...prev, flagName]
    );
  };

  // Lógica de Filtragem e Ordenação combinada
  const filteredAndSortedCharacters = useMemo(() => {
    const filtered = characters.filter(char => {
      if (activeFilters.length === 0) return true;
      // Mostra apenas personagens que possuem TODAS as flags ativas no filtro
      return activeFilters.every(filter => char.flags && char.flags[filter]);
    });

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'flags') {
        const getFlagsString = (char) => {
          if (!char.flags) return '';
          return Object.keys(char.flags)
            .filter(flag => flag !== 'spoiler')
            .sort()
            .join(',');
        };

        const flagsA = getFlagsString(a);
        const flagsB = getFlagsString(b);

        // CORREÇÃO: Fichas sem flags customizadas devem ir para o final.
        if (flagsA && !flagsB) return -1; // 'a' tem flags, 'b' não tem -> 'a' vem primeiro.
        if (!flagsA && flagsB) return 1;  // 'b' tem flags, 'a' não tem -> 'b' vem primeiro.

        // Se ambas têm (ou não têm) flags, ordena pela string de flags.
        if (flagsA !== flagsB) return flagsA.localeCompare(flagsB);
        // Se as flags forem idênticas, ordena por nome como desempate.
        return a.name.localeCompare(b.name);
      }
      const timeA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
      return timeB - timeA; // Ordena do mais novo para o mais antigo
    });
  });

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
        {/* --- NOVA SEÇÃO DE FILTROS E ORDENAÇÃO --- */}
        {isMaster && (
          <div className="bg-bgElement/50 p-4 rounded-lg mb-6 border border-bgInput">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Controles de Filtro */}
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-2">Filtrar por Flags</h4>
                {allCustomFlags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allCustomFlags.map(flag => (
                      <button
                        key={flag}
                        onClick={() => handleFilterToggle(flag)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${activeFilters.includes(flag) ? 'bg-blue-600 text-white' : 'bg-bgSurface text-textPrimary hover:bg-opacity-80'}`}
                      >
                        {flag}
                      </button>
                    ))}
                    {activeFilters.length > 0 && (
                      <button onClick={() => setActiveFilters([])} className="px-3 py-1 text-sm font-medium text-red-400 hover:text-red-300">Limpar</button>
                    )}
                  </div>
                ) : <p className="text-xs text-textSecondary italic">Nenhuma flag customizada foi criada ainda.</p>}
              </div>
              {/* Controles de Ordenação */}
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-2">Ordenar por</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSortOrder('creationDate')} className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${sortOrder === 'creationDate' ? 'bg-blue-600 text-white' : 'bg-bgSurface text-textPrimary hover:bg-opacity-80'}`}>Data</button>
                  <button onClick={() => setSortOrder('name')} className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${sortOrder === 'name' ? 'bg-blue-600 text-white' : 'bg-bgSurface text-textPrimary hover:bg-opacity-80'}`}>Nome</button>
                  <button onClick={() => setSortOrder('flags')} className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${sortOrder === 'flags' ? 'bg-blue-600 text-white' : 'bg-bgSurface text-textPrimary hover:bg-opacity-80'}`}>Flags</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <CharacterList 
          user={user} 
          onSelectCharacter={setActiveCharacter} 
          handleImportClick={handleImportClick} 
          handleDeleteClick={handleDeleteClick} 
          handleCreateClick={handleCreateClick} 
          characters={filteredAndSortedCharacters} // Usa a lista filtrada e ordenada
          isMaster={isMaster} 
          viewingAll={viewingAll} 
          onToggleView={setViewingAll} 
          onExportClick={handleExportClick}
          onToggleFlag={handleToggleFlag} // Passa a nova função genérica
          isSpoilerMode={isSpoilerMode} // Passa o modo spoiler
          allCustomFlags={allCustomFlags} // Passa a lista de flags existentes
        />
      </main>
    </div>
      )}
    </>
  );
};

export default Dashboard;