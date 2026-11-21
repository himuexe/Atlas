import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';

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
  getHealthSnapshotFromDB,
  getGoalsFromDB,
  getGoalMilestonesFromDB,
  getNotesFromDB,
  getStreakHabitsFromDB,
  getSettingFromDB,
  getVisitDaysFromDB,
  clearVisitDays,
  deleteGoalFromDB,
  importDatabase,
  removeSettingFromDB,
  replaceHealthSnapshotInDB,
  replaceGoalsInDB,
  replaceGoalMilestonesInDB,
  replaceNotesInDB,
  replaceStreakHabitsInDB,
  recordVisitDayInDB,
  setSettingInDB,
  saveGoalInDB,
} from './sqlite';

describe('SQLite persistence', () => {
  beforeAll(() => {
    vi.stubGlobal('window', globalThis);
  });

  beforeEach(async () => {
    await replaceGoalsInDB([]);
    await replaceNotesInDB([]);
    await replaceStreakHabitsInDB([]);
    await clearVisitDays();
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

  it('clears the legacy glasses count once while preserving other health metrics', async () => {
    await replaceHealthSnapshotInDB(
      { weight: 72, water: 8, sleep: 7.5, workout: 30 },
      'legacy snapshot',
    );
    await removeSettingFromDB('health-water-unit-bottles-v1');

    const legacyBackup = await exportDatabase();
    await importDatabase(legacyBackup);

    await expect(getHealthSnapshotFromDB()).resolves.toEqual({
      health: { weight: 72, water: null, sleep: 7.5, workout: 30 },
      lastUpdated: 'legacy snapshot',
    });
  });

  it('preserves a bottle value from a backup marked with the bottles unit', async () => {
    await replaceHealthSnapshotInDB(
      { weight: 72, water: 3, sleep: 7.5, workout: 30 },
      'bottle snapshot',
    );
    await setSettingInDB('health-water-unit-bottles-v1', 'bottles-750ml');

    const bottleBackup = await exportDatabase();
    await replaceHealthSnapshotInDB(
      { weight: 72, water: null, sleep: 7.5, workout: 30 },
      'empty snapshot',
    );
    await importDatabase(bottleBackup);

    await expect(getHealthSnapshotFromDB()).resolves.toEqual({
      health: { weight: 72, water: 3, sleep: 7.5, workout: 30 },
      lastUpdated: 'bottle snapshot',
    });
  });

  it('recognizes the previous migration marker and preserves its bottle values', async () => {
    await replaceHealthSnapshotInDB(
      { weight: 70, water: 4, sleep: 8, workout: 20 },
      'previously migrated snapshot',
    );
    await setSettingInDB('health-water-unit-bottles-v1', '1');

    const previousVersionBackup = await exportDatabase();
    await replaceHealthSnapshotInDB(
      { weight: null, water: null, sleep: null, workout: null },
      'empty snapshot',
    );
    await importDatabase(previousVersionBackup);

    await expect(getHealthSnapshotFromDB()).resolves.toEqual({
      health: { weight: 70, water: 4, sleep: 8, workout: 20 },
      lastUpdated: 'previously migrated snapshot',
    });
  });

  it('keeps duplicate same-day visits idempotent across concurrent startup calls', async () => {
    await Promise.all([
      recordVisitDayInDB('2026-10-14'),
      recordVisitDayInDB('2026-10-14'),
    ]);

    await expect(getVisitDaysFromDB()).resolves.toEqual(['2026-10-14']);
  });

  it('includes visit dates in backups and clears them during reset', async () => {
    await recordVisitDayInDB('2026-10-13');
    await recordVisitDayInDB('2026-10-14');
    const backup = await exportDatabase();

    await clearVisitDays();
    await expect(getVisitDaysFromDB()).resolves.toEqual([]);
    await importDatabase(backup);
    await expect(getVisitDaysFromDB()).resolves.toEqual(['2026-10-13', '2026-10-14']);

    await clearVisitDays();
    await expect(getVisitDaysFromDB()).resolves.toEqual([]);
  });

  it('persists scheduled rest days with each habit', async () => {
    await replaceStreakHabitsInDB([{
      id: 'habit-1',
      name: 'Walk',
      history: ['2026-10-14'],
      restDays: [0, 6],
      createdAt: '2026-10-01T00:00:00.000Z',
    }]);

    await expect(getStreakHabitsFromDB()).resolves.toEqual([{
      id: 'habit-1',
      name: 'Walk',
      history: ['2026-10-14'],
      restDays: [0, 6],
      createdAt: '2026-10-01T00:00:00.000Z',
    }]);
  });

  it('adds an empty rest-day schedule when importing a legacy habit database', async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const legacyDatabase = new SQL.Database();
    legacyDatabase.run(`
      CREATE TABLE streak_habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        history TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      INSERT INTO streak_habits (id, name, history, createdAt)
      VALUES ('legacy-walk', 'Walk', '["2026-10-14"]', '2026-10-01T00:00:00.000Z');
    `);

    await importDatabase(legacyDatabase.export());

    await expect(getStreakHabitsFromDB()).resolves.toEqual([{
      id: 'legacy-walk',
      name: 'Walk',
      history: ['2026-10-14'],
      restDays: [],
      createdAt: '2026-10-01T00:00:00.000Z',
    }]);
    await expect(getVisitDaysFromDB()).resolves.toEqual([]);
    legacyDatabase.close();
  });

  it('migrates a legacy goals database without changing existing goal rows', async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const legacyDatabase = new SQL.Database();
    legacyDatabase.run(`
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        note TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      INSERT INTO goals (id, title, note, completed, createdAt)
      VALUES ('legacy-goal', 'Learn piano', 'Practice gently', 0, '2026-10-01T00:00:00.000Z');
    `);

    await importDatabase(legacyDatabase.export());

    await expect(getGoalsFromDB()).resolves.toEqual([{
      id: 'legacy-goal',
      title: 'Learn piano',
      note: 'Practice gently',
      completed: false,
      createdAt: '2026-10-01T00:00:00.000Z',
    }]);
    await expect(getGoalMilestonesFromDB()).resolves.toEqual([]);
    legacyDatabase.close();
  });

  it('preserves ordered milestones through backup export and import', async () => {
    await saveGoalInDB({ id: 'goal-roadmap', title: 'Run a 5K', completed: false, createdAt: '2026-10-01T00:00:00.000Z' });
    await replaceGoalMilestonesInDB('goal-roadmap', [
      { id: 'mile-1', goalId: 'goal-roadmap', title: 'Walk regularly', position: 0, completed: true, createdAt: '2026-10-02T00:00:00.000Z', completedAt: '2026-10-03T00:00:00.000Z' },
      { id: 'mile-2', goalId: 'goal-roadmap', title: 'Run 2K', position: 1, completed: false, createdAt: '2026-10-04T00:00:00.000Z' },
    ]);

    const backup = await exportDatabase();
    await replaceGoalsInDB([]);
    await importDatabase(backup);

    await expect(getGoalMilestonesFromDB()).resolves.toEqual([
      { id: 'mile-1', goalId: 'goal-roadmap', title: 'Walk regularly', position: 0, completed: true, createdAt: '2026-10-02T00:00:00.000Z', completedAt: '2026-10-03T00:00:00.000Z' },
      { id: 'mile-2', goalId: 'goal-roadmap', title: 'Run 2K', position: 1, completed: false, createdAt: '2026-10-04T00:00:00.000Z', completedAt: undefined },
    ]);
  });

  it('deletes a goal and cascades deletion to its milestones', async () => {
    await saveGoalInDB({ id: 'goal-delete', title: 'Read more', completed: false, createdAt: '2026-10-01T00:00:00.000Z' });
    await replaceGoalMilestonesInDB('goal-delete', [
      { id: 'mile-delete', goalId: 'goal-delete', title: 'Read one book', position: 0, completed: false, createdAt: '2026-10-02T00:00:00.000Z' },
    ]);

    await deleteGoalFromDB('goal-delete');

    await expect(getGoalsFromDB()).resolves.toEqual([]);
    await expect(getGoalMilestonesFromDB()).resolves.toEqual([]);
  });

  it('clears all milestones when reset replaces the goal list with empty data', async () => {
    await saveGoalInDB({ id: 'goal-reset', title: 'Organize home', completed: false, createdAt: '2026-10-01T00:00:00.000Z' });
    await replaceGoalMilestonesInDB('goal-reset', [
      { id: 'mile-reset', goalId: 'goal-reset', title: 'Clear one shelf', position: 0, completed: false, createdAt: '2026-10-02T00:00:00.000Z' },
    ]);

    await replaceGoalsInDB([]);

    await expect(getGoalMilestonesFromDB()).resolves.toEqual([]);
  });

  it('keeps parent completion manual when all milestones are completed', async () => {
    await saveGoalInDB({ id: 'goal-manual', title: 'Learn guitar', completed: false, createdAt: '2026-10-01T00:00:00.000Z' });
    await replaceGoalMilestonesInDB('goal-manual', [
      { id: 'mile-manual', goalId: 'goal-manual', title: 'Learn three chords', position: 0, completed: true, createdAt: '2026-10-02T00:00:00.000Z' },
    ]);
    await saveGoalInDB({ id: 'goal-manual', title: 'Learn guitar', completed: false, createdAt: '2026-10-01T00:00:00.000Z' });

    await expect(getGoalsFromDB()).resolves.toEqual([
      { id: 'goal-manual', title: 'Learn guitar', note: undefined, completed: false, createdAt: '2026-10-01T00:00:00.000Z' },
    ]);
    await expect(getGoalMilestonesFromDB()).resolves.toHaveLength(1);
  });

  it('migrates a legacy goals database on normal startup', async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const legacyDatabase = new SQL.Database();
    legacyDatabase.run(`
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        note TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      INSERT INTO goals (id, title, note, completed, createdAt)
      VALUES ('startup-goal', 'Plant a garden', NULL, 0, '2026-10-01T00:00:00.000Z');
    `);
    persistedValues.set('atlas.sqlite', legacyDatabase.export());
    legacyDatabase.close();

    vi.resetModules();
    const startupPersistence = await import('./sqlite');

    await expect(startupPersistence.getGoalsFromDB()).resolves.toEqual([{
      id: 'startup-goal',
      title: 'Plant a garden',
      note: undefined,
      completed: false,
      createdAt: '2026-10-01T00:00:00.000Z',
    }]);
    await expect(startupPersistence.getGoalMilestonesFromDB()).resolves.toEqual([]);
  });
});
