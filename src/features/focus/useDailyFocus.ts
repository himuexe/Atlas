import { useCallback, useEffect, useMemo, useState } from 'react';
import { FocusItem } from './types';
import { getFocusItemsFromDB, replaceFocusItemsInDB } from '../../lib/persistence/sqlite';

const MAX_ITEMS = 3;

function createItem(title: string, note?: string): FocusItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    note: note?.trim() || undefined,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function useDailyFocus(initialItems: FocusItem[] = []) {
  const [items, setItems] = useState<FocusItem[]>(initialItems);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const persistedItems = await getFocusItemsFromDB();
        if (mounted && persistedItems.length > 0) {
          setItems(persistedItems);
        }
      } catch (err) {
        console.error('Failed to load focus items from DB', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const syncItems = useCallback(async (nextItems: FocusItem[]) => {
    try {
      await replaceFocusItemsInDB(nextItems);
    } catch (err) {
      console.error('Failed to persist focus items', err);
    }
  }, []);

  const addItem = useCallback((title: string, note?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || items.length >= MAX_ITEMS) {
      return;
    }

    const nextItem = createItem(trimmedTitle, note);
    setItems((currentItems) => {
      const nextItems = [...currentItems, nextItem];
      void syncItems(nextItems);
      return nextItems;
    });
  }, [items.length, syncItems]);

  const toggleCompletion = useCallback((id: string) => {
    setItems((currentItems) => {
      const nextItems = currentItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      );
      void syncItems(nextItems);
      return nextItems;
    });
  }, [syncItems]);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item.id !== id);
      void syncItems(nextItems);
      return nextItems;
    });
  }, [syncItems]);

  const reset = useCallback(() => {
    setItems([]);
    void syncItems([]);
  }, [syncItems]);

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items],
  );

  const canAddItem = items.length < MAX_ITEMS;

  return {
    items,
    addItem,
    toggleCompletion,
    removeItem,
    reset,
    completedCount,
    maxItems: MAX_ITEMS,
    canAddItem,
  };
}
