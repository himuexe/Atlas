import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { get, set } from 'idb-keyval';
import { builtInLifeDimensions, createBuiltInLifeDimensions } from '../../features/life/domain/dimensions';
import { createBuiltInLifeAttributes } from '../../features/life/domain/builtInAttributes';
import { builtInPersonalityTraits, normalizeTraitDefinition, normalizeTraitExample, normalizeTraitReflection } from '../../features/life/domain/personalityTraits';
import {
  normalizeActivityAttributeLink,
  normalizeAttributeDefinition,
  normalizeAttributeEntry,
  normalizeIdealTargetRevision,
  normalizeLifeCurrentSelf,
  normalizeLifeDimension,
  normalizeLifeEvent,
  normalizeLifeIdealSelfRevision,
  normalizeLifeMilestone,
  normalizeLifePersonalValue,
  normalizeLifeProfile,
  normalizeLifeReflection,
  normalizeLifeTimestamp,
} from '../../features/life/domain/types';
import type {
  ActivityAttributeLink,
  AttributeDefinition,
  AttributeEntry,
  IdealTargetRevision,
  LifeCurrentSelf,
  LifeDimension,
  LifeEvent,
  LifeIdealSelfRevision,
  LifeMilestone,
  LifePersonalValue,
  LifeProfile,
  LifeReflection,
} from '../../features/life/domain/types';
import type { HealthMetricEntry, HealthMetricKey, HealthSnapshot } from '../../features/health/types';
import type {
  PersonalityCharacterSnapshot,
  PersonalityTrait,
  TraitDefinitionRevision,
  TraitExample,
  TraitReflectionRevision,
} from '../../features/life/domain/personalityTraits';

const DB_KEY = 'atlas.sqlite';
const SAVE_DEBOUNCE_MS = 500;
const WATER_BOTTLES_MIGRATION_KEY = 'health-water-unit-bottles-v1';
const LIFE_SCHEMA_VERSION = 7;

