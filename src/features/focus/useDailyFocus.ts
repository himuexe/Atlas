import { useCallback, useMemo, useState } from 'react';
import { FocusItem } from './types';

const MAX_ITEMS = 3;

function createItem(title: string): FocusItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function useDailyFocus(initialItems: FocusItem[] = []) {
  const [items, setItems] = useState<FocusItem[]>(initialItems);

  const addItem = useCallback((title: string) => {
    if (!title.trim() || items.length >= MAX_ITEMS) {
      return;
    }

    setItems((currentItems) => [...currentItems, createItem(title)]);
  }, [items.length]);

  const toggleCompletion = useCallback((id: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
  }, []);

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
