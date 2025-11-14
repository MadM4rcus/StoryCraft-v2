import React, { createContext, useState, useContext } from 'react';

const GlobalControlsContext = createContext();

export const useGlobalControls = () => useContext(GlobalControlsContext);

export const GlobalControlsProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isSpoilerMode, setIsSpoilerMode] = useState(true); // true = spoilers visíveis, false = spoilers ocultos

  const value = {
    isEditMode,
    setIsEditMode,
    isThemeEditorOpen,
    setIsThemeEditorOpen,
    isSpoilerMode,
    setIsSpoilerMode,
  };

  return (
    <GlobalControlsContext.Provider value={value}>
      {children}
    </GlobalControlsContext.Provider>
  );
};