let SQL: any = null;
let db: any = null;
let saveTimer: number | null = null;
let initialized = false;
let initializationPromise: Promise<void> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

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
  restDays TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visit_days (
  date TEXT PRIMARY KEY
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

CREATE TABLE IF NOT EXISTS goal_milestones (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  completedAt TEXT,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goal_milestones_goalId_position
  ON goal_milestones(goalId, position);

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

const LIFE_SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS life_schema_migrations (
  version INTEGER PRIMARY KEY,
  appliedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_dimensions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  isBuiltIn INTEGER NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_profiles (
  id TEXT PRIMARY KEY CHECK (id = 'current'),
  name TEXT,
  occupation TEXT,
  education TEXT,
  description TEXT,
  lifePhase TEXT,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_attribute_definitions (
  id TEXT PRIMARY KEY,
  dimensionId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL,
  valueType TEXT NOT NULL,
  unit TEXT,
  priority TEXT NOT NULL,
  measurementFrequency TEXT,
  assessmentMethodology TEXT,
  measurementSource TEXT,
  isBuiltIn INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (dimensionId) REFERENCES life_dimensions(id)
);

CREATE TABLE IF NOT EXISTS life_attribute_entries (
  id TEXT PRIMARY KEY,
  attributeId TEXT NOT NULL,
  recordedAt TEXT NOT NULL,
  valueJson TEXT NOT NULL,
  source TEXT,
  note TEXT,
  isValid INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (attributeId) REFERENCES life_attribute_definitions(id)
);
CREATE INDEX IF NOT EXISTS idx_life_attribute_entries_attribute_recorded
  ON life_attribute_entries(attributeId, recordedAt DESC, createdAt DESC);

CREATE TABLE IF NOT EXISTS life_ideal_target_revisions (
  id TEXT PRIMARY KEY,
  attributeId TEXT NOT NULL,
  targetValueJson TEXT,
  narrative TEXT,
  reason TEXT,
  successDefinition TEXT,
  priority TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  supersededAt TEXT,
  FOREIGN KEY (attributeId) REFERENCES life_attribute_definitions(id)
);
CREATE INDEX IF NOT EXISTS idx_life_ideal_targets_attribute_active
  ON life_ideal_target_revisions(attributeId, supersededAt, createdAt DESC);

CREATE TABLE IF NOT EXISTS life_activity_attribute_links (
  id TEXT PRIMARY KEY,
  attributeId TEXT NOT NULL,
  activitySource TEXT NOT NULL,
  activityId TEXT NOT NULL,
  relationshipNote TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (attributeId) REFERENCES life_attribute_definitions(id)
);

CREATE TABLE IF NOT EXISTS life_milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  achievedAt TEXT,
  evidence TEXT,
  reflection TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_reflections (
  id TEXT PRIMARY KEY,
  periodType TEXT NOT NULL,
  periodStart TEXT NOT NULL,
  periodEnd TEXT,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_events (
  id TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  occurredAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`;

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    saveImmediate().catch((err) => console.error('Failed to save DB:', err));
  }, SAVE_DEBOUNCE_MS);
}

function saveImmediate(): Promise<void> {
  if (!db) return Promise.resolve();
  const data = db.export();
  const write = saveQueue.then(() => set(DB_KEY, data));
  saveQueue = write.catch(() => undefined);
  return write;
}

export async function flushDatabaseSave(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await saveImmediate();
}

export async function initDatabase() {
  if (initialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = initializeDatabase();
  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

async function initializeDatabase() {
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
  }

  ensureSchema();
  await saveImmediate();

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

  db.run('PRAGMA foreign_keys = ON;');
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

  const streakColumns = getTableColumns('streak_habits');
  if (!streakColumns.includes('restDays')) {
    db.run("ALTER TABLE streak_habits ADD COLUMN restDays TEXT NOT NULL DEFAULT '[]';");
  }

  const waterUnitMigration = queryRows('SELECT value FROM settings WHERE key = ? LIMIT 1;', [WATER_BOTTLES_MIGRATION_KEY]);
  if (waterUnitMigration.length === 0) {
    const legacyWaterValue = queryRows('SELECT water FROM health_state WHERE id = ? LIMIT 1;', ['current']);
    if (legacyWaterValue.length > 0 && legacyWaterValue[0].water !== null) {
      db.run('UPDATE health_state SET water = NULL WHERE id = ?;', ['current']);
      if (getTableColumns('health_metric_entries').length > 0) {
        db.run(
          "UPDATE health_metric_entries SET value = NULL WHERE metric = 'water' AND origin = 'legacy-baseline' AND observedAt IS NULL;",
        );
      }
    }
    db.run('INSERT INTO settings (key, value) VALUES (?, ?);', [WATER_BOTTLES_MIGRATION_KEY, 'bottles-750ml']);
  }

  applyLifeMigrations();
}

function applyLifeMigrations() {
  if (!db) throw new Error('DB not initialized');
  db.run(LIFE_SCHEMA_V1);
  const v1Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [1]);
  if (v1Migration.length === 0) {
    const appliedAt = new Date().toISOString();
    db.run('BEGIN;');
    try {
      for (const dimension of createBuiltInLifeDimensions(appliedAt)) {
        execAll(
          `INSERT OR IGNORE INTO life_dimensions (id, name, description, isBuiltIn, isActive, position, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [dimension.id, dimension.name, dimension.description, 1, 1, dimension.position, dimension.createdAt, dimension.updatedAt],
        );
      }
      execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [1, appliedAt]);
      db.run('COMMIT;');
    } catch (error) {
      db.run('ROLLBACK;');
      throw error;
    }
  }

  const v2Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [2]);
  if (v2Migration.length === 0) {
    const appliedAt = new Date().toISOString();
    db.run('BEGIN;');
    try {
      db.run(`
        CREATE TRIGGER IF NOT EXISTS life_attribute_definition_values_insert
        BEFORE INSERT ON life_attribute_definitions
        WHEN NEW.kind NOT IN ('measurement', 'capability', 'subjective-assessment')
          OR NEW.valueType NOT IN ('numeric', 'rating', 'boolean', 'counter', 'frequency', 'milestone', 'narrative')
          OR NEW.priority NOT IN ('high', 'medium', 'low', 'maintain')
          OR NEW.isBuiltIn NOT IN (0, 1) OR NEW.isActive NOT IN (0, 1)
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.dimensionId)) = 0 OR length(trim(NEW.name)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life attribute definition'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_definition_values_update
        BEFORE UPDATE ON life_attribute_definitions
        WHEN NEW.kind NOT IN ('measurement', 'capability', 'subjective-assessment')
          OR NEW.valueType NOT IN ('numeric', 'rating', 'boolean', 'counter', 'frequency', 'milestone', 'narrative')
          OR NEW.priority NOT IN ('high', 'medium', 'low', 'maintain')
          OR NEW.isBuiltIn NOT IN (0, 1) OR NEW.isActive NOT IN (0, 1)
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.dimensionId)) = 0 OR length(trim(NEW.name)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life attribute definition'); END;
        CREATE TRIGGER IF NOT EXISTS life_ideal_revision_immutable
        BEFORE UPDATE ON life_ideal_target_revisions
        BEGIN SELECT RAISE(ABORT, 'Ideal Self revisions are immutable'); END;
        CREATE TRIGGER IF NOT EXISTS life_ideal_revision_priority_insert
        BEFORE INSERT ON life_ideal_target_revisions
        WHEN NEW.priority NOT IN ('high', 'medium', 'low', 'maintain')
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.attributeId)) = 0
          OR (NEW.targetValueJson IS NULL AND (NEW.narrative IS NULL OR length(trim(NEW.narrative)) = 0))
        BEGIN SELECT RAISE(ABORT, 'Invalid Life Ideal Self revision'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_entry_values_insert
        BEFORE INSERT ON life_attribute_entries
        WHEN NEW.isValid NOT IN (0, 1) OR length(trim(NEW.id)) = 0
          OR length(trim(NEW.attributeId)) = 0 OR length(trim(NEW.valueJson)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life attribute entry'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_entry_values_update
        BEFORE UPDATE ON life_attribute_entries
        WHEN NEW.isValid NOT IN (0, 1) OR length(trim(NEW.id)) = 0
          OR length(trim(NEW.attributeId)) = 0 OR length(trim(NEW.valueJson)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life attribute entry'); END;
        CREATE TRIGGER IF NOT EXISTS life_activity_source_insert
        BEFORE INSERT ON life_activity_attribute_links
        WHEN NEW.activitySource NOT IN ('focus_items', 'health_state', 'journal_entries', 'streak_habits',
          'savings_entries', 'goals', 'goal_milestones', 'notes', 'check_ins', 'xp_events', 'visit_days', 'life_milestones')
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.activityId)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life activity link'); END;
        CREATE TRIGGER IF NOT EXISTS life_activity_source_update
        BEFORE UPDATE ON life_activity_attribute_links
        WHEN NEW.activitySource NOT IN ('focus_items', 'health_state', 'journal_entries', 'streak_habits',
          'savings_entries', 'goals', 'goal_milestones', 'notes', 'check_ins', 'xp_events', 'visit_days', 'life_milestones')
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.activityId)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life activity link'); END;
        CREATE TRIGGER IF NOT EXISTS life_reflection_period_insert
        BEFORE INSERT ON life_reflections
        WHEN NEW.periodType NOT IN ('daily', 'weekly', 'monthly', 'annual', 'custom')
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.periodStart)) = 0 OR length(trim(NEW.content)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life reflection'); END;
        CREATE TRIGGER IF NOT EXISTS life_reflection_period_update
        BEFORE UPDATE ON life_reflections
        WHEN NEW.periodType NOT IN ('daily', 'weekly', 'monthly', 'annual', 'custom')
          OR length(trim(NEW.id)) = 0 OR length(trim(NEW.periodStart)) = 0 OR length(trim(NEW.content)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life reflection'); END;
        CREATE TRIGGER IF NOT EXISTS life_milestone_values_insert
        BEFORE INSERT ON life_milestones
        WHEN length(trim(NEW.id)) = 0 OR length(trim(NEW.title)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life milestone'); END;
        CREATE TRIGGER IF NOT EXISTS life_milestone_values_update
        BEFORE UPDATE ON life_milestones
        WHEN length(trim(NEW.id)) = 0 OR length(trim(NEW.title)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life milestone'); END;
        CREATE TRIGGER IF NOT EXISTS life_event_values_insert
        BEFORE INSERT ON life_events
        WHEN length(trim(NEW.id)) = 0 OR length(trim(NEW.eventType)) = 0 OR length(trim(NEW.title)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life event'); END;
        CREATE TRIGGER IF NOT EXISTS life_event_values_update
        BEFORE UPDATE ON life_events
        WHEN length(trim(NEW.id)) = 0 OR length(trim(NEW.eventType)) = 0 OR length(trim(NEW.title)) = 0
        BEGIN SELECT RAISE(ABORT, 'Invalid Life event'); END;
      `);
      execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [2, appliedAt]);
      db.run('COMMIT;');
    } catch (error) {
      db.run('ROLLBACK;');
      throw error;
    }

  }

  const v3Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [3]);
  if (v3Migration.length === 0) {
    const appliedAt = new Date().toISOString();
    db.run('BEGIN;');
    try {
      const profileColumns = getTableColumns('life_profiles');
      if (!profileColumns.includes('dateOfBirth')) db.run('ALTER TABLE life_profiles ADD COLUMN dateOfBirth TEXT;');
      if (!profileColumns.includes('location')) db.run('ALTER TABLE life_profiles ADD COLUMN location TEXT;');
      if (!profileColumns.includes('currentCircumstances')) db.run('ALTER TABLE life_profiles ADD COLUMN currentCircumstances TEXT;');
      if (!profileColumns.includes('importantResponsibilities')) db.run('ALTER TABLE life_profiles ADD COLUMN importantResponsibilities TEXT;');
      if (!profileColumns.includes('interests')) db.run('ALTER TABLE life_profiles ADD COLUMN interests TEXT;');
      db.run(`
        CREATE TABLE IF NOT EXISTS life_current_self (
          id TEXT PRIMARY KEY CHECK (id = 'current'),
          physicalCondition TEXT,
          careerSituation TEXT,
          financialCircumstances TEXT,
          knowledgeCapabilities TEXT,
          relationshipsSocialLife TEXT,
          habitsCharacter TEXT,
          currentChallenges TEXT,
          currentStrengths TEXT,
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS life_ideal_self_revisions (
          id TEXT PRIMARY KEY,
          narrative TEXT NOT NULL CHECK (length(trim(narrative)) > 0),
          createdAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_life_ideal_self_revisions_created
          ON life_ideal_self_revisions(createdAt, id);
        CREATE TRIGGER IF NOT EXISTS life_ideal_self_revision_immutable
        BEFORE UPDATE ON life_ideal_self_revisions
        BEGIN SELECT RAISE(ABORT, 'Ideal Self revisions are immutable'); END;
        CREATE TABLE IF NOT EXISTS life_personal_values (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL CHECK (length(trim(name)) > 0),
          description TEXT,
          priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low', 'maintain')),
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [3, appliedAt]);
      db.run('COMMIT;');
    } catch (error) {
      db.run('ROLLBACK;');
      throw error;
    }
  }

  const v4Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [4]);
  if (v4Migration.length === 0) {
    const appliedAt = new Date().toISOString();
    db.run('BEGIN;');
    try {
      for (const attribute of createBuiltInLifeAttributes(appliedAt)) {
        const existing = queryRows('SELECT id FROM life_attribute_definitions WHERE id = ?;', [attribute.id]);
        if (existing.length === 0) {
          execAll(
            `INSERT INTO life_attribute_definitions
             (id, dimensionId, name, description, kind, valueType, unit, priority, measurementFrequency,
              assessmentMethodology, measurementSource, isBuiltIn, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 1, 1, ?, ?);`,
            [attribute.id, attribute.dimensionId, attribute.name, attribute.description, attribute.kind,
              attribute.valueType, attribute.unit ?? null, attribute.priority, attribute.measurementFrequency ?? null,
              appliedAt, appliedAt],
          );
        }
      }
      db.run(`
        CREATE TRIGGER IF NOT EXISTS life_builtin_attribute_insert_guard
        BEFORE INSERT ON life_attribute_definitions
        WHEN NEW.isBuiltIn = 1
        BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions are migration-managed'); END;
        CREATE TRIGGER IF NOT EXISTS life_builtin_attribute_update_guard
        BEFORE UPDATE ON life_attribute_definitions
        WHEN OLD.isBuiltIn = 1
        BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions cannot be changed'); END;
        CREATE TRIGGER IF NOT EXISTS life_builtin_attribute_delete_guard
        BEFORE DELETE ON life_attribute_definitions
        WHEN OLD.isBuiltIn = 1
        BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions cannot be deleted'); END;
        CREATE TRIGGER IF NOT EXISTS life_builtin_dimension_update_guard
        BEFORE UPDATE ON life_dimensions
        WHEN OLD.isBuiltIn = 1
        BEGIN SELECT RAISE(ABORT, 'Built-in dimensions cannot be changed'); END;
        CREATE TRIGGER IF NOT EXISTS life_builtin_dimension_delete_guard
        BEFORE DELETE ON life_dimensions
        WHEN OLD.isBuiltIn = 1
        BEGIN SELECT RAISE(ABORT, 'Built-in dimensions cannot be deleted'); END;
        CREATE TRIGGER IF NOT EXISTS life_active_attribute_dimension_insert_guard
        BEFORE INSERT ON life_attribute_definitions
        WHEN NEW.isActive = 1 AND NOT EXISTS (
          SELECT 1 FROM life_dimensions WHERE id = NEW.dimensionId AND isActive = 1
        )
        BEGIN SELECT RAISE(ABORT, 'Active attributes require an active dimension'); END;
        CREATE TRIGGER IF NOT EXISTS life_active_attribute_dimension_update_guard
        BEFORE UPDATE OF dimensionId, isActive ON life_attribute_definitions
        WHEN NEW.isActive = 1 AND (OLD.isActive = 0 OR OLD.dimensionId <> NEW.dimensionId) AND NOT EXISTS (
          SELECT 1 FROM life_dimensions WHERE id = NEW.dimensionId AND isActive = 1
        )
        BEGIN SELECT RAISE(ABORT, 'Active attributes require an active dimension'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_metadata_insert_guard
        BEFORE INSERT ON life_attribute_definitions
        WHEN NOT (
          (NEW.kind = 'measurement' AND NEW.valueType IN ('counter', 'frequency')) OR
          (NEW.kind = 'capability' AND NEW.valueType = 'narrative') OR
          (NEW.kind = 'subjective-assessment' AND NEW.valueType IN ('rating', 'narrative'))
        ) OR (NEW.unit IS NOT NULL AND NEW.kind <> 'measurement')
        BEGIN SELECT RAISE(ABORT, 'Incompatible Life attribute metadata'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_metadata_update_guard
        BEFORE UPDATE ON life_attribute_definitions
        WHEN (
          (NEW.kind <> OLD.kind OR NEW.valueType <> OLD.valueType) AND NOT (
            (NEW.kind = 'measurement' AND NEW.valueType IN ('counter', 'frequency')) OR
            (NEW.kind = 'capability' AND NEW.valueType = 'narrative') OR
            (NEW.kind = 'subjective-assessment' AND NEW.valueType IN ('rating', 'narrative'))
          )
        ) OR (NEW.unit IS NOT OLD.unit AND NEW.unit IS NOT NULL AND NEW.kind <> 'measurement')
        BEGIN SELECT RAISE(ABORT, 'Incompatible Life attribute metadata'); END;
      `);
      execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [4, appliedAt]);
      db.run('COMMIT;');
    } catch (error) {
      db.run('ROLLBACK;');
      throw error;
    }
  }

  const v5Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [5]);
  if (v5Migration.length === 0) {
    const appliedAt = new Date().toISOString();
    db.run('BEGIN;');
    try {
      const entryColumns = getTableColumns('life_attribute_entries');
      if (!entryColumns.includes('invalidatedAt')) {
        db.run('ALTER TABLE life_attribute_entries ADD COLUMN invalidatedAt TEXT;');
      }
      if (!entryColumns.includes('invalidationReason')) {
        db.run('ALTER TABLE life_attribute_entries ADD COLUMN invalidationReason TEXT;');
      }
      if (!entryColumns.includes('correctsEntryId')) {
        db.run('ALTER TABLE life_attribute_entries ADD COLUMN correctsEntryId TEXT REFERENCES life_attribute_entries(id);');
      }
      db.run(`
        DROP TRIGGER IF EXISTS life_attribute_entry_values_update;
        CREATE TRIGGER life_attribute_entry_values_update
        BEFORE UPDATE ON life_attribute_entries
        WHEN NOT (
          OLD.isValid = 1 AND NEW.isValid = 0
          AND NEW.id = OLD.id AND NEW.attributeId = OLD.attributeId
          AND NEW.recordedAt = OLD.recordedAt AND NEW.valueJson = OLD.valueJson
          AND NEW.source IS OLD.source AND NEW.note IS OLD.note
          AND NEW.createdAt = OLD.createdAt AND NEW.correctsEntryId IS OLD.correctsEntryId
          AND NEW.invalidatedAt IS NOT NULL AND NEW.invalidationReason IS NOT NULL
          AND length(trim(NEW.invalidationReason)) > 0
        )
        BEGIN SELECT RAISE(ABORT, 'Life entries are immutable except for audited invalidation'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_entry_correction_insert
        BEFORE INSERT ON life_attribute_entries
        WHEN NEW.correctsEntryId IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM life_attribute_entries prior
          WHERE prior.id = NEW.correctsEntryId AND prior.attributeId = NEW.attributeId AND prior.isValid = 1
        )
        BEGIN SELECT RAISE(ABORT, 'A correction must reference a valid entry for the same attribute'); END;
        CREATE TRIGGER IF NOT EXISTS life_attribute_entry_invalidation_insert
        BEFORE INSERT ON life_attribute_entries
        WHEN NEW.isValid = 0 OR NEW.invalidatedAt IS NOT NULL OR NEW.invalidationReason IS NOT NULL
        BEGIN SELECT RAISE(ABORT, 'Life entries must be invalidated through the audit operation'); END;
      `);
      execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [5, appliedAt]);
      db.run('COMMIT;');
    } catch (error) {
      db.run('ROLLBACK;');
      throw error;
    }
  }

  const v6Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [6]);
  if (v6Migration.length === 0) {
      const appliedAt = new Date().toISOString();
      db.run('BEGIN;');
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS life_personality_traits (
            id TEXT PRIMARY KEY,
            isBuiltIn INTEGER NOT NULL CHECK (isBuiltIn IN (0, 1)),
            isActive INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1)),
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS life_trait_definition_revisions (
            id TEXT PRIMARY KEY,
            traitId TEXT NOT NULL,
            name TEXT NOT NULL CHECK (length(trim(name)) > 0),
            definition TEXT NOT NULL CHECK (length(trim(definition)) > 0),
            description TEXT,
            createdAt TEXT NOT NULL,
            UNIQUE (id, traitId),
            FOREIGN KEY (traitId) REFERENCES life_personality_traits(id)
          );
          CREATE TABLE IF NOT EXISTS life_trait_reflection_revisions (
            id TEXT PRIMARY KEY,
            traitId TEXT NOT NULL,
            definitionRevisionId TEXT NOT NULL,
            currentExpression TEXT,
            desiredExpression TEXT,
            personalMeaning TEXT,
            importance TEXT CHECK (importance IS NULL OR importance IN ('low', 'medium', 'high')),
            developmentNotes TEXT,
            createdAt TEXT NOT NULL,
            CHECK (
              COALESCE(length(trim(currentExpression)), 0) > 0 OR
              COALESCE(length(trim(desiredExpression)), 0) > 0 OR
              COALESCE(length(trim(personalMeaning)), 0) > 0 OR
              importance IS NOT NULL OR
              COALESCE(length(trim(developmentNotes)), 0) > 0
            ),
            FOREIGN KEY (traitId) REFERENCES life_personality_traits(id),
            FOREIGN KEY (definitionRevisionId, traitId) REFERENCES life_trait_definition_revisions(id, traitId)
          );
          CREATE TABLE IF NOT EXISTS life_trait_examples (
            id TEXT PRIMARY KEY,
            traitId TEXT NOT NULL,
            description TEXT NOT NULL CHECK (length(trim(description)) > 0),
            occurredOn TEXT NOT NULL,
            recordedAt TEXT NOT NULL,
            context TEXT,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (traitId) REFERENCES life_personality_traits(id)
          );
          CREATE TABLE IF NOT EXISTS life_trait_history_guard (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            allowDelete INTEGER NOT NULL DEFAULT 0 CHECK (allowDelete IN (0, 1))
          );
          INSERT OR IGNORE INTO life_trait_history_guard (id, allowDelete) VALUES (1, 0);
          CREATE INDEX IF NOT EXISTS idx_life_trait_definitions_current
            ON life_trait_definition_revisions(traitId, createdAt DESC, id DESC);
          CREATE INDEX IF NOT EXISTS idx_life_trait_reflections_current
            ON life_trait_reflection_revisions(traitId, createdAt DESC, id DESC);
          CREATE INDEX IF NOT EXISTS idx_life_trait_examples_order
            ON life_trait_examples(traitId, occurredOn DESC, recordedAt DESC, id DESC);
          CREATE TRIGGER IF NOT EXISTS life_trait_builtin_identity_update_guard
          BEFORE UPDATE ON life_personality_traits
          WHEN OLD.isBuiltIn = 1 OR NEW.id <> OLD.id OR NEW.isBuiltIn <> OLD.isBuiltIn OR NEW.createdAt <> OLD.createdAt
          BEGIN SELECT RAISE(ABORT, 'Built-in traits are migration-managed'); END;
          CREATE TRIGGER IF NOT EXISTS life_trait_builtin_identity_delete_guard
          BEFORE DELETE ON life_personality_traits
          WHEN OLD.isBuiltIn = 1
          BEGIN SELECT RAISE(ABORT, 'Built-in traits cannot be deleted'); END;
          CREATE TRIGGER IF NOT EXISTS life_trait_definition_immutable_update
          BEFORE UPDATE ON life_trait_definition_revisions
          BEGIN SELECT RAISE(ABORT, 'Trait definition revisions are immutable'); END;
          CREATE TRIGGER IF NOT EXISTS life_trait_definition_immutable_delete
          BEFORE DELETE ON life_trait_definition_revisions
          WHEN EXISTS (
            SELECT 1 FROM life_personality_traits WHERE id = OLD.traitId AND isBuiltIn = 1
          ) OR NOT EXISTS (SELECT 1 FROM life_trait_history_guard WHERE id = 1 AND allowDelete = 1)
          BEGIN SELECT RAISE(ABORT, 'Trait definition revisions are immutable'); END;
          CREATE TRIGGER IF NOT EXISTS life_trait_reflection_immutable_update
          BEFORE UPDATE ON life_trait_reflection_revisions
          BEGIN SELECT RAISE(ABORT, 'Trait reflection revisions are immutable'); END;
          CREATE TRIGGER IF NOT EXISTS life_trait_reflection_immutable_delete
          BEFORE DELETE ON life_trait_reflection_revisions
          WHEN NOT EXISTS (SELECT 1 FROM life_trait_history_guard WHERE id = 1 AND allowDelete = 1)
          BEGIN SELECT RAISE(ABORT, 'Trait reflection revisions are immutable'); END;
        `);

        for (const trait of builtInPersonalityTraits) {
          const traitId = `atlas.trait.${trait.id}`;
          const definitionId = `${traitId}.definition.v1`;
          execAll(
            `INSERT OR IGNORE INTO life_personality_traits (id, isBuiltIn, isActive, createdAt, updatedAt)
             VALUES (?, 1, 1, ?, ?);`,
            [traitId, appliedAt, appliedAt],
          );
          const identity = queryRows('SELECT isBuiltIn FROM life_personality_traits WHERE id = ?;', [traitId])[0];
          if (identity && Boolean(identity.isBuiltIn)) {
            execAll(
              `INSERT OR IGNORE INTO life_trait_definition_revisions
               (id, traitId, name, definition, description, createdAt)
               VALUES (?, ?, ?, ?, ?, ?);`,
              [definitionId, traitId, trait.name, trait.definition, trait.description, appliedAt],
            );
          }
        }

        execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [6, appliedAt]);
        db.run('COMMIT;');
      } catch (error) {
        db.run('ROLLBACK;');
        throw error;
      }
    }

    const v7Migration = queryRows('SELECT version FROM life_schema_migrations WHERE version = ?;', [7]);
    if (v7Migration.length === 0) {
      const appliedAt = new Date().toISOString();
      db.run('BEGIN;');
      try {
        const definitionColumns = getTableColumns('life_attribute_definitions');
        if (!definitionColumns.includes('financialType')) {
          db.run('ALTER TABLE life_attribute_definitions ADD COLUMN financialType TEXT;');
        }
        const entryColumns = getTableColumns('life_attribute_entries');
        if (!entryColumns.includes('currency')) db.run('ALTER TABLE life_attribute_entries ADD COLUMN currency TEXT;');
        if (!entryColumns.includes('scope')) db.run('ALTER TABLE life_attribute_entries ADD COLUMN scope TEXT;');
        if (!entryColumns.includes('reportingPeriodStart')) db.run('ALTER TABLE life_attribute_entries ADD COLUMN reportingPeriodStart TEXT;');
        if (!entryColumns.includes('reportingPeriodEnd')) db.run('ALTER TABLE life_attribute_entries ADD COLUMN reportingPeriodEnd TEXT;');
        const targetColumns = getTableColumns('life_ideal_target_revisions');
        if (!targetColumns.includes('currency')) db.run('ALTER TABLE life_ideal_target_revisions ADD COLUMN currency TEXT;');
        if (!targetColumns.includes('scope')) db.run('ALTER TABLE life_ideal_target_revisions ADD COLUMN scope TEXT;');
        if (!targetColumns.includes('reportingPeriodStart')) db.run('ALTER TABLE life_ideal_target_revisions ADD COLUMN reportingPeriodStart TEXT;');
        if (!targetColumns.includes('reportingPeriodEnd')) db.run('ALTER TABLE life_ideal_target_revisions ADD COLUMN reportingPeriodEnd TEXT;');
        const reflectionColumns = getTableColumns('life_reflections');
        if (!reflectionColumns.includes('modifiedAt')) {
          db.run('ALTER TABLE life_reflections ADD COLUMN modifiedAt TEXT;');
          db.run('UPDATE life_reflections SET modifiedAt = createdAt WHERE modifiedAt IS NULL;');
        }
        db.run('DROP TRIGGER IF EXISTS life_builtin_attribute_update_guard;');
        db.run(`
          CREATE TABLE IF NOT EXISTS health_metric_entries (
            sequence INTEGER PRIMARY KEY AUTOINCREMENT,
            id TEXT NOT NULL UNIQUE,
            metric TEXT NOT NULL CHECK (metric IN ('weight', 'water', 'sleep', 'workout')),
            value REAL,
            observedAt TEXT,
            enteredAt TEXT NOT NULL,
            origin TEXT NOT NULL CHECK (origin IN ('user', 'legacy-baseline')),
            CHECK (origin <> 'user' OR observedAt IS NOT NULL),
            CHECK (value IS NULL OR typeof(value) IN ('integer', 'real'))
          );
          CREATE INDEX IF NOT EXISTS idx_health_metric_history
            ON health_metric_entries(metric, observedAt DESC, sequence DESC);
          DROP TRIGGER IF EXISTS life_builtin_attribute_insert_guard;
          DROP TRIGGER IF EXISTS life_attribute_entry_values_update;
          CREATE TRIGGER life_attribute_entry_values_update
          BEFORE UPDATE ON life_attribute_entries
          WHEN NOT (
            OLD.isValid = 1 AND NEW.isValid = 0
            AND NEW.id = OLD.id AND NEW.attributeId = OLD.attributeId
            AND NEW.recordedAt = OLD.recordedAt AND NEW.valueJson = OLD.valueJson
            AND NEW.source IS OLD.source AND NEW.note IS OLD.note
            AND NEW.createdAt = OLD.createdAt AND NEW.correctsEntryId IS OLD.correctsEntryId
            AND NEW.currency IS OLD.currency AND NEW.scope IS OLD.scope
            AND NEW.reportingPeriodStart IS OLD.reportingPeriodStart
            AND NEW.reportingPeriodEnd IS OLD.reportingPeriodEnd
            AND NEW.invalidatedAt IS NOT NULL AND NEW.invalidationReason IS NOT NULL
            AND length(trim(NEW.invalidationReason)) > 0
          )
          BEGIN SELECT RAISE(ABORT, 'Life entries are immutable except for audited invalidation'); END;
          DROP TRIGGER IF EXISTS life_attribute_metadata_insert_guard;
          DROP TRIGGER IF EXISTS life_attribute_metadata_update_guard;
          CREATE TRIGGER life_attribute_metadata_insert_guard
          BEFORE INSERT ON life_attribute_definitions
          WHEN NOT (
            (NEW.kind = 'measurement' AND NEW.valueType IN ('numeric', 'counter', 'frequency', 'milestone')) OR
            (NEW.kind = 'capability' AND NEW.valueType IN ('narrative', 'boolean')) OR
            (NEW.kind = 'subjective-assessment' AND NEW.valueType IN ('rating', 'narrative', 'boolean'))
          ) OR (NEW.unit IS NOT NULL AND NEW.kind <> 'measurement')
            OR (NEW.financialType IS NOT NULL AND (NEW.financialType NOT IN ('income', 'net-worth') OR NEW.kind <> 'measurement' OR NEW.valueType <> 'numeric'))
          BEGIN SELECT RAISE(ABORT, 'Incompatible Life attribute metadata'); END;
          CREATE TRIGGER life_attribute_metadata_update_guard
          BEFORE UPDATE ON life_attribute_definitions
          WHEN (
            (NEW.kind <> OLD.kind OR NEW.valueType <> OLD.valueType) AND NOT (
              (NEW.kind = 'measurement' AND NEW.valueType IN ('numeric', 'counter', 'frequency', 'milestone')) OR
              (NEW.kind = 'capability' AND NEW.valueType IN ('narrative', 'boolean')) OR
              (NEW.kind = 'subjective-assessment' AND NEW.valueType IN ('rating', 'narrative', 'boolean'))
            )
          ) OR (NEW.unit IS NOT OLD.unit AND NEW.unit IS NOT NULL AND NEW.kind <> 'measurement')
            OR (NEW.financialType IS NOT NULL AND (NEW.financialType NOT IN ('income', 'net-worth') OR NEW.kind <> 'measurement' OR NEW.valueType <> 'numeric'))
          BEGIN SELECT RAISE(ABORT, 'Incompatible Life attribute metadata'); END;
          CREATE TRIGGER IF NOT EXISTS life_financial_entry_insert_guard
          BEFORE INSERT ON life_attribute_entries
          WHEN (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NOT NULL AND
            (NEW.currency IS NULL OR length(NEW.currency) <> 3 OR NEW.currency <> upper(NEW.currency))
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) = 'income' AND
            (NEW.scope IS NULL OR length(trim(NEW.scope)) = 0 OR NEW.reportingPeriodStart IS NULL OR NEW.reportingPeriodEnd IS NULL OR NEW.reportingPeriodEnd < NEW.reportingPeriodStart)
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NULL AND
            (NEW.currency IS NOT NULL OR NEW.scope IS NOT NULL OR NEW.reportingPeriodStart IS NOT NULL OR NEW.reportingPeriodEnd IS NOT NULL)
          )
          BEGIN SELECT RAISE(ABORT, 'Invalid financial Life observation metadata'); END;
          CREATE TRIGGER IF NOT EXISTS life_financial_entry_update_guard
          BEFORE UPDATE ON life_attribute_entries
          WHEN (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NOT NULL AND
            (NEW.currency IS NULL OR length(NEW.currency) <> 3 OR NEW.currency <> upper(NEW.currency))
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) = 'income' AND
            (NEW.scope IS NULL OR length(trim(NEW.scope)) = 0 OR NEW.reportingPeriodStart IS NULL OR NEW.reportingPeriodEnd IS NULL OR NEW.reportingPeriodEnd < NEW.reportingPeriodStart)
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NULL AND
            (NEW.currency IS NOT NULL OR NEW.scope IS NOT NULL OR NEW.reportingPeriodStart IS NOT NULL OR NEW.reportingPeriodEnd IS NOT NULL)
          )
          BEGIN SELECT RAISE(ABORT, 'Invalid financial Life observation metadata'); END;
          CREATE TRIGGER IF NOT EXISTS life_financial_target_insert_guard
          BEFORE INSERT ON life_ideal_target_revisions
          WHEN (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NOT NULL AND
            NEW.targetValueJson IS NOT NULL AND
            (NEW.currency IS NULL OR length(NEW.currency) <> 3 OR NEW.currency <> upper(NEW.currency))
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) = 'income' AND
            NEW.targetValueJson IS NOT NULL AND
            (NEW.scope IS NULL OR length(trim(NEW.scope)) = 0 OR NEW.reportingPeriodStart IS NULL OR
             NEW.reportingPeriodEnd IS NULL OR NEW.reportingPeriodEnd < NEW.reportingPeriodStart)
          ) OR (
            (SELECT financialType FROM life_attribute_definitions WHERE id = NEW.attributeId) IS NULL AND
            (NEW.currency IS NOT NULL OR NEW.scope IS NOT NULL OR NEW.reportingPeriodStart IS NOT NULL OR NEW.reportingPeriodEnd IS NOT NULL)
          ) OR (
            NEW.targetValueJson IS NULL AND
            (NEW.currency IS NOT NULL OR NEW.scope IS NOT NULL OR NEW.reportingPeriodStart IS NOT NULL OR NEW.reportingPeriodEnd IS NOT NULL)
          )
          BEGIN SELECT RAISE(ABORT, 'Invalid financial Ideal Self target metadata'); END;
          DROP TRIGGER IF EXISTS life_reflection_period_insert;
          DROP TRIGGER IF EXISTS life_reflection_period_update;
          CREATE TRIGGER life_reflection_period_insert
          BEFORE INSERT ON life_reflections
          WHEN NEW.periodType NOT IN ('daily', 'weekly', 'monthly', 'annual', 'multi-year', 'custom')
            OR length(trim(NEW.id)) = 0 OR length(trim(NEW.periodStart)) = 0 OR length(trim(NEW.content)) = 0
          BEGIN SELECT RAISE(ABORT, 'Invalid Life reflection'); END;
          CREATE TRIGGER life_reflection_period_update
          BEFORE UPDATE ON life_reflections
          WHEN NEW.periodType NOT IN ('daily', 'weekly', 'monthly', 'annual', 'multi-year', 'custom')
            OR length(trim(NEW.id)) = 0 OR length(trim(NEW.periodStart)) = 0 OR length(trim(NEW.content)) = 0
          BEGIN SELECT RAISE(ABORT, 'Invalid Life reflection'); END;
        `);

        const legacyHealth = queryRows(
          'SELECT weight, water, sleep, workout FROM health_state WHERE id = ? LIMIT 1;',
          ['current'],
        )[0];
        if (legacyHealth) {
          for (const metric of ['weight', 'water', 'sleep', 'workout'] as const) {
            if (legacyHealth[metric] === null || legacyHealth[metric] === undefined) continue;
            execAll(
              `INSERT OR IGNORE INTO health_metric_entries (id, metric, value, observedAt, enteredAt, origin)
               VALUES (?, ?, ?, NULL, ?, 'legacy-baseline');`,
              [`legacy-baseline-${metric}`, metric, legacyHealth[metric], appliedAt],
            );
          }
        }

        for (const attribute of createBuiltInLifeAttributes(appliedAt)) {
          const existing = queryRows('SELECT id, isBuiltIn FROM life_attribute_definitions WHERE id = ?;', [attribute.id])[0];
          if (existing) {
            if (Boolean(existing.isBuiltIn)) {
              execAll('UPDATE life_attribute_definitions SET financialType = ? WHERE id = ?;', [
                attribute.financialType ?? null,
                attribute.id,
              ]);
            }
            continue;
          }
          execAll(
            `INSERT INTO life_attribute_definitions
             (id, dimensionId, name, description, kind, valueType, unit, priority, measurementFrequency,
              assessmentMethodology, measurementSource, isBuiltIn, isActive, createdAt, updatedAt, financialType)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 1, 1, ?, ?, ?);`,
            [attribute.id, attribute.dimensionId, attribute.name, attribute.description, attribute.kind,
              attribute.valueType, attribute.unit ?? null, attribute.priority, attribute.measurementFrequency ?? null,
              appliedAt, appliedAt, attribute.financialType ?? null],
          );
        }
        db.run(`
          CREATE TRIGGER life_builtin_attribute_insert_guard
          BEFORE INSERT ON life_attribute_definitions
          WHEN NEW.isBuiltIn = 1
          BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions are migration-managed'); END;
          CREATE TRIGGER life_builtin_attribute_update_guard
          BEFORE UPDATE ON life_attribute_definitions
          WHEN OLD.isBuiltIn = 1
          BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions cannot be changed'); END;
          CREATE TRIGGER IF NOT EXISTS life_builtin_attribute_delete_guard
          BEFORE DELETE ON life_attribute_definitions
          WHEN OLD.isBuiltIn = 1
          BEGIN SELECT RAISE(ABORT, 'Built-in attribute definitions cannot be deleted'); END;
        `);
        execAll('INSERT INTO life_schema_migrations (version, appliedAt) VALUES (?, ?);', [7, appliedAt]);
        db.run('COMMIT;');
      } catch (error) {
        db.run('ROLLBACK;');
        throw error;
      }
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

export async function getJournalDashboardSummaryFromDB(): Promise<{ entryCount: number; latestEntryAt: string | null }> {
  await initDatabase();
  const row = queryRows(
    'SELECT COUNT(*) AS entryCount, MAX(createdAt) AS latestEntryAt FROM journal_entries;',
  )[0];
  return {
    entryCount: Number(row?.entryCount ?? 0),
    latestEntryAt: row?.latestEntryAt ?? null,
  };
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
  const history = queryRows(
    `SELECT * FROM health_metric_entries
     ORDER BY metric ASC, (observedAt IS NOT NULL) DESC, observedAt DESC, sequence DESC;`,
  );
  const metrics = {} as Record<HealthMetricKey, HealthMetricEntry[]>;
  for (const metric of ['weight', 'water', 'sleep', 'workout'] as const) metrics[metric] = [];
  for (const row of history) {
    if (!(row.metric in metrics)) continue;
    metrics[row.metric as HealthMetricKey].push({
      id: row.id,
      metric: row.metric,
      value: row.value === null ? null : Number(row.value),
      observedAt: row.observedAt ?? null,
      enteredAt: row.enteredAt,
      origin: row.origin,
    });
  }
  const health = {} as HealthSnapshot;
  for (const metric of ['weight', 'water', 'sleep', 'workout'] as const) {
    health[metric] = metrics[metric][0]?.value ?? null;
  }
  let latestEnteredAt: string | null = null;
  for (const row of history) {
    if (!latestEnteredAt || row.enteredAt > latestEnteredAt) latestEnteredAt = row.enteredAt;
  }
  const legacyRows = queryRows('SELECT updatedAt FROM health_state WHERE id = ? LIMIT 1;', ['current']);
  const hasUserRecordedObservation = history.some((row: { origin: string }) => row.origin === 'user');
  if (!history.length && !legacyRows.length) return null;
  return {
    health,
    metrics,
    lastUpdated: (hasUserRecordedObservation ? latestEnteredAt : null) ??
      legacyRows[0]?.updatedAt ?? 'Existing values · measurement date unknown',
  };
}

export async function recordHealthMetricInDB(
  metric: HealthMetricKey,
  value: number | null,
  observedAt = new Date().toISOString(),
): Promise<void> {
  await initDatabase();
  if (!['weight', 'water', 'sleep', 'workout'].includes(metric)) throw new Error('Health metric is invalid.');
  if (value !== null && (!Number.isFinite(value) || (metric === 'water' && (!Number.isInteger(value) || value < 0)))) {
    throw new Error('Health metric value is invalid.');
  }
  const normalizedObservedAt = normalizeLifeTimestamp(observedAt, 'Health observation date');
  const enteredAt = new Date().toISOString();
  execAll(
    `INSERT INTO health_metric_entries (id, metric, value, observedAt, enteredAt, origin)
     VALUES (?, ?, ?, ?, ?, 'user');`,
    [`health.${metric}.${crypto.randomUUID()}`, metric, value, normalizedObservedAt, enteredAt],
  );
  scheduleSave();
}

/** Compatibility helper for imported or test snapshots with no per-metric measurement dates. */
export async function replaceHealthSnapshotInDB(
  health: HealthSnapshot,
  legacyLastUpdated: string,
) {
  await initDatabase();
  const enteredAt = new Date().toISOString();
  for (const metric of ['weight', 'water', 'sleep', 'workout'] as const) {
    execAll(
      `INSERT INTO health_metric_entries (id, metric, value, observedAt, enteredAt, origin)
       VALUES (?, ?, ?, NULL, ?, 'legacy-baseline');`,
      [`snapshot-import.${metric}.${crypto.randomUUID()}`, metric, health[metric], enteredAt],
    );
  }
  execAll(
    'INSERT OR REPLACE INTO health_state (id, weight, water, sleep, workout, updatedAt) VALUES (?, ?, ?, ?, ?, ?);',
    ['current', health.weight, health.water, health.sleep, health.workout, legacyLastUpdated],
  );
  scheduleSave();
}

export async function clearHealthSnapshot() {
  await initDatabase();
  execAll('DELETE FROM health_metric_entries;');
  execAll('DELETE FROM health_state;');
  scheduleSave();
}

// Streak helpers
export async function getStreakHabitsFromDB() {
  await initDatabase();
  const rows = queryRows('SELECT id, name, history, restDays, createdAt FROM streak_habits ORDER BY createdAt DESC');
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    history: JSON.parse(row.history),
    restDays: JSON.parse(row.restDays || '[]'),
    createdAt: row.createdAt,
  }));
}

