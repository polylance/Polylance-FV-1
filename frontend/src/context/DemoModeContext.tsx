import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_WALLETS } from '../config/demoWallets';
import { DemoRole, Job, UserProfile } from '../types';

export const SAMPLE_DEMO_JOBS: Job[] = [];

export const SAMPLE_DEMO_PROFILES: Record<string, UserProfile> = {};

interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  demoWalletInfo: typeof DEMO_WALLETS[keyof typeof DEMO_WALLETS];
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  tourStep: number;
  setTourStep: (step: number) => void;
  restartTour: () => void;
  sampleJobs: Job[];
  sampleProfiles: Record<string, UserProfile>;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('demo') === 'true';
      if (!param) {
        localStorage.removeItem('polylance_demo_mode');
        return false;
      }
      return true;
    }
    return false;
  });

  const [demoRole, setDemoRoleState] = useState<DemoRole>('freelancer');

  // Guided tour state
  const [isTourActive, setIsTourActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const tourDismissed = localStorage.getItem('polylance_tour_dismissed') === 'true';
      return isDemoMode && !tourDismissed;
    }
    return false;
  });

  const [tourStep, setTourStep] = useState<number>(1);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_demo_mode', 'true');
    }
    setIsTourActive(true);
    setTourStep(1);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setIsTourActive(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_demo_mode');
    }
  };

  const restartTour = () => {
    setIsTourActive(true);
    setTourStep(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_tour_dismissed');
    }
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoRole,
        setDemoRole: setDemoRoleState,
        demoWalletInfo: (DEMO_WALLETS as any)[demoRole] || DEMO_WALLETS.freelancer,
        isTourActive,
        setIsTourActive,
        tourStep,
        setTourStep,
        restartTour,
        sampleJobs: SAMPLE_DEMO_JOBS,
        sampleProfiles: SAMPLE_DEMO_PROFILES,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

const DEFAULT_DEMO_CONTEXT: DemoModeContextType = {
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
  demoRole: 'freelancer',
  setDemoRole: () => {},
  demoWalletInfo: DEMO_WALLETS.freelancer,
  isTourActive: false,
  setIsTourActive: () => {},
  tourStep: 1,
  setTourStep: () => {},
  restartTour: () => {},
  sampleJobs: SAMPLE_DEMO_JOBS,
  sampleProfiles: SAMPLE_DEMO_PROFILES,
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  return context || DEFAULT_DEMO_CONTEXT;
};
