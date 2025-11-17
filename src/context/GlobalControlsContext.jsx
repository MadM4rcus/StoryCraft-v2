import React, { createContext, useState, useContext } from 'react';

const GlobalControlsContext = createContext();

export const useGlobalControls = () => useContext(GlobalControlsContext);

export const GlobalControlsProvider = ({ children }) => {
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Adicionado para manter a ordem
  const [isSecretMode, setIsSecretMode] = useState(false);
  const value = {
    isEditMode,
    setIsEditMode,
    isThemeEditorOpen,
    setIsThemeEditorOpen,
    isSecretMode,
    setIsSecretMode,
  };

  return (
    <GlobalControlsContext.Provider value={value}>
      {children}
    </GlobalControlsContext.Provider>
  );
};