export async function replaceStreakHabitsInDB(habits: Array<{ id: string; name: string; history: string[]; restDays: number[]; createdAt: string }>) {
  await initDatabase();
  execAll('DELETE FROM streak_habits;');
  for (const habit of habits) {
    execAll(
      'INSERT OR REPLACE INTO streak_habits (id, name, history, restDays, createdAt) VALUES (?, ?, ?, ?, ?);',
      [habit.id, habit.name, JSON.stringify(habit.history), JSON.stringify(habit.restDays), habit.createdAt],
    );
  }
  scheduleSave();
}

export async function recordVisitDayInDB(date: string) {
  await initDatabase();
  execAll('INSERT OR IGNORE INTO visit_days (date) VALUES (?);', [date]);
  scheduleSave();
}

export async function getVisitDaysFromDB(): Promise<string[]> {
  await initDatabase();
  return queryRows('SELECT date FROM visit_days ORDER BY date ASC').map((row: any) => String(row.date));
}

export async function clearVisitDays() {
  await initDatabase();
  execAll('DELETE FROM visit_days;');
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
  execAll('DELETE FROM goal_milestones;');
  execAll('DELETE FROM goals;');
  for (const goal of goals) {
    execAll(
      'INSERT OR REPLACE INTO goals (id, title, note, completed, createdAt) VALUES (?, ?, ?, ?, ?);',
      [goal.id, goal.title, goal.note ?? null, goal.completed ? 1 : 0, goal.createdAt],
    );
  }
  scheduleSave();
}

