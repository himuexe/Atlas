import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const persistedValues = new Map<string, Uint8Array>();
const { sqlWasmPath } = vi.hoisted(() => ({
  sqlWasmPath: new URL('../../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => persistedValues.get(key)),
  set: vi.fn(async (key: string, value: Uint8Array) => {
    persistedValues.set(key, value);
  }),
}));

vi.mock('sql.js/dist/sql-wasm.wasm?url', () => ({
  default: sqlWasmPath,
}));

import {
  exportDatabase,
  getGoalsFromDB,
  getNotesFromDB,
  getSettingFromDB,
  importDatabase,
  removeSettingFromDB,
  replaceGoalsInDB,
  replaceNotesInDB,
  setSettingInDB,
} from './sqlite';

describe('SQLite persistence', () => {
  beforeAll(() => {
    vi.stubGlobal('window', globalThis);
  });

  beforeEach(async () => {
    await replaceGoalsInDB([]);
    await replaceNotesInDB([]);
    await removeSettingFromDB('startup-page');
  });

  it('stores every recently migrated data type in the exportable database', async () => {
    await replaceGoalsInDB([
      { id: 'goal-1', title: 'Finish V1', note: 'Keep it focused', completed: false, createdAt: '2026-08-04T00:00:00.000Z' },
    ]);
    await replaceNotesInDB([
      { id: 'note-1', title: 'Reflection', content: 'Small steps add up.', createdAt: '2026-08-04T00:00:00.000Z' },
    ]);
    await setSettingInDB('startup-page', '/goals');

    const backup = await exportDatabase();

    await replaceGoalsInDB([]);
    await replaceNotesInDB([]);
    await removeSettingFromDB('startup-page');
    await importDatabase(backup);

    await expect(getGoalsFromDB()).resolves.toEqual([
      { id: 'goal-1', title: 'Finish V1', note: 'Keep it focused', completed: false, createdAt: '2026-08-04T00:00:00.000Z' },
    ]);
    await expect(getNotesFromDB()).resolves.toEqual([
      { id: 'note-1', title: 'Reflection', content: 'Small steps add up.', createdAt: '2026-08-04T00:00:00.000Z' },
    ]);
    await expect(getSettingFromDB('startup-page')).resolves.toBe('/goals');
  });

  it('rejects an invalid backup without replacing the current database', async () => {
    await replaceGoalsInDB([
      { id: 'goal-1', title: 'Keep my data', completed: false, createdAt: '2026-08-04T00:00:00.000Z' },
    ]);

    await expect(importDatabase(new Uint8Array([1, 2, 3]))).rejects.toThrow();
    await expect(getGoalsFromDB()).resolves.toEqual([
      { id: 'goal-1', title: 'Keep my data', note: undefined, completed: false, createdAt: '2026-08-04T00:00:00.000Z' },
    ]);
  });
});
