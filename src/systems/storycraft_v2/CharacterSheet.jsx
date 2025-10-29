// src/systems/storycraft_v2/CharacterSheet.jsx

import React, { useState, useMemo } from 'react';
import { useCharacter, useAuth } from '@/hooks';
import { useRollFeed } from '@/context';
import { ModalManager } from '@/components';
// import FloatingNav from './FloatingNav'; // Vamos re-adicionar depois

// NOSSOS NOVOS COMPONENTES DO CORE
import {
    CharacterHeader,
    Attributes,
    Vitals,
    CombatStats,
    SavingThrows,
    SkillsPanel
} from './CorePanels'; // Vamos criar/ajustar este arquivo a seguir

const CharacterSheet = ({ character: initialCharacter, onBack, isMaster }) => {
    const { character, loading, updateCharacterField, toggleSection } = useCharacter(initialCharacter.id, initialCharacter.ownerUid);
    const { addRollToFeed, addMessageToFeed } = useRollFeed();
    const { user } = useAuth();

    const [isEditMode, setIsEditMode] = useState(false);
    const canToggleEditMode = isMaster || (user && user.uid === character?.ownerUid);

    const [modalState, setModalState] = useState({ type: null, props: {} });
    const closeModal = () => setModalState({ type: null, props: {} });

    // Lógica de Buffs (simplificada por enquanto)
    const buffModifiers = useMemo(() => {
        // ... (Podemos manter a lógica de buffModifiers aqui, 
        // pois os novos componentes de atributos vão precisar dela)
        return { attributes: {}, dice: [] };
    }, [character?.buffs]);


    if (loading) { return <div className="text-center p-8"><p className="text-xl text-textSecondary">A carregar ficha...</p></div>; }
    if (!character) { return <div className="text-center p-8"><p className="text-xl text-red-400">Erro: Personagem não encontrado.</p></div>; }

    // NOTA: Para o layout da imagem de fundo, você aplicaria o estilo no 'div' abaixo
    // ex: style={{ backgroundImage: 'url(...)' }}
    return (
        <div className="w-full max-w-5xl mx-auto p-4 font-serif text-[#58452c]">
            <ModalManager modalState={modalState} closeModal={closeModal} />
            {/* <FloatingNav character={character} /> */}

            {/* --- Controles Superiores --- */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="px-4 py-2 bg-bgSurface hover:opacity-80 text-textPrimary font-bold rounded-lg">
                    ← Voltar para a Lista
                </button>
                {canToggleEditMode && (
                    <button onClick={() => setIsEditMode(!isEditMode)} className="px-4 py-2 bg-btnHighlightBg text-btnHighlightText font-bold rounded-lg shadow-lg">
                        {isEditMode ? '🔒 Sair do Modo Edição' : '✏️ Entrar no Modo Edição'}
                    </button>
                )}
            </div>

            {/* --- Navegação Principal (Tabs) --- */}
            {/* TODO: Adicionar os botões "HABILIDADES", "BIO & INFO", "EQUIPAMENTOS" aqui */}
            <div className="flex justify-center gap-4 mb-4">
                 {/* ... tabs ... */}
            </div>

            {/* --- ESTRUTURA DO GRID PRINCIPAL ---
              Vamos usar um grid de 3 colunas.
              - 2 colunas para a área principal (esquerda na imagem)
              - 1 coluna para a sidebar (direita na imagem)
            */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* --- Coluna Principal (Esquerda) --- */}
                <div className="md:col-span-2 space-y-6">
                    
                    <CharacterHeader 
                        character={character} 
                        onUpdate={updateCharacterField} 
                        isEditMode={isEditMode} 
                    />

                    <Attributes 
                        character={character} 
                        onUpdate={updateCharacterField} 
                        isEditMode={isEditMode}
                        buffModifiers={buffModifiers.attributes}
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <CombatStats 
                            character={character} 
                            onUpdate={updateCharacterField} 
                            isEditMode={isEditMode}
                            buffModifiers={buffModifiers.attributes}
                        />
                        {/* Box de Mitigação de Dano (na imagem) está aqui */}
                    </div>

                    <Vitals 
                        character={character} 
                        onUpdate={updateCharacterField} 
                        isEditMode={isEditMode}
                    />
                    
                    {/* TODO: Adicionar aqui depois:
                      - ActionsSection (Ataques)
                      - ListSections (Vantagens, Desvantagens)
                      - Notes (Anotações)
                    */}
                </div>

                {/* --- Coluna da Sidebar (Direita) --- */}
                <div className="md:col-span-1 space-y-6">
                    
                    <SavingThrows 
                        character={character} 
                        onUpdate={updateCharacterField} 
                        isEditMode={isEditMode}
                        buffModifiers={buffModifiers.attributes}
                    />

                    <SkillsPanel 
                        character={character} 
                        onUpdate={updateCharacterField} 
                        isEditMode={isEditMode}
                    />

                    {/* TODO: Adicionar aqui depois:
                      - Inventory (Inventário)
                    */}
                </div>
            </div>
        </div>
    );
};

export default CharacterSheet;