export async function saveGoalInDB(goal: { id: string; title: string; note?: string; completed: boolean; createdAt: string }) {
  await initDatabase();
  execAll(
    `INSERT INTO goals (id, title, note, completed, createdAt) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       note = excluded.note,
       completed = excluded.completed,
       createdAt = excluded.createdAt;`,
    [goal.id, goal.title, goal.note ?? null, goal.completed ? 1 : 0, goal.createdAt],
  );
  scheduleSave();
}

export async function deleteGoalFromDB(goalId: string) {
  await initDatabase();
  execAll('DELETE FROM goal_milestones WHERE goalId = ?;', [goalId]);
  execAll('DELETE FROM goals WHERE id = ?;', [goalId]);
  scheduleSave();
}

export async function getGoalMilestonesFromDB(): Promise<Array<{
  id: string;
  goalId: string;
  title: string;
  position: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}>> {
  await initDatabase();
  const rows = queryRows('SELECT id, goalId, title, position, completed, createdAt, completedAt FROM goal_milestones ORDER BY goalId, position;');
  return rows.map((row: any) => ({
    id: row.id,
    goalId: row.goalId,
    title: row.title,
    position: Number(row.position),
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? undefined,
  }));
}

export async function replaceGoalMilestonesInDB(goalId: string, milestones: Array<{
  id: string;
  goalId: string;
  title: string;
  position: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}>) {
  await initDatabase();
  execAll('DELETE FROM goal_milestones WHERE goalId = ?;', [goalId]);
  for (const milestone of milestones) {
    execAll(
      'INSERT INTO goal_milestones (id, goalId, title, position, completed, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [milestone.id, goalId, milestone.title, milestone.position, milestone.completed ? 1 : 0, milestone.createdAt, milestone.completedAt ?? null],
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

// Life foundation helpers. Attribute entries and ideal targets are revision records:
// callers can add or supersede records, but never mutate an existing observation.
function parseOptionalJson(value: unknown): unknown | undefined {
  return value === null || value === undefined ? undefined : JSON.parse(String(value));
}

export async function getLifeSchemaVersion(): Promise<number> {
  await initDatabase();
  const rows = queryRows('SELECT MAX(version) AS version FROM life_schema_migrations;');
  return Number(rows[0]?.version ?? 0);
}

export async function getLifeDimensionsFromDB(): Promise<LifeDimension[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_dimensions ORDER BY position ASC, name ASC;').map((row: any) => ({
    ...row, isBuiltIn: Boolean(row.isBuiltIn), isActive: Boolean(row.isActive), position: Number(row.position),
  }));
}

