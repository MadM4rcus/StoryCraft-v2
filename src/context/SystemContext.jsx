// src/context/SystemContext.jsx

import React, { createContext, useState, useContext, useMemo } from 'react';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

// Este identificador parece ser fixo para o aplicativo web do Firebase,
// e provavelmente permanece constante entre diferentes "sistemas" (V1/V2) dentro do mesmo projeto.
// Ele é usado como uma sub-coleção dentro da coleção principal de dados de personagem.
const GLOBAL_APP_IDENTIFIER = '1:727724875985:web:97411448885c68c289e5f0';

export const SystemProvider = ({ children }) => {
  // O padrão agora é null para forçar a tela de seleção a aparecer primeiro.
  const [currentSystem, setCurrentSystem] = useState(null); 

  // Define o nome da coleção raiz para os dados de personagem com base no sistema selecionado
  const characterDataCollectionRoot = useMemo(() => {
    switch (currentSystem) {
      case 'v1': return 'artifacts2'; // Dados existentes do StoryCraft V1 estão em 'artifacts2'
      case 'v2': return 'storycraft-v2'; // Novos dados do StoryCraft V2 estarão em 'storycraft-v2'
      default: return 'artifacts2'; // Fallback para V1
    }
  }, [currentSystem]);

  const value = { currentSystem, setCurrentSystem, characterDataCollectionRoot, GLOBAL_APP_IDENTIFIER };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};