import { useCallback, useEffect, useMemo, useState } from 'react';
import { HealthSnapshot, HealthMetricKey } from './types';
import { getHealthSnapshotFromDB, replaceHealthSnapshotInDB } from '../../lib/persistence/sqlite';

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const persistedSnapshot = await getHealthSnapshotFromDB();
        if (mounted && persistedSnapshot) {
          setHealth(persistedSnapshot.health);
          setLastUpdated(persistedSnapshot.lastUpdated);
        }
      } catch (err) {
        console.error('Failed to load health snapshot from DB', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updateMetric = useCallback((metric: HealthMetricKey, value: number | null) => {
    const nextUpdatedAt = formatTimestamp(new Date());

    setHealth((current) => {
      const nextHealth = {
        ...current,
        [metric]: value,
      };
      void replaceHealthSnapshotInDB(nextHealth, nextUpdatedAt);
      return nextHealth;
    });
    setLastUpdated(nextUpdatedAt);
  }, []);

  const reset = useCallback(() => {
    setHealth(initialHealthState);
    setLastUpdated('No updates yet');
    void replaceHealthSnapshotInDB(initialHealthState, 'No updates yet');
  }, []);

  const filledMetricsCount = useMemo(
    () => Object.values(health).filter((value) => value !== null).length,
    [health],
  );

  return {
    health,
    updateMetric,
    reset,
    filledMetricsCount,
    lastUpdated,
  };
}
