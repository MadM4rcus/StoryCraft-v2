import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { getUserSettings, saveUserSettings } from '@/services/firestoreService';
import debounce from 'lodash/debounce';

const UIStateContext = createContext();

export const useUIState = () => useContext(UIStateContext);

const defaultUIState = {
  isRollFeedVisible: true,
  isPartyHealthMonitorVisible: true,
  layout: {
    partyMonitor: 'top-left', // 'top-left' or 'top-right'
    rollFeed: 'bottom-left', // 'bottom-left' or 'top-right'
  }
};

export const UIStateProvider = ({ children }) => {
  const { user } = useAuth();
  const { characterDataCollectionRoot } = useSystem();
  const [uiState, setUiState] = useState(defaultUIState);

  // Efeito para carregar as configurações do usuário
  useEffect(() => {
    if (user && characterDataCollectionRoot) {
      getUserSettings(characterDataCollectionRoot, user.uid).then(settings => {
        if (settings?.ui) {
          setUiState(prev => ({ ...prev, ...settings.ui, layout: { ...prev.layout, ...settings.ui.layout } }));
        }
      });
    }
  }, [user, characterDataCollectionRoot]);

  // Debounce para salvar as configurações
  const debouncedSave = useCallback(debounce((path, uid, newUIState) => {
    if (uid && path) {
      saveUserSettings(path, uid, { ui: newUIState });
    }
  }, 1500), []);

  const updateUIState = (newState) => {
    setUiState(prev => {
      const updated = { ...prev, ...newState, layout: { ...prev.layout, ...newState.layout } };
      debouncedSave(characterDataCollectionRoot, user?.uid, updated);
      return updated;
    });
  };

  const value = {
    isRollFeedVisible: uiState.isRollFeedVisible,
    isPartyHealthMonitorVisible: uiState.isPartyHealthMonitorVisible,
    layout: uiState.layout,
    // As funções agora atualizam o estado unificado
    setIsRollFeedVisible: (visible) => updateUIState({ isRollFeedVisible: visible }),
    setIsPartyHealthMonitorVisible: (visible) => updateUIState({ isPartyHealthMonitorVisible: visible }),
    updateLayout: (newLayout) => updateUIState({ layout: newLayout }),
  };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
};