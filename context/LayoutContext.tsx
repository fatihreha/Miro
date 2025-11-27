
import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTabBarVisible, setTabBarVisible] = useState(true);

  return (
    <LayoutContext.Provider value={{ isTabBarVisible, setTabBarVisible }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
