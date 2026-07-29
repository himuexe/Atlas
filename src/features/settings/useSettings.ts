import { useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export type StartupPage = '/dashboard' | '/focus' | '/health' | '/journal' | '/streaks' | '/settings';

const STARTUP_PAGE_KEY = 'atlas.startupPage';
const DEFAULT_STARTUP_PAGE: StartupPage = '/dashboard';

export function useSettings() {
  const [startupPage, setStartupPage] = useLocalStorage<StartupPage>(STARTUP_PAGE_KEY, DEFAULT_STARTUP_PAGE);

  const updateStartupPage = useCallback((value: StartupPage) => {
    setStartupPage(value);
  }, [setStartupPage]);

  return {
    startupPage,
    setStartupPage: updateStartupPage,
  };
}
