import { createContext, ReactNode, useContext } from 'react';
import { StartupPage, useSettings } from './useSettings';

interface SettingsContextValue {
  startupPage: StartupPage;
  setStartupPage: (page: StartupPage) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settings = useSettings();

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }

  return context;
}
