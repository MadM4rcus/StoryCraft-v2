import React, { createContext, useState, useContext } from 'react';

const UIStateContext = createContext();

export const useUIState = () => useContext(UIStateContext);

export const UIStateProvider = ({ children }) => {
  const [isRollFeedVisible, setIsRollFeedVisible] = useState(true);
  const [isPartyHealthMonitorVisible, setIsPartyHealthMonitorVisible] = useState(true);

  const value = {
    isRollFeedVisible,
    setIsRollFeedVisible,
    isPartyHealthMonitorVisible,
    setIsPartyHealthMonitorVisible,
  };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
};