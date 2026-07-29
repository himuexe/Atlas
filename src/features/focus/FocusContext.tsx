import { createContext, ReactNode, useContext } from 'react';
import { useDailyFocus } from './useDailyFocus';
import { FocusItem } from './types';

interface FocusContextValue {
  items: FocusItem[];
  addItem: (title: string) => void;
  toggleCompletion: (id: string) => void;
  removeItem: (id: string) => void;
  completedCount: number;
  maxItems: number;
  canAddItem: boolean;
}

const FocusContext = createContext<FocusContextValue | null>(null);

interface FocusProviderProps {
  children: ReactNode;
}

export function FocusProvider({ children }: FocusProviderProps) {
  const focus = useDailyFocus();

  return <FocusContext.Provider value={focus}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
