import { useCallback, useEffect, useMemo, useState } from 'react';
import { HealthSnapshot, HealthMetricKey } from './types';
import {
  clearHealthSnapshot,
  getHealthMetricEntriesFromDB,
  getHealthSnapshotFromDB,
  recordHealthMetricInDB,
} from '../../lib/persistence/sqlite';
import type { HealthMetricEntry } from './types';

const initialHealthState: HealthSnapshot = {
  weight: null,
  water: null,
  sleep: null,
  workout: null,
};

export function useHealthSnapshot() {
  const [health, setHealth] = useState<HealthSnapshot>(initialHealthState);
  const [lastUpdated, setLastUpdated] = useState<string>('No updates yet');
  const [history, setHistory] = useState<HealthMetricEntry[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const persistedSnapshot = await getHealthSnapshotFromDB();
        if (mounted && persistedSnapshot) {
          setHealth(persistedSnapshot.health);
          setLastUpdated(persistedSnapshot.lastUpdated);
          setHistory(await getHealthMetricEntriesFromDB());
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
    const observedAt = new Date().toISOString();
    setHealth((current) => {
      return { ...current, [metric]: value };
    });
    setSaveError(null);
    void recordHealthMetricInDB(metric, value, observedAt)
      .then(async () => {
        const persisted = await getHealthSnapshotFromDB();
        if (persisted) {
          setHealth(persisted.health);
          setHistory(await getHealthMetricEntriesFromDB());
          setLastUpdated(persisted.lastUpdated);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to save health metric', error);
        setSaveError('The health entry could not be saved. Your previous recorded history is still available.');
      });
  }, []);

  const reset = useCallback(async () => {
    await clearHealthSnapshot();
    setHealth(initialHealthState);
    setLastUpdated('No updates yet');
    setHistory([]);
    setSaveError(null);
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
    history,
    saveError,
  };
}
