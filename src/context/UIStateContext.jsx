import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSystem } from '@/context/SystemContext';
import { getUserSettings, saveUserSettings } from '@/services/firestoreService';
import debounce from 'lodash/debounce';

const UIStateContext = createContext();

export const useUIState = () => useContext(UIStateContext);

const defaultLayout = {
  partyMonitor: 'top-left', // 'top-left' or 'top-right'
  rollFeed: 'bottom-left', // 'bottom-left' or 'top-right'
};

export const UIStateProvider = ({ children }) => {
  const { user } = useAuth();
  const { characterDataCollectionRoot } = useSystem();
  const [isRollFeedVisible, setIsRollFeedVisible] = useState(true);
  const [isPartyHealthMonitorVisible, setIsPartyHealthMonitorVisible] = useState(true);
  const [layout, setLayout] = useState(defaultLayout);

  // Efeito para carregar as configurações do usuário
  useEffect(() => {
    if (user && characterDataCollectionRoot) {
      getUserSettings(characterDataCollectionRoot, user.uid).then(settings => {
        if (settings?.layout) {
          setLayout(prev => ({ ...prev, ...settings.layout }));
        }
      });
    }
  }, [user, characterDataCollectionRoot]);

  // Debounce para salvar as configurações
  const debouncedSave = useCallback(debounce((path, uid, newLayout) => {
    if (uid && path) {
      saveUserSettings(path, uid, { layout: newLayout });
    }
  }, 1500), []);

  const updateLayout = (newLayout) => {
    const updated = { ...layout, ...newLayout };
    setLayout(updated);
    debouncedSave(characterDataCollectionRoot, user?.uid, updated);
  };

  const value = {
    isRollFeedVisible,
    setIsRollFeedVisible,
    isPartyHealthMonitorVisible,
    setIsPartyHealthMonitorVisible,
    layout,
    updateLayout,
  };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
};