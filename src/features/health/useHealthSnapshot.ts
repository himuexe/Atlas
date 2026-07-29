import { useCallback, useMemo, useState } from 'react';
import { HealthSnapshot, HealthMetricKey } from './types';

const initialHealthState: HealthSnapshot = {
  weight: null,
  water: null,
  sleep: null,
  workout: null,
};

function formatTimestamp(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function useHealthSnapshot() {
  const [health, setHealth] = useState<HealthSnapshot>(initialHealthState);
  const [lastUpdated, setLastUpdated] = useState<string>('No updates yet');

  const updateMetric = useCallback((metric: HealthMetricKey, value: number | null) => {
    setHealth((current) => ({
      ...current,
      [metric]: value,
    }));
    setLastUpdated(formatTimestamp(new Date()));
  }, []);

  const filledMetricsCount = useMemo(
    () => Object.values(health).filter((value) => value !== null).length,
    [health],
  );

  return {
    health,
    updateMetric,
    filledMetricsCount,
    lastUpdated,
  };
}
