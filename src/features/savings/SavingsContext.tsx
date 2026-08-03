import { createContext, ReactNode, useContext } from 'react';
import { useSavings } from './useSavings';
import { SavingsEntry } from './types';

interface SavingsContextValue {
  entries: SavingsEntry[];
  addEntry: (amount: number, description: string, category: 'income' | 'expense' | 'savings') => void;
  removeEntry: (id: string) => void;
  reset: () => void;
  balance: number;
}

const SavingsContext = createContext<SavingsContextValue | null>(null);

interface SavingsProviderProps {
  children: ReactNode;
}

export function SavingsProvider({ children }: SavingsProviderProps) {
  const savings = useSavings();

  return <SavingsContext.Provider value={savings}>{children}</SavingsContext.Provider>;
}

export function useSavingsContext() {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavingsContext must be used within a SavingsProvider');
  }
  return context;
}
