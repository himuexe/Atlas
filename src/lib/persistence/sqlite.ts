import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
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
  mood TEXT,
  energy TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS focus_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT,
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

CREATE TABLE IF NOT EXISTS savings_entries (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  mood TEXT NOT NULL,
  energy TEXT NOT NULL,
  intention TEXT NOT NULL,
  win TEXT NOT NULL,
  reflection TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS xp_events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  streakLength INTEGER NOT NULL,
  description TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  unlockedAt TEXT,
  description TEXT NOT NULL,
  UNIQUE(type, threshold)
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
    SQL = await (initSqlJs as any)({ locateFile: () => sqlWasmUrl });
  }

  const existing = await get(DB_KEY);
  if (existing) {
    const bytes = existing instanceof Uint8Array ? existing : new Uint8Array(existing as ArrayBuffer);
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
    await saveImmediate();
  }

  ensureSchema();
  if (!existing) {
    await saveImmediate();
  }

  initialized = true;
}

function execAll(stmt: string, params: any[] = []) {
  if (!db) throw new Error('DB not initialized');
  db.run(stmt, params);
}

function getTableColumns(tableName: string) {
  if (!db) throw new Error('DB not initialized');
  const res = db.exec(`PRAGMA table_info(${tableName});`);
  if (!res || res.length === 0) return [];
  return res[0].values.map((row: any[]) => row[1]);
}

function ensureSchema() {
  if (!db) throw new Error('DB not initialized');

  db.run(SCHEMA);

  const journalColumns = getTableColumns('journal_entries');
  if (!journalColumns.includes('mood')) {
    db.run('ALTER TABLE journal_entries ADD COLUMN mood TEXT;');
  }
  if (!journalColumns.includes('energy')) {
    db.run('ALTER TABLE journal_entries ADD COLUMN energy TEXT;');
  }

  const focusColumns = getTableColumns('focus_items');
  if (!focusColumns.includes('note')) {
    db.run('ALTER TABLE focus_items ADD COLUMN note TEXT;');
  }

  const savingsColumns = getTableColumns('savings_entries');
  if (!savingsColumns.includes('category')) {
    db.run("ALTER TABLE savings_entries ADD COLUMN category TEXT NOT NULL DEFAULT 'savings';");
  }
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
  const rows = queryRows('SELECT id, content, mood, energy, createdAt FROM journal_entries ORDER BY createdAt DESC');
  return rows.map((r: any) => ({
    id: r.id,
    content: r.content,
    mood: r.mood ?? undefined,
    energy: r.energy ?? undefined,
    createdAt: r.createdAt,
  }));
}

export async function addJournalEntryToDB(entry: { id: string; content: string; mood?: string; energy?: string; createdAt: string }) {
  await initDatabase();
  execAll(
    'INSERT OR REPLACE INTO journal_entries (id, content, mood, energy, createdAt) VALUES (?, ?, ?, ?, ?);',
    [entry.id, entry.content, entry.mood ?? null, entry.energy ?? null, entry.createdAt],
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
  const rows = queryRows('SELECT id, title, note, completed, createdAt FROM focus_items ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    note: row.note ?? undefined,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
  }));
}

export async function replaceFocusItemsInDB(items: Array<{ id: string; title: string; note?: string; completed: boolean; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM focus_items;');
  for (const item of items) {
    execAll(
      'INSERT OR REPLACE INTO focus_items (id, title, note, completed, createdAt) VALUES (?, ?, ?, ?, ?);',
      [item.id, item.title, item.note ?? null, item.completed ? 1 : 0, item.createdAt],
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

// Savings helpers
export async function getSavingsEntriesFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, amount, description, category, createdAt FROM savings_entries ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    category: row.category as 'income' | 'expense' | 'savings',
    createdAt: row.createdAt,
  }));
}

export async function replaceSavingsEntriesInDB(entries: Array<{ id: string; amount: number; description: string; category: 'income' | 'expense' | 'savings'; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM savings_entries;');
  for (const entry of entries) {
    execAll(
      'INSERT OR REPLACE INTO savings_entries (id, amount, description, category, createdAt) VALUES (?, ?, ?, ?, ?);',
      [entry.id, entry.amount, entry.description, entry.category, entry.createdAt],
    );
  }
  scheduleSave();
}

// Goals helpers
export async function getGoalsFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, title, note, completed, createdAt FROM goals ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    note: row.note ?? undefined,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
  }));
}

export async function replaceGoalsInDB(goals: Array<{ id: string; title: string; note?: string; completed: boolean; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM goals;');
  for (const goal of goals) {
    execAll(
      'INSERT OR REPLACE INTO goals (id, title, note, completed, createdAt) VALUES (?, ?, ?, ?, ?);',
      [goal.id, goal.title, goal.note ?? null, goal.completed ? 1 : 0, goal.createdAt],
    );
  }
  scheduleSave();
}

// Notes helpers
export async function getNotesFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, title, content, createdAt FROM notes ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
  }));
}

