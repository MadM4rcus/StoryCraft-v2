// src/context/SystemContext.jsx

import React, { createContext, useState, useContext, useMemo } from 'react';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

// Este identificador parece ser fixo para o aplicativo web do Firebase,
// e provavelmente permanece constante entre diferentes "sistemas" (V1/V2) dentro do mesmo projeto.
// Ele é usado como uma sub-coleção dentro da coleção principal de dados de personagem.
const GLOBAL_APP_IDENTIFIER = '1:727724875985:web:97411448885c68c289e5f0';

// Define o caminho GLOBAL e ÚNICO para todos os dados de sessão (chat, feed, etc.)
const GLOBAL_SESSION_PATH = 'storycraft-v2/default-session';

export const SystemProvider = ({ children }) => {
  // O padrão agora é null para forçar a tela de seleção a aparecer primeiro.
  const [currentSystem, setCurrentSystem] = useState(null); 

  // Novo estado para rastrear o personagem ativo em toda a aplicação
  const [activeCharacter, setActiveCharacter] = useState(null);

  // Define o caminho da coleção para FICHAS DE PERSONAGEM com base no sistema selecionado
  const characterDataCollectionRoot = useMemo(() => {
    switch (currentSystem) {
      case 'v1': return `artifacts2/${GLOBAL_APP_IDENTIFIER}`;
      case 'v2': return `artifacts2/${GLOBAL_APP_IDENTIFIER}`; // V2 também usa artifacts2 para fichas
      default: return null; // Retorna null se nenhum sistema for selecionado
    }
  }, [currentSystem]);

  // Define o caminho da coleção para DADOS DE SESSÃO (chat, feed, etc.), que é sempre o mesmo.
  const sessionDataCollectionRoot = GLOBAL_SESSION_PATH;


  const value = { 
    currentSystem, 
    setCurrentSystem, 
    characterDataCollectionRoot, 
    sessionDataCollectionRoot, 
    GLOBAL_APP_IDENTIFIER, 
    GLOBAL_SESSION_PATH,
    activeCharacter, setActiveCharacter // Exporta o estado e o setter
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};