export async function saveLifeDimensionToDB(dimension: LifeDimension): Promise<void> {
  await initDatabase();
  const value = normalizeLifeDimension(dimension);
  if (value.isBuiltIn || builtInLifeDimensions.some((builtIn) => builtIn.id === value.id)) {
    throw new Error('Built-in dimensions are managed by the Life framework and cannot be changed.');
  }
  const existing = queryRows('SELECT isBuiltIn FROM life_dimensions WHERE id = ?;', [value.id])[0];
  if (existing && Boolean(existing.isBuiltIn)) {
    throw new Error('Built-in dimensions are managed by the Life framework and cannot be changed.');
  }
  db.run('BEGIN;');
  try {
    execAll(
      `INSERT INTO life_dimensions (id, name, description, isBuiltIn, isActive, position, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
         isActive = excluded.isActive, position = excluded.position, updatedAt = excluded.updatedAt;`,
      [value.id, value.name, value.description, 0, value.isActive ? 1 : 0,
        value.position, value.createdAt, value.updatedAt],
    );
    if (!value.isActive) {
      execAll(
        'UPDATE life_attribute_definitions SET isActive = 0 WHERE dimensionId = ? AND isActive = 1 AND isBuiltIn = 0;',
        [value.id],
      );
    }
    db.run('COMMIT;');
  } catch (error) {
    db.run('ROLLBACK;');
    throw error;
  }
  scheduleSave();
}

export async function getLifeProfileFromDB(): Promise<LifeProfile | null> {
  await initDatabase();
  const row = queryRows('SELECT * FROM life_profiles WHERE id = ?;', ['current'])[0];
  return row ? row as LifeProfile : null;
}

export async function saveLifeProfileToDB(profile: LifeProfile): Promise<void> {
  await initDatabase();
  const value = normalizeLifeProfile(profile);
  execAll(
    `INSERT INTO life_profiles
     (id, name, occupation, education, description, lifePhase, updatedAt, dateOfBirth, location, currentCircumstances, importantResponsibilities, interests)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, occupation = excluded.occupation,
       education = excluded.education, description = excluded.description, lifePhase = excluded.lifePhase,
       updatedAt = excluded.updatedAt, dateOfBirth = excluded.dateOfBirth, location = excluded.location,
       currentCircumstances = excluded.currentCircumstances,
       importantResponsibilities = excluded.importantResponsibilities, interests = excluded.interests;`,
    [value.id, value.name ?? null, value.occupation ?? null, value.education ?? null, value.description ?? null, value.lifePhase ?? null,
      value.updatedAt, value.dateOfBirth ?? null, value.location ?? null, value.currentCircumstances ?? null,
      value.importantResponsibilities ?? null, value.interests ?? null],
  );
  scheduleSave();
}

export async function getLifeCurrentSelfFromDB(): Promise<LifeCurrentSelf | null> {
  await initDatabase();
  const row = queryRows('SELECT * FROM life_current_self WHERE id = ?;', ['current'])[0];
  return row ? row as LifeCurrentSelf : null;
}

export async function saveLifeCurrentSelfToDB(currentSelf: LifeCurrentSelf): Promise<void> {
  await initDatabase();
  const value = normalizeLifeCurrentSelf(currentSelf);
  execAll(
    `INSERT INTO life_current_self
     (id, physicalCondition, careerSituation, financialCircumstances, knowledgeCapabilities,
      relationshipsSocialLife, habitsCharacter, currentChallenges, currentStrengths, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET physicalCondition = excluded.physicalCondition,
       careerSituation = excluded.careerSituation, financialCircumstances = excluded.financialCircumstances,
       knowledgeCapabilities = excluded.knowledgeCapabilities, relationshipsSocialLife = excluded.relationshipsSocialLife,
       habitsCharacter = excluded.habitsCharacter, currentChallenges = excluded.currentChallenges,
       currentStrengths = excluded.currentStrengths, updatedAt = excluded.updatedAt;`,
    [value.id, value.physicalCondition ?? null, value.careerSituation ?? null, value.financialCircumstances ?? null,
      value.knowledgeCapabilities ?? null, value.relationshipsSocialLife ?? null, value.habitsCharacter ?? null,
      value.currentChallenges ?? null, value.currentStrengths ?? null, value.updatedAt],
  );
  scheduleSave();
}

