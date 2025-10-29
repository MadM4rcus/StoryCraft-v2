// src/systems/storycraft_v2/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { CharacterList, CharacterSheet } from './'; // Importa os componentes V2
import { ModalManager, PartyHealthMonitor } from '@/components';
import { useAuth, useSystem } from '@/hooks';
import { getCharactersForUser, deleteCharacter, db } from '@/services'; // Trazemos o 'db' para criar
import { doc, setDoc, collection } from 'firebase/firestore'; // Importações do Firebase para criar/importar

// Este é o schema inicial para uma *nova* ficha V2
const DEFAULT_V2_CHARACTER_SCHEMA = {
    name: "Novo Personagem",
    system: "storycraft_v2", // Identificador do sistema
    level: 1,
    race: "",
    class: "",
    escala: "",
    deslocamento: "",
    tendencias: "",
    tamanho: "",
    
    // Baseado no CorePanels.jsx V2
    mainAttributes: { FOR: 10, DES: 10, CON: 10, SAB: 10, INT: 10, CAR: 10 },
    vitals: {
        hp: { base: 10, nivel: 0, bonus: 0 },
        mp: { base: 10, nivel: 0, bonus: 0 },
        temporarios: 0,
        experiencia: 0,
        inspiracao: 0
    },
    savingThrows: {
        fortitude: { mod: 0, nvl: 0, bonus: 0 },
        vontade: { mod: 0, nvl: 0, bonus: 0 },
        reflexos: { mod: 0, nvl: 0, bonus: 0 }
    },
    combatStats: {
        iniciativa: { bve: 0 },
        evasao: { bve: 0 },
        mitigacao: { equip: 0 }
    },

    // Seções de lista (começam vazias)
    pericias: [],
    vantagens: [],
    desvantagens: [],
    anotacoes: [],
    ataques: [],
    inventario: [],
};


const Dashboard = () => {
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
            // Isso já filtra pelo 'currentSystem' (storycraft_v2) graças ao useSystem
            const userCharacters = await getCharactersForUser(user.uid, isMaster && viewingAll, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER);
            setCharacters(userCharacters);
        }
    };

    // Busca personagens ao carregar
    useEffect(() => {
        fetchCharacters();
    }, [user, viewingAll, isMaster, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- AÇÕES DO DASHBOARD ---

    const handleCreateClick = async () => {
        if (!user) return;
        
        const newCharData = {
            ...DEFAULT_V2_CHARACTER_SCHEMA,
            ownerUid: user.uid,
            // 'system' já está no schema padrão
        };

        try {
            // Cria a referência para o novo documento
            const newCharRef = doc(collection(db, `${characterDataCollectionRoot}/${GLOBAL_APP_IDENTIFIER}/users/${user.uid}/characterSheets`));
            
            // Define o documento com o schema V2
            await setDoc(newCharRef, newCharData);
            
            // Atualiza a lista de personagens na tela
            fetchCharacters();
            
        } catch (error) {
            console.error("Erro ao criar novo personagem V2:", error);
            setModalState({ type: 'info', props: { message: `Erro ao criar ficha: ${error.message}`, onConfirm: closeModal } });
        }
    };
    
    // Lógica de Importação (copiada do V1, totalmente compatível)
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
                            
                            // Garante que os dados importados tenham o UID e o Sistema corretos
                            const finalData = { 
                                ...importedData, 
                                ownerUid: user.uid, 
                                system: currentSystem 
                            };
                            delete finalData.id; // Remove ID antigo se existir
                            
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

    // Lógica de Deleção (copiada do V1, totalmente compatível)
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

    const partyMonitor = <PartyHealthMonitor onCharacterClick={setSelectedCharacter} />;

    return (
        <>
            {partyMonitor}
            {selectedCharacter ? (
                // 1. RENDERIZA A FICHA V2
                <CharacterSheet 
                    character={selectedCharacter} 
                    onBack={() => setSelectedCharacter(null)} 
                    isMaster={isMaster} 
                />
            ) : (
                // 2. RENDERIZA A LISTA DE FICHAS
                <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
                    <ModalManager modalState={modalState} closeModal={closeModal} />
                    
                    {/* Input oculto para importação */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

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
                        {/* Renderiza o CharacterList V2 */}
                        <CharacterList 
                            user={user} 
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
            )}
        </>
    );
};

export default Dashboard;