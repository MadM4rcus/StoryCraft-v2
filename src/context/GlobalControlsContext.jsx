import React, { createContext, useState, useContext } from 'react';

const GlobalControlsContext = createContext();

export const useGlobalControls = () => useContext(GlobalControlsContext);

export const GlobalControlsProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const value = {
    isEditMode,
    setIsEditMode,
  };

  return (
    <GlobalControlsContext.Provider value={value}>
      {children}
    </GlobalControlsContext.Provider>
  );
};