export async function addLifeIdealSelfRevisionToDB(revision: LifeIdealSelfRevision): Promise<void> {
  await initDatabase();
  const value = normalizeLifeIdealSelfRevision(revision);
  execAll('INSERT INTO life_ideal_self_revisions (id, narrative, createdAt) VALUES (?, ?, ?);',
    [value.id, value.narrative, value.createdAt]);
  scheduleSave();
}

export async function getLifeIdealSelfRevisionsFromDB(): Promise<LifeIdealSelfRevision[]> {
  await initDatabase();
  return queryRows('SELECT id, narrative, createdAt FROM life_ideal_self_revisions ORDER BY julianday(createdAt) ASC, id ASC;');
}

export async function getCurrentLifeIdealSelfFromDB(): Promise<LifeIdealSelfRevision | null> {
  await initDatabase();
  const row = queryRows(
    'SELECT id, narrative, createdAt FROM life_ideal_self_revisions ORDER BY julianday(createdAt) DESC, id DESC LIMIT 1;',
  )[0];
  return row ? row as LifeIdealSelfRevision : null;
}

export async function getLifePersonalValuesFromDB(): Promise<LifePersonalValue[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_personal_values ORDER BY createdAt ASC, id ASC;');
}

export async function saveLifePersonalValueToDB(value: LifePersonalValue): Promise<void> {
  await initDatabase();
  const normalized = normalizeLifePersonalValue(value);
  execAll(
    `INSERT INTO life_personal_values (id, name, description, priority, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description,
       priority = excluded.priority, updatedAt = excluded.updatedAt;`,
    [normalized.id, normalized.name, normalized.description ?? null, normalized.priority, normalized.createdAt, normalized.updatedAt],
  );
  scheduleSave();
}

export async function deleteLifePersonalValueFromDB(id: string): Promise<void> {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Personal value ID must be a non-empty string.');
  await initDatabase();
  execAll('DELETE FROM life_personal_values WHERE id = ?;', [id]);
  scheduleSave();
}

