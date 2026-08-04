import { useCallback, useEffect, useState } from 'react';
import { getSettingFromDB, removeSettingFromDB, setSettingInDB } from '../../lib/persistence/sqlite';

export type StartupPage =
  | '/dashboard'
  | '/focus'
  | '/health'
  | '/journal'
  | '/streaks'
  | '/savings'
  | '/goals'
  | '/notes'
  | '/settings';

const STARTUP_PAGE_KEY = 'startup-page';
const LEGACY_STORAGE_KEY = 'atlas.startupPage';
const DEFAULT_STARTUP_PAGE: StartupPage = '/dashboard';

const validStartupPages: StartupPage[] = [
  '/dashboard', '/focus', '/health', '/journal', '/streaks', '/savings', '/goals', '/notes', '/settings',
];

function isStartupPage(value: string): value is StartupPage {
  return validStartupPages.includes(value as StartupPage);
}

export function useSettings() {
  const [startupPage, setStartupPage] = useState<StartupPage>(DEFAULT_STARTUP_PAGE);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const persistedValue = await getSettingFromDB(STARTUP_PAGE_KEY);
        let nextPage = persistedValue && isStartupPage(persistedValue) ? persistedValue : DEFAULT_STARTUP_PAGE;

        if (!persistedValue) {
          const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacyValue) {
            try {
              const parsedValue = JSON.parse(legacyValue);
              if (typeof parsedValue === 'string' && isStartupPage(parsedValue)) {
                nextPage = parsedValue;
                await setSettingInDB(STARTUP_PAGE_KEY, nextPage);
              }
            } catch {
              // A malformed legacy preference should not prevent Atlas from opening.
            }
          }
        }

        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (mounted) {
          setStartupPage(nextPage);
        }
      } catch (error) {
        console.error('Failed to load startup preference from DB', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updateStartupPage = useCallback((value: StartupPage) => {
    setStartupPage(value);
    void setSettingInDB(STARTUP_PAGE_KEY, value).catch((error) => {
      console.error('Failed to persist startup preference', error);
    });
  }, []);

  const reset = useCallback(() => {
    setStartupPage(DEFAULT_STARTUP_PAGE);
    void removeSettingFromDB(STARTUP_PAGE_KEY).catch((error) => {
      console.error('Failed to reset startup preference', error);
    });
  }, []);

  return { startupPage, setStartupPage: updateStartupPage, reset };
}
