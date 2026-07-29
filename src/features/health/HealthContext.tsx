import { createContext, ReactNode, useContext } from 'react';
import { HealthSnapshot } from './types';
import { useHealthSnapshot } from './useHealthSnapshot';

interface HealthContextValue {
  health: HealthSnapshot;
  updateMetric: (metric: keyof HealthSnapshot, value: number | null) => void;
  filledMetricsCount: number;
  lastUpdated: string;
}

const HealthContext = createContext<HealthContextValue | null>(null);

interface HealthProviderProps {
  children: ReactNode;
}

export function HealthProvider({ children }: HealthProviderProps) {
  const healthSnapshot = useHealthSnapshot();

  return <HealthContext.Provider value={healthSnapshot}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
}
