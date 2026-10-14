import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearVisitDays, getVisitDaysFromDB, recordVisitDayInDB } from '../../lib/persistence/sqlite';
import { calculateVisitStreak, getLocalDateKey } from './utils';

interface VisitStreakContextValue {
  currentStreak: number | null;
  reset: () => Promise<void>;
}

const VisitStreakContext = createContext<VisitStreakContextValue | null>(null);

export function VisitStreakProvider({ children }: { children: ReactNode }) {
  const [visitDays, setVisitDays] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const startupWork = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let mounted = true;
    const today = getLocalDateKey(new Date());

    startupWork.current = (async () => {
      try {
        await recordVisitDayInDB(today);
        const days = await getVisitDaysFromDB();
        if (mounted) {
          setVisitDays(days);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to record local visit', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const reset = useCallback(async () => {
    await startupWork.current;
    await clearVisitDays();
    setVisitDays([]);
  }, []);

  const currentStreak = useMemo(
    () => isLoaded ? calculateVisitStreak(visitDays) : null,
    [isLoaded, visitDays],
  );

  return (
    <VisitStreakContext.Provider value={{ currentStreak, reset }}>
      {children}
    </VisitStreakContext.Provider>
  );
}

export function useVisitStreakContext() {
  const context = useContext(VisitStreakContext);
  if (!context) {
    throw new Error('useVisitStreakContext must be used within VisitStreakProvider');
  }
  return context;
}
