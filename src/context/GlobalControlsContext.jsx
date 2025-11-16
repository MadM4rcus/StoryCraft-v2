import React, { createContext, useState, useContext } from 'react';

const GlobalControlsContext = createContext();

export const useGlobalControls = () => useContext(GlobalControlsContext);

export const GlobalControlsProvider = ({ children }) => {
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Adicionado para manter a ordem
  const value = { isEditMode, setIsEditMode, isThemeEditorOpen, setIsThemeEditorOpen };

  return (
    <GlobalControlsContext.Provider value={value}>
      {children}
    </GlobalControlsContext.Provider>
  );
};