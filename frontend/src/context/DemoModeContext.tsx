import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_WALLETS } from '../config/demoWallets';
import { DemoRole } from '../types';

interface DemoModeContextType {
  isDemoMode: boolean;
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  demoWalletInfo: typeof DEMO_WALLETS[DemoRole];
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('demo') === 'true';
    }
    return false;
  });

  const [demoRole, setDemoRoleState] = useState<DemoRole>('freelancer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
      setIsDemoMode(isDemo);
    }
  }, []);

  const setDemoRole = (role: DemoRole) => {
    setDemoRoleState(role);
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        demoRole,
        setDemoRole,
        demoWalletInfo: DEMO_WALLETS[demoRole],
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
