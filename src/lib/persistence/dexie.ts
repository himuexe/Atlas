import Dexie, { Table } from 'dexie';
import {
  FocusItem,
  JournalEntry,
  HealthMetric,
  Streak,
  SettingRecord,
} from '../../types/persistence';

// Dexie-based persistence for browser (IndexedDB).
// This file exposes a singleton `db` that feature modules can import and use.

export class AtlasDB extends Dexie {
  focus!: Table<FocusItem, string>;
  journal!: Table<JournalEntry, string>;
  health!: Table<HealthMetric, string>;
  streaks!: Table<Streak, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('AtlasDB');

    this.version(1).stores({
      focus: 'id, title, position, completed, updatedAt',
      journal: 'id, date, tags, updatedAt',
      health: 'id, metricType, date, updatedAt',
      streaks: 'id, habitName, lastCompletionDate',
      settings: 'key',
    });

    // Add upgrade handlers for future schema changes like:
    // this.version(2).stores({ ... }).upgrade(tx => { /* migration */ });
  }
}

export const db = new AtlasDB();

export async function openDB(): Promise<void> {
  try {
    await db.open();
  } catch (err) {
    throw new Error(`Failed to open AtlasDB: ${(err as Error).message}`);
  }
}

export async function closeDB(): Promise<void> {
  try {
    await db.close();
  } catch (err) {
    // Non-fatal
    // eslint-disable-next-line no-console
    console.warn('Failed to close AtlasDB', err);
  }
}
