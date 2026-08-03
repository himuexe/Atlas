import initSqlJs from 'sql.js';
import { get, set } from 'idb-keyval';

const DB_KEY = 'atlas.sqlite';
const SAVE_DEBOUNCE_MS = 500;

let SQL: any = null;
let db: any = null;
let saveTimer: number | null = null;
let initialized = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS focus_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS health_state (
  id TEXT PRIMARY KEY,
  weight REAL,
  water REAL,
  sleep REAL,
  workout REAL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS streak_habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  history TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`;

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveImmediate().catch((err) => console.error('Failed to save DB:', err));
  }, SAVE_DEBOUNCE_MS);
}

async function saveImmediate() {
  if (!db) return;
  const data = db.export(); // Uint8Array
  await set(DB_KEY, data);
}

export async function initDatabase() {
  if (initialized) return;

  // Lazy load sql.js and initialize DB from IndexedDB or create new one.
  if (!SQL) {
    // Use a CDN-located wasm file to avoid complex bundler configuration.
    SQL = await (initSqlJs as any)({ locateFile: (file: string) => `https://unpkg.com/sql.js@1.8.0/dist/${file}` });
  }

  const existing = await get(DB_KEY);
  if (existing) {
    const bytes = existing instanceof Uint8Array ? existing : new Uint8Array(existing as ArrayBuffer);
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    await saveImmediate();
  }

  initialized = true;
}

function execAll(stmt: string, params: any[] = []) {
  if (!db) throw new Error('DB not initialized');
  db.run(stmt, params);
}

function queryRows(stmt: string, params: any[] = []) {
  if (!db) throw new Error('DB not initialized');
  const res = db.exec(stmt, params);
  if (!res || res.length === 0) return [];

  const { columns, values } = res[0];
  return values.map((row: any[]) => {
    const out: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      out[col] = row[idx];
    });
    return out;
  });
}

// Journal helpers
export async function getJournalEntriesFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, content, createdAt FROM journal_entries ORDER BY createdAt DESC');
  return rows.map((r: any) => ({ id: r.id, content: r.content, createdAt: r.createdAt }));
}

export async function addJournalEntryToDB(entry: { id: string; content: string; createdAt: string }) {
  await initDatabase();
  execAll(
    'INSERT OR REPLACE INTO journal_entries (id, content, createdAt) VALUES (?, ?, ?);',
    [entry.id, entry.content, entry.createdAt],
  );
  scheduleSave();
}

export async function removeJournalEntryFromDB(id: string) {
  await initDatabase();
  execAll('DELETE FROM journal_entries WHERE id = ?;', [id]);
  scheduleSave();
}

export async function clearJournalEntries() {
  await initDatabase();
  execAll('DELETE FROM journal_entries;');
  scheduleSave();
}

// Focus helpers
export async function getFocusItemsFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, title, completed, createdAt FROM focus_items ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
  }));
}

export async function replaceFocusItemsInDB(items: Array<{ id: string; title: string; completed: boolean; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM focus_items;');
  for (const item of items) {
    execAll(
      'INSERT OR REPLACE INTO focus_items (id, title, completed, createdAt) VALUES (?, ?, ?, ?);',
      [item.id, item.title, item.completed ? 1 : 0, item.createdAt],
    );
  }
  scheduleSave();
}

// Health helpers
export async function getHealthSnapshotFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT weight, water, sleep, workout, updatedAt FROM health_state WHERE id = ? LIMIT 1;', ['current']);
  if (!rows.length) {
    return null;
  }

  const row = rows[0] as Record<string, any>;
  return {
    health: {
      weight: row.weight === null ? null : Number(row.weight),
      water: row.water === null ? null : Number(row.water),
      sleep: row.sleep === null ? null : Number(row.sleep),
      workout: row.workout === null ? null : Number(row.workout),
    },
    lastUpdated: row.updatedAt,
  };
}

export async function replaceHealthSnapshotInDB(
  health: { weight: number | null; water: number | null; sleep: number | null; workout: number | null },
  lastUpdated: string,
) {
  await initDatabase();
  execAll(
    'INSERT OR REPLACE INTO health_state (id, weight, water, sleep, workout, updatedAt) VALUES (?, ?, ?, ?, ?, ?);',
    ['current', health.weight, health.water, health.sleep, health.workout, lastUpdated],
  );
  scheduleSave();
}

export async function clearHealthSnapshot() {
  await initDatabase();
  execAll('DELETE FROM health_state;');
  scheduleSave();
}

// Streak helpers
export async function getStreakHabitsFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, name, history, createdAt FROM streak_habits ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    history: JSON.parse(row.history),
    createdAt: row.createdAt,
  }));
}

export async function replaceStreakHabitsInDB(habits: Array<{ id: string; name: string; history: string[]; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM streak_habits;');
  for (const habit of habits) {
    execAll(
      'INSERT OR REPLACE INTO streak_habits (id, name, history, createdAt) VALUES (?, ?, ?, ?);',
      [habit.id, habit.name, JSON.stringify(habit.history), habit.createdAt],
    );
  }
  scheduleSave();
}

export async function exportDatabase() {
  await initDatabase();
  return db.export();
}

export async function importDatabase(buffer: Uint8Array | ArrayBuffer) {
  if (!SQL) {
    SQL = await (initSqlJs as any)({ locateFile: (file: string) => `https://unpkg.com/sql.js@1.8.0/dist/${file}` });
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  db = new SQL.Database(bytes);
  initialized = true;
  scheduleSave();
}