function traitRow(row: Record<string, any>): PersonalityTrait {
  return {
    id: String(row.id),
    isBuiltIn: Boolean(row.isBuiltIn),
    isActive: Boolean(row.isActive),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export async function getPersonalityCharacterFromDB(): Promise<PersonalityCharacterSnapshot> {
  await initDatabase();
  return {
    traits: queryRows('SELECT * FROM life_personality_traits ORDER BY isBuiltIn DESC, createdAt ASC, id ASC;').map(traitRow),
    definitions: queryRows('SELECT * FROM life_trait_definition_revisions ORDER BY julianday(createdAt) ASC, id ASC;'),
    reflections: queryRows('SELECT * FROM life_trait_reflection_revisions ORDER BY julianday(createdAt) ASC, id ASC;')
      .map((row: Record<string, any>) => ({ ...row, importance: row.importance ?? undefined })),
    examples: queryRows('SELECT * FROM life_trait_examples ORDER BY julianday(occurredOn) ASC, julianday(recordedAt) ASC, id ASC;')
      .map((row: Record<string, any>) => ({ ...row, context: row.context ?? undefined })),
  };
}

export async function getPersonalityCharacterPreviewFromDB(): Promise<PersonalityCharacterSnapshot> {
  await initDatabase();
  return {
    traits: queryRows('SELECT * FROM life_personality_traits ORDER BY isBuiltIn DESC, createdAt ASC, id ASC;').map(traitRow),
    definitions: queryRows('SELECT * FROM life_trait_definition_revisions ORDER BY julianday(createdAt) ASC, id ASC;'),
    reflections: queryRows('SELECT * FROM life_trait_reflection_revisions ORDER BY julianday(createdAt) ASC, id ASC;')
      .map((row: Record<string, any>) => ({ ...row, importance: row.importance ?? undefined })),
    examples: [],
  };
}

export async function getCurrentTraitDefinitionFromDB(traitId: string): Promise<TraitDefinitionRevision | null> {
  await initDatabase();
  const row = queryRows(
    'SELECT * FROM life_trait_definition_revisions WHERE traitId = ? ORDER BY julianday(createdAt) DESC, id DESC LIMIT 1;',
    [traitId],
  )[0];
  return row ?? null;
}

export async function getCurrentTraitReflectionFromDB(traitId: string): Promise<TraitReflectionRevision | null> {
  await initDatabase();
  const row = queryRows(
    'SELECT * FROM life_trait_reflection_revisions WHERE traitId = ? ORDER BY julianday(createdAt) DESC, id DESC LIMIT 1;',
    [traitId],
  )[0];
  return row ? { ...row, importance: row.importance ?? undefined } : null;
}

export async function createCustomPersonalityTrait(
  trait: PersonalityTrait,
  definition: TraitDefinitionRevision,
): Promise<void> {
  await initDatabase();
  const traitId = typeof trait.id === 'string' ? trait.id.trim() : '';
  if (!traitId) throw new Error('Trait ID must be a non-empty string.');
  if (trait.isBuiltIn || traitId.startsWith('atlas.trait.')) {
    throw new Error('Built-in trait identifiers are reserved.');
  }
  const normalized = normalizeTraitDefinition(definition);
  if (normalized.traitId !== traitId) throw new Error('Trait definition must belong to the new trait.');
  if (trait.isBuiltIn !== false) throw new Error('Custom traits must not use a built-in identity.');
  if (trait.isActive !== true) throw new Error('A new custom trait must be active.');
  const createdAt = normalizeLifeTimestamp(trait.createdAt, 'Trait createdAt');
  const updatedAt = normalizeLifeTimestamp(trait.updatedAt, 'Trait updatedAt');
  db!.run('BEGIN;');
  try {
    execAll(
      'INSERT INTO life_personality_traits (id, isBuiltIn, isActive, createdAt, updatedAt) VALUES (?, 0, 1, ?, ?);',
      [traitId, createdAt, updatedAt],
    );
    execAll(
      `INSERT INTO life_trait_definition_revisions (id, traitId, name, definition, description, createdAt)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [normalized.id, normalized.traitId, normalized.name, normalized.definition, normalized.description ?? null, normalized.createdAt],
    );
    db!.run('COMMIT;');
  } catch (error) {
    db!.run('ROLLBACK;');
    throw error;
  }
  scheduleSave();
}

export async function addTraitDefinitionRevisionToDB(definition: TraitDefinitionRevision): Promise<void> {
  await initDatabase();
  const value = normalizeTraitDefinition(definition);
  const trait = queryRows('SELECT isBuiltIn, isActive FROM life_personality_traits WHERE id = ?;', [value.traitId])[0];
  if (!trait) throw new Error(`Personality trait ${value.traitId} does not exist.`);
  if (Boolean(trait.isBuiltIn)) throw new Error('Built-in trait definitions cannot be changed.');
  if (!Boolean(trait.isActive)) throw new Error('Reactivate this trait before editing its definition.');
  execAll(
    `INSERT INTO life_trait_definition_revisions (id, traitId, name, definition, description, createdAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [value.id, value.traitId, value.name, value.definition, value.description ?? null, value.createdAt],
  );
  scheduleSave();
}

export async function setCustomPersonalityTraitActive(id: string, isActive: boolean, updatedAt: string): Promise<void> {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Trait ID must be a non-empty string.');
  if (typeof isActive !== 'boolean') throw new Error('Trait active state must be boolean.');
  const timestamp = normalizeLifeTimestamp(updatedAt, 'Trait updatedAt');
  await initDatabase();
  const trait = queryRows('SELECT isBuiltIn FROM life_personality_traits WHERE id = ?;', [id])[0];
  if (!trait) throw new Error(`Personality trait ${id} does not exist.`);
  if (Boolean(trait.isBuiltIn)) throw new Error('Built-in traits cannot be deactivated.');
  execAll('UPDATE life_personality_traits SET isActive = ?, updatedAt = ? WHERE id = ?;', [isActive ? 1 : 0, timestamp, id]);
  scheduleSave();
}

export async function addTraitReflectionRevisionToDB(reflection: TraitReflectionRevision): Promise<void> {
  await initDatabase();
  const value = normalizeTraitReflection(reflection);
  const trait = queryRows('SELECT isActive FROM life_personality_traits WHERE id = ?;', [value.traitId])[0];
  if (!trait) throw new Error(`Personality trait ${value.traitId} does not exist.`);
  if (!Boolean(trait.isActive)) throw new Error('Reactivate this trait before adding a reflection.');
  const definition = queryRows(
    `SELECT id FROM life_trait_definition_revisions
     WHERE id = ? AND traitId = ?;`,
    [value.definitionRevisionId, value.traitId],
  )[0];
  if (!definition) throw new Error('Trait reflection must reference a definition revision for the same trait.');
  execAll(
    `INSERT INTO life_trait_reflection_revisions
     (id, traitId, definitionRevisionId, currentExpression, desiredExpression, personalMeaning, importance, developmentNotes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [value.id, value.traitId, value.definitionRevisionId, value.currentExpression ?? null, value.desiredExpression ?? null,
      value.personalMeaning ?? null, value.importance ?? null, value.developmentNotes ?? null, value.createdAt],
  );
  scheduleSave();
}

export async function saveTraitExampleToDB(example: TraitExample): Promise<void> {
  await initDatabase();
  const value = normalizeTraitExample(example);
  const trait = queryRows('SELECT isActive FROM life_personality_traits WHERE id = ?;', [value.traitId])[0];
  if (!trait) throw new Error(`Personality trait ${value.traitId} does not exist.`);
  if (!Boolean(trait.isActive)) throw new Error('Reactivate this trait before adding or correcting an example.');
  const existing = queryRows('SELECT traitId, recordedAt FROM life_trait_examples WHERE id = ?;', [value.id])[0];
  if (existing && existing.traitId !== value.traitId) throw new Error('An example cannot be moved to another trait.');
  if (existing && existing.recordedAt !== value.recordedAt) throw new Error('An example recording date cannot be changed.');
  if (existing) {
    execAll(
      `UPDATE life_trait_examples SET description = ?, occurredOn = ?, context = ?, updatedAt = ?
       WHERE id = ?;`,
      [value.description, value.occurredOn, value.context ?? null, value.updatedAt, value.id],
    );
  } else {
    execAll(
      `INSERT INTO life_trait_examples (id, traitId, description, occurredOn, recordedAt, context, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [value.id, value.traitId, value.description, value.occurredOn, value.recordedAt, value.context ?? null, value.updatedAt],
    );
  }
  scheduleSave();
}

export async function deleteTraitExampleFromDB(id: string): Promise<void> {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Example ID must be a non-empty string.');
  await initDatabase();
  execAll('DELETE FROM life_trait_examples WHERE id = ?;', [id]);
  scheduleSave();
}

export async function saveLifeAttributeDefinitionToDB(definition: AttributeDefinition): Promise<void> {
  await initDatabase();
  if (definition.isBuiltIn === true || (typeof definition.id === 'string' && definition.id.startsWith('atlas.builtin.'))) {
    throw new Error('Built-in attribute definitions are managed by the Life framework and cannot be changed.');
  }
  const existing = queryRows('SELECT * FROM life_attribute_definitions WHERE id = ?;', [definition.id])[0];
  if (existing?.isBuiltIn) {
    throw new Error('Built-in attribute definitions are managed by the Life framework and cannot be changed.');
  }
  const preservesLegacyMetadata = Boolean(existing) &&
    existing.kind === definition.kind &&
    existing.valueType === definition.valueType &&
    (existing.unit ?? null) === (definition.unit ?? null);
  const value = normalizeAttributeDefinition(definition, { allowUnchangedLegacyMetadata: preservesLegacyMetadata });
  const dimension = queryRows('SELECT isActive FROM life_dimensions WHERE id = ?;', [value.dimensionId])[0];
  if (!dimension) throw new Error(`Life dimension ${value.dimensionId} does not exist.`);
  const isDimensionChanging = existing && existing.dimensionId !== value.dimensionId;
  const isReactivating = existing && !Boolean(existing.isActive) && value.isActive;
  if ((!existing || isDimensionChanging || isReactivating) && value.isActive && !Boolean(dimension.isActive)) {
    throw new Error('Choose an active dimension before creating or reactivating an attribute.');
  }
  if (existing) {
    const metadataChanged =
      existing.dimensionId !== value.dimensionId ||
      existing.kind !== value.kind ||
      existing.valueType !== value.valueType ||
      (existing.unit ?? null) !== (value.unit ?? null) ||
      (existing.financialType ?? null) !== (value.financialType ?? null);
    if (metadataChanged) {
      const references = queryRows(
        `SELECT
          (SELECT COUNT(*) FROM life_attribute_entries WHERE attributeId = ?) +
          (SELECT COUNT(*) FROM life_ideal_target_revisions WHERE attributeId = ?) +
          (SELECT COUNT(*) FROM life_activity_attribute_links WHERE attributeId = ?) AS count;`,
        [value.id, value.id, value.id],
      )[0];
      if (Number(references?.count ?? 0) > 0) {
        throw new Error('Dimension, category, measurement type, and unit cannot change while this attribute has history or evidence. Create a new attribute and deactivate this one instead.');
      }
    }
  }
  execAll(
    `INSERT INTO life_attribute_definitions
     (id, dimensionId, name, description, kind, valueType, unit, priority, measurementFrequency, assessmentMethodology, measurementSource, isBuiltIn, isActive, createdAt, updatedAt, financialType)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET dimensionId = excluded.dimensionId, name = excluded.name,
       description = excluded.description, kind = excluded.kind, valueType = excluded.valueType, unit = excluded.unit,
       priority = excluded.priority, measurementFrequency = excluded.measurementFrequency,
       assessmentMethodology = excluded.assessmentMethodology, measurementSource = excluded.measurementSource,
       isBuiltIn = excluded.isBuiltIn, isActive = excluded.isActive, updatedAt = excluded.updatedAt,
       financialType = excluded.financialType;`,
    [value.id, value.dimensionId, value.name, value.description ?? null, value.kind, value.valueType, value.unit ?? null,
      value.priority, value.measurementFrequency ?? null, value.assessmentMethodology ?? null, value.measurementSource ?? null,
      value.isBuiltIn ? 1 : 0, value.isActive ? 1 : 0, value.createdAt, value.updatedAt, value.financialType ?? null],
  );
  scheduleSave();
}

export async function getLifeAttributeDefinitionsFromDB(): Promise<AttributeDefinition[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_attribute_definitions ORDER BY createdAt ASC;').map((row: any) => ({
    ...row, isBuiltIn: Boolean(row.isBuiltIn), isActive: Boolean(row.isActive),
    description: row.description ?? undefined, unit: row.unit ?? undefined,
    measurementFrequency: row.measurementFrequency ?? undefined,
    assessmentMethodology: row.assessmentMethodology ?? undefined, measurementSource: row.measurementSource ?? undefined,
    financialType: row.financialType ?? undefined,
  }));
}

export async function addLifeAttributeEntryToDB(entry: AttributeEntry): Promise<void> {
  await initDatabase();
  const definition = queryRows('SELECT valueType, financialType, isActive FROM life_attribute_definitions WHERE id = ?;', [entry.attributeId])[0];
  if (!definition) throw new Error(`Life attribute ${entry.attributeId} does not exist.`);
  if (!Boolean(definition.isActive)) throw new Error(`Life attribute ${entry.attributeId} is inactive.`);
  if (definition.valueType === 'milestone') {
    throw new Error('Life milestones are stored as separate achievements, not attribute entries.');
  }
  const value = normalizeAttributeEntry(entry, definition.valueType, { financialType: definition.financialType ?? undefined });
  if (!value.isValid) throw new Error('New Life entries must start as valid; use the invalidation process to correct an entry.');
  if (value.correctsEntryId || value.invalidatedAt || value.invalidationReason) {
    throw new Error('Correction and invalidation metadata can only be written through the audit operations.');
  }
  execAll(
    `INSERT INTO life_attribute_entries
     (id, attributeId, recordedAt, valueJson, source, note, isValid, createdAt, currency, scope, reportingPeriodStart, reportingPeriodEnd)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [value.id, value.attributeId, value.recordedAt, JSON.stringify(value.value), value.source ?? null, value.note ?? null,
      value.isValid ? 1 : 0, value.createdAt, value.currency ?? null, value.scope ?? null,
      value.reportingPeriodStart ?? null, value.reportingPeriodEnd ?? null],
  );
  scheduleSave();
}

export async function invalidateLifeAttributeEntryInDB(entryId: string, invalidatedAt: string, reason: string): Promise<void> {
  await initDatabase();
  const id = typeof entryId === 'string' ? entryId.trim() : '';
  if (!id) throw new Error('Entry ID must be a non-empty string.');
  const timestamp = normalizeLifeTimestamp(invalidatedAt, 'Entry invalidatedAt');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('An invalidation reason is required.');

  db!.run('BEGIN;');
  try {
    const entry = queryRows('SELECT isValid FROM life_attribute_entries WHERE id = ?;', [id])[0];
    if (!entry) throw new Error(`Life entry ${id} does not exist.`);
    if (!Boolean(entry.isValid)) throw new Error(`Life entry ${id} is already invalid.`);
    execAll(
      'UPDATE life_attribute_entries SET isValid = 0, invalidatedAt = ?, invalidationReason = ? WHERE id = ? AND isValid = 1;',
      [timestamp, reason.trim(), id],
    );
    db!.run('COMMIT;');
  } catch (error) {
    db!.run('ROLLBACK;');
    throw error;
  }
  scheduleSave();
}

export async function correctLifeAttributeEntryInDB(
  entryId: string,
  correction: AttributeEntry,
  reason: string,
): Promise<void> {
  await initDatabase();
  const originalId = typeof entryId === 'string' ? entryId.trim() : '';
  if (!originalId) throw new Error('Entry ID must be a non-empty string.');
  if (typeof reason !== 'string' || !reason.trim()) throw new Error('A correction reason is required.');
  const original = queryRows(
    `SELECT e.attributeId, e.isValid, d.valueType, d.financialType, d.isActive
     FROM life_attribute_entries e
     JOIN life_attribute_definitions d ON d.id = e.attributeId
     WHERE e.id = ?;`,
    [originalId],
  )[0];
  if (!original) throw new Error(`Life entry ${originalId} does not exist.`);
  if (!Boolean(original.isValid)) throw new Error(`Life entry ${originalId} is already invalid.`);
  if (!Boolean(original.isActive)) throw new Error(`Life attribute ${original.attributeId} is inactive.`);
  if (original.valueType === 'milestone') {
    throw new Error('Life milestones are stored as separate achievements, not attribute entries.');
  }
  if (correction.attributeId !== original.attributeId) {
    throw new Error('A correction must belong to the same attribute as the original entry.');
  }
  const value = normalizeAttributeEntry(correction, original.valueType, { financialType: original.financialType ?? undefined });
  if (!value.isValid || value.correctsEntryId || value.invalidatedAt || value.invalidationReason) {
    throw new Error('A corrected entry must be a new valid entry without existing audit metadata.');
  }
  const invalidatedAt = normalizeLifeTimestamp(new Date().toISOString(), 'Entry invalidatedAt');

  db!.run('BEGIN;');
  try {
    execAll(
      `INSERT INTO life_attribute_entries
       (id, attributeId, recordedAt, valueJson, source, note, isValid, createdAt, invalidatedAt, invalidationReason,
        correctsEntryId, currency, scope, reportingPeriodStart, reportingPeriodEnd)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, NULL, NULL, ?, ?, ?, ?, ?);`,
      [value.id, value.attributeId, value.recordedAt, JSON.stringify(value.value), value.source ?? null,
        value.note ?? null, value.createdAt, originalId, value.currency ?? null, value.scope ?? null,
        value.reportingPeriodStart ?? null, value.reportingPeriodEnd ?? null],
    );
    execAll(
      `UPDATE life_attribute_entries
       SET isValid = 0, invalidatedAt = ?, invalidationReason = ?
       WHERE id = ? AND isValid = 1;`,
      [invalidatedAt, reason.trim(), originalId],
    );
    db!.run('COMMIT;');
  } catch (error) {
    db!.run('ROLLBACK;');
    throw error;
  }
  scheduleSave();
}

export async function getLifeAttributeEntriesFromDB(attributeId: string): Promise<AttributeEntry[]> {
  await initDatabase();
  return queryRows(
    'SELECT * FROM life_attribute_entries WHERE attributeId = ? ORDER BY julianday(recordedAt) ASC, julianday(createdAt) ASC, id ASC;', [attributeId],
  ).map((row: any) => ({
    ...row,
    value: JSON.parse(row.valueJson),
    isValid: Boolean(row.isValid),
    invalidatedAt: row.invalidatedAt ?? undefined,
    invalidationReason: row.invalidationReason ?? undefined,
    correctsEntryId: row.correctsEntryId ?? undefined,
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  }));
}

export async function getCurrentLifeAttributeEntryFromDB(attributeId: string): Promise<AttributeEntry | null> {
  await initDatabase();
  const row = queryRows(
    `SELECT * FROM life_attribute_entries WHERE attributeId = ? AND isValid = 1
     ORDER BY julianday(recordedAt) DESC, julianday(createdAt) DESC, id DESC LIMIT 1;`, [attributeId],
  )[0];
  return row ? {
    ...row,
    value: JSON.parse(row.valueJson),
    isValid: Boolean(row.isValid),
    invalidatedAt: row.invalidatedAt ?? undefined,
    invalidationReason: row.invalidationReason ?? undefined,
    correctsEntryId: row.correctsEntryId ?? undefined,
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  } : null;
}

export async function addIdealTargetRevisionToDB(revision: IdealTargetRevision): Promise<void> {
  await initDatabase();
  const definition = queryRows('SELECT valueType, financialType, isActive FROM life_attribute_definitions WHERE id = ?;', [revision.attributeId])[0];
  if (!definition) throw new Error(`Life attribute ${revision.attributeId} does not exist.`);
  if (!Boolean(definition.isActive)) throw new Error(`Life attribute ${revision.attributeId} is inactive.`);
  const value = normalizeIdealTargetRevision(revision, definition.valueType, {
    financialType: definition.financialType ?? undefined,
  });
  execAll(
    `INSERT INTO life_ideal_target_revisions
     (id, attributeId, targetValueJson, narrative, reason, successDefinition, priority, createdAt, supersededAt,
      currency, scope, reportingPeriodStart, reportingPeriodEnd)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?);`,
    [value.id, value.attributeId, value.targetValue === undefined ? null : JSON.stringify(value.targetValue), value.narrative ?? null,
      value.reason ?? null, value.successDefinition ?? null, value.priority, value.createdAt,
      value.currency ?? null, value.scope ?? null, value.reportingPeriodStart ?? null, value.reportingPeriodEnd ?? null],
  );
  scheduleSave();
}

export async function getIdealTargetRevisionsFromDB(attributeId: string): Promise<IdealTargetRevision[]> {
  await initDatabase();
  return queryRows(
    'SELECT * FROM life_ideal_target_revisions WHERE attributeId = ? ORDER BY julianday(createdAt) ASC, id ASC;', [attributeId],
  ).map((row: any) => ({
    ...row,
    targetValue: parseOptionalJson(row.targetValueJson),
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  }));
}

export async function getCurrentIdealTargetRevisionFromDB(attributeId: string): Promise<IdealTargetRevision | null> {
  await initDatabase();
  const row = queryRows(
    'SELECT * FROM life_ideal_target_revisions WHERE attributeId = ? ORDER BY julianday(createdAt) DESC, id DESC LIMIT 1;', [attributeId],
  )[0];
  return row ? {
    ...row,
    targetValue: parseOptionalJson(row.targetValueJson),
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  } : null;
}

export async function getLifeDashboardAttributeStateFromDB(): Promise<{
  entries: AttributeEntry[];
  targets: IdealTargetRevision[];
}> {
  await initDatabase();
  const entries = queryRows(
    `SELECT entry.*
     FROM life_attribute_entries entry
     WHERE entry.isValid = 1
       AND entry.id = (
         SELECT candidate.id
         FROM life_attribute_entries candidate
         WHERE candidate.attributeId = entry.attributeId AND candidate.isValid = 1
         ORDER BY julianday(candidate.recordedAt) DESC, julianday(candidate.createdAt) DESC, candidate.id DESC
         LIMIT 1
       );`,
  ).map((row: any) => ({
    ...row,
    value: JSON.parse(row.valueJson),
    isValid: Boolean(row.isValid),
    invalidatedAt: row.invalidatedAt ?? undefined,
    invalidationReason: row.invalidationReason ?? undefined,
    correctsEntryId: row.correctsEntryId ?? undefined,
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  }));
  const targets = queryRows(
    `SELECT target.*
     FROM life_ideal_target_revisions target
     WHERE target.id = (
       SELECT candidate.id
       FROM life_ideal_target_revisions candidate
       WHERE candidate.attributeId = target.attributeId
       ORDER BY julianday(candidate.createdAt) DESC, candidate.id DESC
       LIMIT 1
     );`,
  ).map((row: any) => ({
    ...row,
    targetValue: parseOptionalJson(row.targetValueJson),
    currency: row.currency ?? undefined,
    scope: row.scope ?? undefined,
    reportingPeriodStart: row.reportingPeriodStart ?? undefined,
    reportingPeriodEnd: row.reportingPeriodEnd ?? undefined,
  }));
  return { entries, targets };
}

export async function saveLifeActivityAttributeLinkToDB(link: ActivityAttributeLink): Promise<void> {
  await initDatabase();
  const value = normalizeActivityAttributeLink(link);
  const definition = queryRows('SELECT isActive FROM life_attribute_definitions WHERE id = ?;', [value.attributeId])[0];
  if (!definition) throw new Error(`Life attribute ${value.attributeId} does not exist.`);
  if (!Boolean(definition.isActive)) throw new Error(`Life attribute ${value.attributeId} is inactive.`);
  const sourceTables: Record<string, { table: string; idColumn: string }> = {
    focus_items: { table: 'focus_items', idColumn: 'id' },
    health_state: { table: 'health_state', idColumn: 'id' },
    journal_entries: { table: 'journal_entries', idColumn: 'id' },
    streak_habits: { table: 'streak_habits', idColumn: 'id' },
    savings_entries: { table: 'savings_entries', idColumn: 'id' },
    goals: { table: 'goals', idColumn: 'id' },
    goal_milestones: { table: 'goal_milestones', idColumn: 'id' },
    notes: { table: 'notes', idColumn: 'id' },
    check_ins: { table: 'check_ins', idColumn: 'id' },
    xp_events: { table: 'xp_events', idColumn: 'id' },
    visit_days: { table: 'visit_days', idColumn: 'date' },
    life_milestones: { table: 'life_milestones', idColumn: 'id' },
  };
  const source = sourceTables[value.activitySource];
  if (!source) throw new Error(`Unsupported Life activity source: ${value.activitySource}.`);
  if (queryRows(`SELECT 1 FROM ${source.table} WHERE ${source.idColumn} = ? LIMIT 1;`, [value.activityId]).length === 0) {
    throw new Error(`Activity ${value.activitySource}/${value.activityId} does not exist.`);
  }
  execAll(
    `INSERT INTO life_activity_attribute_links (id, attributeId, activitySource, activityId, relationshipNote, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET attributeId = excluded.attributeId, activitySource = excluded.activitySource,
       activityId = excluded.activityId, relationshipNote = excluded.relationshipNote;`,
    [value.id, value.attributeId, value.activitySource, value.activityId, value.relationshipNote ?? null, value.createdAt],
  );
  scheduleSave();
}

export async function getLifeActivityAttributeLinksFromDB(attributeId: string): Promise<ActivityAttributeLink[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_activity_attribute_links WHERE attributeId = ? ORDER BY createdAt ASC;', [attributeId]);
}

export async function saveLifeMilestoneToDB(milestone: LifeMilestone): Promise<void> {
  await initDatabase();
  const value = normalizeLifeMilestone(milestone);
  execAll(
    `INSERT INTO life_milestones (id, title, description, achievedAt, evidence, reflection, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description,
       achievedAt = excluded.achievedAt, evidence = excluded.evidence, reflection = excluded.reflection;`,
    [value.id, value.title, value.description ?? null, value.achievedAt ?? null, value.evidence ?? null, value.reflection ?? null, value.createdAt],
  );
  scheduleSave();
}

export async function getLifeMilestonesFromDB(): Promise<LifeMilestone[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_milestones ORDER BY createdAt ASC;');
}

export async function saveLifeReflectionToDB(reflection: LifeReflection): Promise<void> {
  await initDatabase();
  const value = normalizeLifeReflection(reflection);
  execAll(
    `INSERT INTO life_reflections (id, periodType, periodStart, periodEnd, content, createdAt, modifiedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET periodType = excluded.periodType, periodStart = excluded.periodStart,
       periodEnd = excluded.periodEnd, content = excluded.content, modifiedAt = excluded.modifiedAt;`,
    [value.id, value.periodType, value.periodStart, value.periodEnd ?? null, value.content, value.createdAt, value.modifiedAt],
  );
  scheduleSave();
}

export async function getLifeReflectionsFromDB(): Promise<LifeReflection[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_reflections ORDER BY periodStart DESC, createdAt DESC, id DESC;')
    .map((row: any) => ({ ...row, modifiedAt: row.modifiedAt ?? row.createdAt }));
}

export async function deleteLifeReflectionFromDB(id: string): Promise<void> {
  const reflectionId = typeof id === 'string' ? id.trim() : '';
  if (!reflectionId) throw new Error('Reflection ID must be a non-empty string.');
  await initDatabase();
  execAll('DELETE FROM life_reflections WHERE id = ?;', [reflectionId]);
  scheduleSave();
}

export async function saveLifeEventToDB(event: LifeEvent): Promise<void> {
  await initDatabase();
  const value = normalizeLifeEvent(event);
  execAll(
    `INSERT INTO life_events (id, eventType, title, description, occurredAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET eventType = excluded.eventType, title = excluded.title,
       description = excluded.description, occurredAt = excluded.occurredAt;`,
    [value.id, value.eventType, value.title, value.description ?? null, value.occurredAt, value.createdAt],
  );
  scheduleSave();
}

export async function getLifeEventsFromDB(): Promise<LifeEvent[]> {
  await initDatabase();
  return queryRows('SELECT * FROM life_events ORDER BY occurredAt ASC, createdAt ASC;');
}

/** Clears user-created Life records while preserving the application-owned dimension framework. */
export async function clearLifeData(): Promise<void> {
  await initDatabase();
  db.run('BEGIN;');
  try {
    execAll('UPDATE life_trait_history_guard SET allowDelete = 1 WHERE id = 1;');
    execAll('DELETE FROM life_trait_examples;');
    execAll('DELETE FROM life_trait_reflection_revisions;');
    execAll('DELETE FROM life_trait_definition_revisions WHERE traitId IN (SELECT id FROM life_personality_traits WHERE isBuiltIn = 0);');
    execAll('DELETE FROM life_personality_traits WHERE isBuiltIn = 0;');
    execAll('UPDATE life_trait_history_guard SET allowDelete = 0 WHERE id = 1;');
    execAll('DELETE FROM life_activity_attribute_links;');
    execAll('DELETE FROM life_ideal_target_revisions;');
    execAll('DELETE FROM life_attribute_entries;');
    execAll('DELETE FROM life_attribute_definitions WHERE isBuiltIn = 0;');
    execAll('DELETE FROM life_milestones;');
    execAll('DELETE FROM life_reflections;');
    execAll('DELETE FROM life_events;');
    execAll('DELETE FROM life_ideal_self_revisions;');
    execAll('DELETE FROM life_personal_values;');
    execAll('DELETE FROM life_current_self;');
    execAll('DELETE FROM life_profiles;');
    execAll('DELETE FROM life_dimensions WHERE isBuiltIn = 0;');
    db.run('COMMIT;');
  } catch (error) {
    db.run('ROLLBACK;');
    throw error;
  }
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
  await flushDatabaseSave();
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const previousDatabase = db;
  const wasInitialized = initialized;
  const importedDatabase = new SQL.Database(bytes);

  db = importedDatabase;
  try {
    ensureSchema();
    if (getTableColumns('life_trait_history_guard').includes('allowDelete')) {
      execAll('UPDATE life_trait_history_guard SET allowDelete = 0 WHERE id = 1;');
    }
    const violations = queryRows('PRAGMA foreign_key_check;');
    if (violations.length > 0) {
      const firstViolation = violations[0];
      throw new Error(
        `Backup contains an invalid foreign key in ${firstViolation.table} (row ${firstViolation.rowid}, parent ${firstViolation.parent}).`,
      );
    }
    await saveImmediate();
    initialized = true;
    if (previousDatabase && previousDatabase !== importedDatabase) previousDatabase.close();
  } catch (error) {
    db = previousDatabase;
    initialized = wasInitialized;
    importedDatabase.close();
    throw error;
  }
}