export async function replaceNotesInDB(notes: Array<{ id: string; title: string; content: string; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM notes;');
  for (const note of notes) {
    execAll(
      'INSERT OR REPLACE INTO notes (id, title, content, createdAt) VALUES (?, ?, ?, ?);',
      [note.id, note.title, note.content, note.createdAt],
    );
  }
  scheduleSave();
}

// Settings helpers
export async function getSettingFromDB(key: string) {
  await initDatabase();
  const rows = queryRows('SELECT value FROM settings WHERE key = ? LIMIT 1;', [key]);
  return rows.length > 0 ? String(rows[0].value) : null;
}

export async function setSettingInDB(key: string, value: string) {
  await initDatabase();
  execAll('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
  scheduleSave();
}

export async function removeSettingFromDB(key: string) {
  await initDatabase();
  execAll('DELETE FROM settings WHERE key = ?;', [key]);
  scheduleSave();
}

export async function exportDatabase() {
  await initDatabase();
  return db.export();
}

// Check-in helpers
export async function getCheckInFromDB(date: string) {
  await initDatabase();
  const rows = queryRows(
    'SELECT id, date, mood, energy, intention, win, reflection, createdAt, updatedAt FROM check_ins WHERE date = ? LIMIT 1;',
    [date],
  );
  if (rows.length === 0) return null;
  
  const row = rows[0] as any;
  return {
    id: row.id,
    date: row.date,
    mood: row.mood,
    energy: row.energy,
    intention: row.intention,
    win: row.win,
    reflection: row.reflection,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllCheckInsFromDB() {
  await initDatabase();
  const rows = queryRows(
    'SELECT id, date, mood, energy, intention, win, reflection, createdAt, updatedAt FROM check_ins ORDER BY date DESC;',
  );
  return rows.map((r: any) => ({
    id: r.id,
    date: r.date,
    mood: r.mood,
    energy: r.energy,
    intention: r.intention,
    win: r.win,
    reflection: r.reflection,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function addCheckInToDB(checkIn: {
  id: string;
  date: string;
  mood: string;
  energy: string;
  intention: string;
  win: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}) {
  await initDatabase();
  execAll(
    'INSERT OR REPLACE INTO check_ins (id, date, mood, energy, intention, win, reflection, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [checkIn.id, checkIn.date, checkIn.mood, checkIn.energy, checkIn.intention, checkIn.win, checkIn.reflection, checkIn.createdAt, checkIn.updatedAt],
  );
  scheduleSave();
}

export async function removeCheckInFromDB(date: string) {
  await initDatabase();
  execAll('DELETE FROM check_ins WHERE date = ?;', [date]);
  scheduleSave();
}

export async function clearCheckIns() {
  await initDatabase();
  execAll('DELETE FROM check_ins;');
  scheduleSave();
}

// XP Event helpers
export async function getXPEventsFromDB() {
  await initDatabase();
  const rows = queryRows(
    'SELECT id, date, type, amount, streakLength, description, createdAt FROM xp_events ORDER BY createdAt DESC;',
  );
  return rows.map((r: any) => ({
    id: r.id,
    date: r.date,
    type: r.type,
    amount: Number(r.amount),
    streakLength: Number(r.streakLength),
    description: r.description,
    createdAt: r.createdAt,
  }));
}

export async function addXPEventToDB(event: {
  id: string;
  date: string;
  type: string;
  amount: number;
  streakLength: number;
  description: string;
  createdAt: string;
}) {
  await initDatabase();
  execAll(
    'INSERT OR REPLACE INTO xp_events (id, date, type, amount, streakLength, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [event.id, event.date, event.type, event.amount, event.streakLength, event.description, event.createdAt],
  );
  scheduleSave();
}

export async function clearXPEvents() {
  await initDatabase();
  execAll('DELETE FROM xp_events;');
  scheduleSave();
}

// Milestone helpers
export async function getMilestonesFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, type, threshold, unlockedAt, description FROM milestones ORDER BY threshold ASC;');
  return rows.map((r: any) => ({
    id: r.id,
    type: r.type,
    threshold: Number(r.threshold),
    unlockedAt: r.unlockedAt ?? null,
    description: r.description,
  }));
}

export async function initializeMilestonesInDB() {
  await initDatabase();
  
  // Initialize check-in streak milestones (10, 20, 30, 40, 50 days)
  const milestones = [10, 20, 30, 40, 50];
  
  for (const threshold of milestones) {
    const existingRows = queryRows('SELECT id FROM milestones WHERE type = ? AND threshold = ?;', ['check-in-streak', threshold]);
    
    if (existingRows.length === 0) {
      const id = `milestone-checkin-${threshold}`;
      const description = `${threshold}-day check-in streak`;
      execAll(
        'INSERT OR REPLACE INTO milestones (id, type, threshold, unlockedAt, description) VALUES (?, ?, ?, ?, ?);',
        [id, 'check-in-streak', threshold, null, description],
      );
    }
  }
  
  scheduleSave();
}

export async function unlockMilestoneInDB(type: string, threshold: number) {
  await initDatabase();
  const now = new Date().toISOString();
  execAll('UPDATE milestones SET unlockedAt = ? WHERE type = ? AND threshold = ?;', [now, type, threshold]);
  scheduleSave();
}

export async function clearMilestones() {
  await initDatabase();
  execAll('DELETE FROM milestones;');
  scheduleSave();
}

export async function importDatabase(buffer: Uint8Array | ArrayBuffer) {
  if (!SQL) {
    SQL = await (initSqlJs as any)({ locateFile: () => sqlWasmUrl });
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const previousDatabase = db;
  const wasInitialized = initialized;

  db = new SQL.Database(bytes);
  try {
    ensureSchema();
    initialized = true;
    await saveImmediate();
  } catch (error) {
    db = previousDatabase;
    initialized = wasInitialized;
    throw error;
  }
}
