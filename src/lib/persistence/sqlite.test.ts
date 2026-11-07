import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import { createBuiltInLifeDimensions } from '../../features/life/domain/dimensions';
import { builtInLifeAttributes } from '../../features/life/domain/builtInAttributes';
import { builtInPersonalityTraits } from '../../features/life/domain/personalityTraits';

const persistedValues = new Map<string, Uint8Array>();
const { sqlWasmPath, failNextPersist } = vi.hoisted(() => ({
  sqlWasmPath: new URL('../../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  failNextPersist: { value: false },
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => persistedValues.get(key)),
  set: vi.fn(async (key: string, value: Uint8Array) => {
    if (failNextPersist.value) {
      failNextPersist.value = false;
      throw new Error('Simulated IndexedDB write failure');
    }
    persistedValues.set(key, value);
  }),
}));

vi.mock('sql.js/dist/sql-wasm.wasm?url', () => ({
  default: sqlWasmPath,
}));

import {
  exportDatabase,
  getHealthSnapshotFromDB,
  recordHealthMetricInDB,
  addJournalEntryToDB,
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
  addIdealTargetRevisionToDB,
  addLifeAttributeEntryToDB,
  correctLifeAttributeEntryInDB,
  getCurrentLifeAttributeEntryFromDB,
  getLifeAttributeEntriesFromDB,
  getIdealTargetRevisionsFromDB,
  getLifeDimensionsFromDB,
  getLifeAttributeDefinitionsFromDB,
  getLifeSchemaVersion,
  saveLifeAttributeDefinitionToDB,
  saveLifeProfileToDB,
  getLifeProfileFromDB,
  getLifeActivityAttributeLinksFromDB,
  getLifeEventsFromDB,
  getLifeMilestonesFromDB,
  getLifeReflectionsFromDB,
  saveLifeActivityAttributeLinkToDB,
  saveLifeEventToDB,
  saveLifeMilestoneToDB,
  saveLifeReflectionToDB,
  saveLifeDimensionToDB,
  clearLifeData,
  invalidateLifeAttributeEntryInDB,
  flushDatabaseSave,
  getCurrentIdealTargetRevisionFromDB,
  getLifeDashboardAttributeStateFromDB,
  getJournalDashboardSummaryFromDB,
  getPersonalityCharacterPreviewFromDB,
  addLifeIdealSelfRevisionToDB,
  deleteLifePersonalValueFromDB,
  getCurrentLifeIdealSelfFromDB,
  getLifeCurrentSelfFromDB,
  getLifeIdealSelfRevisionsFromDB,
  getLifePersonalValuesFromDB,
  addTraitDefinitionRevisionToDB,
  addTraitReflectionRevisionToDB,
  createCustomPersonalityTrait,
  deleteTraitExampleFromDB,
  getCurrentTraitDefinitionFromDB,
  getCurrentTraitReflectionFromDB,
  getPersonalityCharacterFromDB,
  saveTraitExampleToDB,
  setCustomPersonalityTraitActive,
  saveLifeCurrentSelfToDB,
  saveLifePersonalValueToDB,
  clearHealthSnapshot,
  clearJournalEntries,
  replaceSavingsEntriesInDB,
} from './sqlite';
import { loadLifeDashboardSnapshot } from '../../features/life/persistence/lifeRepository';

describe('SQLite persistence', () => {
  beforeAll(() => {
    vi.stubGlobal('window', globalThis);
  });

  beforeEach(async () => {
    await clearLifeData();
    await clearHealthSnapshot();
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

  it('adds the versioned Life schema without changing existing records', async () => {
    await replaceGoalsInDB([{ id: 'compat-goal', title: 'Existing data', completed: false, createdAt: '2026-11-01T00:00:00.000Z' }]);

    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    await expect(getLifeDimensionsFromDB()).resolves.toHaveLength(20);
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toHaveLength(builtInLifeAttributes.length);
    await expect(getGoalsFromDB()).resolves.toEqual([{ id: 'compat-goal', title: 'Existing data', note: undefined, completed: false, createdAt: '2026-11-01T00:00:00.000Z' }]);
  });

  it('seeds the built-in attribute catalogue idempotently and protects framework definitions', async () => {
    const firstSeed = (await getLifeAttributeDefinitionsFromDB()).filter((attribute) => attribute.isBuiltIn);
    expect(firstSeed).toHaveLength(builtInLifeAttributes.length);

    const backup = await exportDatabase();
    await importDatabase(backup);
    const repeatedSeed = (await getLifeAttributeDefinitionsFromDB()).filter((attribute) => attribute.isBuiltIn);
    expect(repeatedSeed).toHaveLength(builtInLifeAttributes.length);
    expect(repeatedSeed.map(({ id }) => id).sort()).toEqual(firstSeed.map(({ id }) => id).sort());

    const firstBuiltIn = repeatedSeed[0];
    await expect(saveLifeAttributeDefinitionToDB({ ...firstBuiltIn, name: 'Changed by user' })).rejects.toThrow(/Built-in attribute/);
    const firstDimension = (await getLifeDimensionsFromDB()).find((dimension) => dimension.isBuiltIn);
    expect(firstDimension).toBeDefined();
    if (firstDimension) {
      await expect(saveLifeDimensionToDB({ ...firstDimension, name: 'Changed by user' })).rejects.toThrow(/Built-in dimension/);
    }

    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const database = new SQL.Database(await exportDatabase());
    expect(() => database.run('DELETE FROM life_attribute_definitions WHERE id = ?;', [firstBuiltIn.id])).toThrow(/cannot be deleted/);
    expect(() => database.run('UPDATE life_dimensions SET name = ? WHERE id = ?;', ['Changed', 'physical-health'])).toThrow(/cannot be changed/);
    database.close();
  });

  it('stores scoped financial observations and matching Ideal Self targets without deriving totals', async () => {
    const definitions = await getLifeAttributeDefinitionsFromDB();
    const income = definitions.find(({ financialType }) => financialType === 'income');
    const netWorth = definitions.find(({ financialType }) => financialType === 'net-worth');
    expect(income).toBeDefined();
    expect(netWorth).toBeDefined();
    if (!income || !netWorth) throw new Error('Built-in financial attributes were not seeded.');

    await expect(addLifeAttributeEntryToDB({
      id: 'income-missing-scope', attributeId: income.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 5000, isValid: true, createdAt: '2026-11-02T00:00:00Z', currency: 'USD',
    })).rejects.toThrow(/scope/);
    await addLifeAttributeEntryToDB({
      id: 'income-recorded', attributeId: income.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 5000, isValid: true, createdAt: '2026-11-03T00:00:00Z',
      currency: 'USD', scope: 'gross salary', reportingPeriodStart: '2026-10-01', reportingPeriodEnd: '2026-10-31',
    });
    await addLifeAttributeEntryToDB({
      id: 'net-worth-recorded', attributeId: netWorth.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 25000, isValid: true, createdAt: '2026-11-03T00:00:00Z', currency: 'EUR',
    });
    await expect(getCurrentLifeAttributeEntryFromDB(income.id)).resolves.toMatchObject({
      id: 'income-recorded', value: 5000, currency: 'USD', scope: 'gross salary',
      reportingPeriodStart: '2026-10-01', reportingPeriodEnd: '2026-10-31',
    });

    await expect(addIdealTargetRevisionToDB({
      id: 'income-target-missing-scope', attributeId: income.id, targetValue: 6000, priority: 'medium',
      createdAt: '2026-11-04T00:00:00Z', currency: 'USD',
    })).rejects.toThrow(/scope/);
    await addIdealTargetRevisionToDB({
      id: 'income-target', attributeId: income.id, targetValue: 6000, priority: 'medium',
      createdAt: '2026-11-04T00:00:00Z', currency: 'USD', scope: 'gross salary',
      reportingPeriodStart: '2026-11-01', reportingPeriodEnd: '2026-11-30',
    });
    await expect(getCurrentIdealTargetRevisionFromDB(income.id)).resolves.toMatchObject({
      id: 'income-target', targetValue: 6000, currency: 'USD', scope: 'gross salary',
      reportingPeriodStart: '2026-11-01', reportingPeriodEnd: '2026-11-30',
    });

    const backup = await exportDatabase();
    await clearLifeData();
    await importDatabase(backup);
    await expect(getCurrentLifeAttributeEntryFromDB(income.id)).resolves.toMatchObject({
      id: 'income-recorded', currency: 'USD', scope: 'gross salary',
    });
    await expect(getCurrentIdealTargetRevisionFromDB(income.id)).resolves.toMatchObject({
      id: 'income-target', currency: 'USD', reportingPeriodEnd: '2026-11-30',
    });
    await expect(getCurrentLifeAttributeEntryFromDB(netWorth.id)).resolves.toMatchObject({
      id: 'net-worth-recorded', currency: 'EUR',
    });
  });

  it('records Health metric history independently without assigning dates to migrated baselines', async () => {
    await recordHealthMetricInDB('weight', 70, '2026-11-01T10:00:00Z');
    await recordHealthMetricInDB('sleep', 7.5, '2026-11-02T08:00:00Z');
    await recordHealthMetricInDB('weight', 69.5, '2026-11-03T10:00:00Z');

    await expect(getHealthSnapshotFromDB()).resolves.toMatchObject({
      health: { weight: 69.5, water: null, sleep: 7.5, workout: null },
      metrics: {
        weight: [
          expect.objectContaining({ value: 69.5, observedAt: '2026-11-03T10:00:00.000Z', origin: 'user' }),
          expect.objectContaining({ value: 70, observedAt: '2026-11-01T10:00:00.000Z', origin: 'user' }),
        ],
        sleep: [expect.objectContaining({ value: 7.5, observedAt: '2026-11-02T08:00:00.000Z', origin: 'user' })],
      },
    });
  });

  it('supports user-authored periodic reviews while preserving creation dates on edits', async () => {
    const reviews = [
        { id: 'review-weekly', periodType: 'weekly' as const, periodStart: '2026-11-02', periodEnd: '2026-11-08', content: 'A week in my own words.', createdAt: '2026-11-09T00:00:00Z' },
        { id: 'review-monthly', periodType: 'monthly' as const, periodStart: '2026-10-01', periodEnd: '2026-10-31', content: 'An October reflection.', createdAt: '2026-11-01T00:00:00Z' },
        { id: 'review-annual', periodType: 'annual' as const, periodStart: '2026-01-01', periodEnd: '2026-12-31', content: 'A year of change.', createdAt: '2026-12-31T00:00:00Z' },
        { id: 'review-multi-year', periodType: 'multi-year' as const, periodStart: '2024-01-01', periodEnd: '2026-12-31', content: 'Several years of learning.', createdAt: '2026-12-31T00:00:00Z' },
      ];
    for (const review of reviews) await saveLifeReflectionToDB(review);
    await expect(saveLifeReflectionToDB({
        ...reviews[3], periodEnd: '2025-12-31',
      })).rejects.toThrow(/at least two calendar years/);

    await saveLifeReflectionToDB({
        ...reviews[0], content: 'Edited without replacing the original creation date.',
        modifiedAt: '2026-11-10T00:00:00Z',
      });
    await expect(getLifeReflectionsFromDB()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'review-weekly', content: 'Edited without replacing the original creation date.',
          createdAt: '2026-11-09T00:00:00.000Z', modifiedAt: '2026-11-10T00:00:00.000Z',
        }),
        expect.objectContaining({ id: 'review-monthly', periodType: 'monthly' }),
        expect.objectContaining({ id: 'review-annual', periodType: 'annual' }),
        expect.objectContaining({ id: 'review-multi-year', periodType: 'multi-year' }),
    ]));
  });

  it('migrates populated version 5 data to the version 6 trait framework idempotently', async () => {
    await saveLifeProfileToDB({ id: 'current', name: 'Keep this profile', updatedAt: '2026-11-01T00:00:00Z' });
    await saveLifeAttributeDefinitionToDB({
      id: 'legacy-v5-attribute', dimensionId: 'physical-health', name: 'Existing attribute',
      kind: 'capability', valueType: 'narrative', priority: 'medium', isBuiltIn: false, isActive: true,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'legacy-v5-entry', attributeId: 'legacy-v5-attribute', recordedAt: '2026-11-02T00:00:00Z',
      value: 'Existing entry.', isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const versionFive = new SQL.Database(await exportDatabase());
    versionFive.run(`
      DROP TRIGGER life_trait_builtin_identity_update_guard;
      DROP TRIGGER life_trait_builtin_identity_delete_guard;
      DROP TRIGGER life_trait_definition_immutable_update;
      DROP TRIGGER life_trait_definition_immutable_delete;
      DROP TRIGGER life_trait_reflection_immutable_update;
      DROP TRIGGER life_trait_reflection_immutable_delete;
      DROP TABLE life_trait_examples;
      DROP TABLE life_trait_reflection_revisions;
      DROP TABLE life_trait_definition_revisions;
      DROP TABLE life_trait_history_guard;
      DROP TABLE life_personality_traits;
      DELETE FROM life_schema_migrations WHERE version = 6;
    `);
    const versionFiveBackup = versionFive.export();
    versionFive.close();

    await importDatabase(versionFiveBackup);
    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({ name: 'Keep this profile' });
    await expect(getLifeAttributeEntriesFromDB('legacy-v5-attribute')).resolves.toEqual([
      expect.objectContaining({ id: 'legacy-v5-entry', value: 'Existing entry.' }),
    ]);
    let traits = await getPersonalityCharacterFromDB();
    expect(traits.traits.filter(({ isBuiltIn }) => isBuiltIn)).toHaveLength(19);
    expect(traits.definitions.filter(({ traitId }) => traitId.startsWith('atlas.trait.'))).toHaveLength(19);

    const migratedBackup = await exportDatabase();
    await importDatabase(migratedBackup);
    traits = await getPersonalityCharacterFromDB();
    expect(traits.traits.filter(({ isBuiltIn }) => isBuiltIn)).toHaveLength(builtInPersonalityTraits.length);
    expect(traits.definitions.filter(({ traitId }) => traitId.startsWith('atlas.trait.'))).toHaveLength(builtInPersonalityTraits.length);
  });

  it('rolls back an interrupted version 6 migration and retries it cleanly', async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const versionFive = new SQL.Database(await exportDatabase());
    versionFive.run(`
      DROP TRIGGER life_trait_builtin_identity_update_guard;
      DROP TRIGGER life_trait_builtin_identity_delete_guard;
      DROP TRIGGER life_trait_definition_immutable_update;
      DROP TRIGGER life_trait_definition_immutable_delete;
      DROP TRIGGER life_trait_reflection_immutable_update;
      DROP TRIGGER life_trait_reflection_immutable_delete;
      DROP TABLE life_trait_examples;
      DROP TABLE life_trait_reflection_revisions;
      DROP TABLE life_trait_definition_revisions;
      DROP TABLE life_trait_history_guard;
      DROP TABLE life_personality_traits;
      DELETE FROM life_schema_migrations WHERE version = 6;
      CREATE TABLE life_personality_traits (
        id TEXT PRIMARY KEY, isBuiltIn INTEGER NOT NULL, isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );
      CREATE TRIGGER interrupt_trait_seed BEFORE INSERT ON life_personality_traits
      BEGIN SELECT RAISE(ABORT, 'simulated migration interruption'); END;
    `);
    const blockedBackup = versionFive.export();

    await expect(importDatabase(blockedBackup)).rejects.toThrow(/simulated migration interruption/);
    await expect(getLifeSchemaVersion()).resolves.toBe(7);

    versionFive.run('DROP TRIGGER interrupt_trait_seed;');
    await importDatabase(versionFive.export());
    versionFive.close();
    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: 'atlas.trait.integrity', isBuiltIn: true })]),
    });
  });

  it('upgrades populated version 6 Life data with the additive version 7 migration', async () => {
    await saveLifeProfileToDB({ id: 'current', name: 'Version six data', updatedAt: '2026-11-01T00:00:00Z' });
    await saveLifeReflectionToDB({
        id: 'version-six-review', periodType: 'monthly', periodStart: '2026-10-01',
        periodEnd: '2026-10-31', content: 'Preserve this reflection.', createdAt: '2026-11-01T00:00:00Z',
      });
      await replaceHealthSnapshotInDB({ weight: 72, water: 3, sleep: 7, workout: 20 }, 'legacy snapshot');

    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const versionSix = new SQL.Database(await exportDatabase());
    versionSix.run(`
        DROP TRIGGER life_builtin_attribute_update_guard;
        DROP TRIGGER life_builtin_attribute_delete_guard;
        DROP TRIGGER life_builtin_attribute_insert_guard;
        DROP TRIGGER life_attribute_metadata_insert_guard;
        DROP TRIGGER life_attribute_metadata_update_guard;
        DROP TRIGGER life_attribute_entry_values_update;
        DROP TRIGGER life_financial_entry_insert_guard;
        DROP TRIGGER life_financial_entry_update_guard;
        DROP TRIGGER life_financial_target_insert_guard;
        DROP TRIGGER life_reflection_period_insert;
        DROP TRIGGER life_reflection_period_update;
        DELETE FROM life_attribute_definitions
          WHERE id IN ('atlas.builtin.wealth-reported-net-worth', 'atlas.builtin.wealth-reported-income');
        DROP TABLE health_metric_entries;
        ALTER TABLE life_attribute_definitions DROP COLUMN financialType;
        ALTER TABLE life_attribute_entries DROP COLUMN currency;
        ALTER TABLE life_attribute_entries DROP COLUMN scope;
        ALTER TABLE life_attribute_entries DROP COLUMN reportingPeriodStart;
        ALTER TABLE life_attribute_entries DROP COLUMN reportingPeriodEnd;
        ALTER TABLE life_ideal_target_revisions DROP COLUMN currency;
        ALTER TABLE life_ideal_target_revisions DROP COLUMN scope;
        ALTER TABLE life_ideal_target_revisions DROP COLUMN reportingPeriodStart;
        ALTER TABLE life_ideal_target_revisions DROP COLUMN reportingPeriodEnd;
        ALTER TABLE life_reflections DROP COLUMN modifiedAt;
        DELETE FROM life_schema_migrations WHERE version = 7;
        CREATE TRIGGER interrupt_v7_attribute_seed BEFORE INSERT ON life_attribute_definitions
        WHEN NEW.id = 'atlas.builtin.wealth-reported-income'
        BEGIN SELECT RAISE(ABORT, 'simulated version 7 interruption'); END;
    `);

    await expect(importDatabase(versionSix.export())).rejects.toThrow(/simulated version 7 interruption/);
    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    versionSix.run('DROP TRIGGER interrupt_v7_attribute_seed;');
    await importDatabase(versionSix.export());
    versionSix.close();

    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({ name: 'Version six data' });
    await expect(getLifeReflectionsFromDB()).resolves.toEqual([
        expect.objectContaining({
          id: 'version-six-review',
          createdAt: '2026-11-01T00:00:00.000Z',
          modifiedAt: '2026-11-01T00:00:00.000Z',
        }),
    ]);
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'atlas.builtin.wealth-reported-income', financialType: 'income' }),
        expect.objectContaining({ id: 'atlas.builtin.wealth-reported-net-worth', financialType: 'net-worth' }),
    ]));
    await expect(getHealthSnapshotFromDB()).resolves.toMatchObject({
        health: { weight: 72, water: 3, sleep: 7, workout: 20 },
        metrics: {
          weight: [expect.objectContaining({ value: 72, observedAt: null, origin: 'legacy-baseline' })],
        },
    });
  });

  it('seeds optional built-in traits idempotently and protects their identities and definitions', async () => {
    const first = await getPersonalityCharacterFromDB();
    expect(builtInPersonalityTraits).toHaveLength(19);
    expect(first.traits.filter((trait) => trait.isBuiltIn)).toHaveLength(19);
    expect(first.definitions.filter(({ traitId }) => traitId.startsWith('atlas.trait.'))).toHaveLength(19);
    expect(first.traits.every((trait) => trait.isActive)).toBe(true);

    const databaseBackup = await exportDatabase();
    await importDatabase(databaseBackup);
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: 'atlas.trait.integrity', isBuiltIn: true })]),
    });
    await expect(setCustomPersonalityTraitActive('atlas.trait.integrity', false, '2026-11-02T00:00:00Z'))
      .rejects.toThrow(/Built-in traits/);
    await expect(addTraitDefinitionRevisionToDB({
      id: 'illegal-integrity-definition', traitId: 'atlas.trait.integrity', name: 'Other',
      definition: 'A replacement.', createdAt: '2026-11-02T00:00:00Z',
    })).rejects.toThrow(/Built-in trait/);

    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const database = new SQL.Database(await exportDatabase());
    expect(() => database.run("UPDATE life_trait_definition_revisions SET name = 'Changed' WHERE traitId = 'atlas.trait.integrity';"))
      .toThrow(/immutable/);
    expect(() => database.run("DELETE FROM life_personality_traits WHERE id = 'atlas.trait.integrity';"))
      .toThrow(/cannot be deleted/);
    expect(() => database.run("DELETE FROM life_trait_definition_revisions WHERE traitId = 'atlas.trait.integrity';"))
      .toThrow(/immutable/);
    database.close();
  });

  it('preserves custom trait definitions and reflections as append-only revisions', async () => {
    const traitId = 'custom-trait-care';
    await createCustomPersonalityTrait(
      { id: traitId, isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
      { id: 'care-definition-a', traitId, name: 'Care', definition: 'A first meaning.', createdAt: '2026-11-01T00:00:00Z' },
    );
    await addTraitDefinitionRevisionToDB({
      id: 'care-definition-z', traitId, name: 'Care', definition: 'A revised meaning.',
      description: 'Personal definition.', createdAt: '2026-11-02T00:00:00Z',
    });
    await addTraitDefinitionRevisionToDB({
      id: 'care-definition-b', traitId, name: 'Care', definition: 'A tied revision.',
      createdAt: '2026-11-02T00:00:00Z',
    });
    await expect(getCurrentTraitDefinitionFromDB(traitId)).resolves.toMatchObject({ id: 'care-definition-z' });

    await addTraitReflectionRevisionToDB({
      id: 'care-reflection-a', traitId, definitionRevisionId: 'care-definition-z',
      currentExpression: 'I listen carefully.', importance: 'medium', createdAt: '2026-11-03T00:00:00Z',
    });
    await addTraitReflectionRevisionToDB({
      id: 'care-reflection-z', traitId, definitionRevisionId: 'care-definition-z',
      desiredExpression: 'Offer support without assuming what is needed.', importance: 'high',
      createdAt: '2026-11-04T00:00:00Z',
    });
    await addTraitReflectionRevisionToDB({
      id: 'care-reflection-b', traitId, definitionRevisionId: 'care-definition-z',
      personalMeaning: 'A tied reflection.', createdAt: '2026-11-04T00:00:00Z',
    });

    await expect(getCurrentTraitReflectionFromDB(traitId)).resolves.toMatchObject({ id: 'care-reflection-z' });
    const snapshot = await getPersonalityCharacterFromDB();
    expect(snapshot.definitions.filter(({ traitId: id }) => id === traitId)).toHaveLength(3);
    expect(snapshot.reflections.filter(({ traitId: id }) => id === traitId)).toHaveLength(3);

    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const database = new SQL.Database(await exportDatabase());
    expect(() => database.run("UPDATE life_trait_reflection_revisions SET personalMeaning = 'rewritten' WHERE id = 'care-reflection-a';"))
      .toThrow(/immutable/);
    expect(() => database.run("DELETE FROM life_trait_reflection_revisions WHERE id = 'care-reflection-a';"))
      .toThrow(/immutable/);
    database.close();
  });

  it('validates trait records, supports example correction/removal, and preserves example recording dates', async () => {
    const traitId = 'custom-trait-accountability';
    await createCustomPersonalityTrait(
      { id: traitId, isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
      { id: 'accountability-definition', traitId, name: 'Repair', definition: 'Taking responsibility and making repair.', createdAt: '2026-11-01T00:00:00Z' },
    );
    await expect(addTraitReflectionRevisionToDB({
      id: 'bad-reflection', traitId, definitionRevisionId: 'missing-definition', currentExpression: 'Something.',
      createdAt: '2026-11-02T00:00:00Z',
    })).rejects.toThrow(/same trait/);
    await expect(addTraitReflectionRevisionToDB({
      id: 'bad-importance', traitId, definitionRevisionId: 'accountability-definition',
      currentExpression: 'Something.', importance: 'urgent' as never, createdAt: '2026-11-02T00:00:00Z',
    })).rejects.toThrow(/importance/);
    await expect(addTraitReflectionRevisionToDB({
      id: 'empty-reflection', traitId, definitionRevisionId: 'accountability-definition',
      createdAt: '2026-11-02T00:00:00Z',
    })).rejects.toThrow(/Add a reflection/);
    await expect(saveTraitExampleToDB({
      id: 'bad-example-date', traitId, description: 'A moment.', occurredOn: '2026-02-31',
      recordedAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z',
    })).rejects.toThrow(/valid ISO calendar date/);
    await expect(saveTraitExampleToDB({
      id: 'orphan-example', traitId: 'missing-trait', description: 'A moment.', occurredOn: '2026-11-03',
      recordedAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z',
    })).rejects.toThrow(/does not exist/);

    await saveTraitExampleToDB({
      id: 'accountability-example', traitId, description: 'I acknowledged an error and corrected it.',
      occurredOn: '2026-11-02', context: 'At work.', recordedAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z',
    });
    await saveTraitExampleToDB({
      id: 'accountability-example', traitId, description: 'I acknowledged the error and followed up.',
      occurredOn: '2026-11-01', context: 'Clarified the outcome.', recordedAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-04T00:00:00Z',
    });
    expect(await getPersonalityCharacterFromDB()).toMatchObject({
      examples: [expect.objectContaining({
        id: 'accountability-example',
        description: 'I acknowledged the error and followed up.',
        occurredOn: '2026-11-01',
        recordedAt: '2026-11-03T00:00:00.000Z',
        updatedAt: '2026-11-04T00:00:00.000Z',
      })],
    });
    await expect(saveTraitExampleToDB({
      id: 'accountability-example', traitId, description: 'Moved record date.', occurredOn: '2026-11-01',
      recordedAt: '2026-11-05T00:00:00Z', updatedAt: '2026-11-05T00:00:00Z',
    })).rejects.toThrow(/recording date cannot be changed/);
    await deleteTraitExampleFromDB('accountability-example');
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({ examples: [] });
  });

  it('deactivates and reactivates custom traits without losing history', async () => {
    const traitId = 'custom-trait-patience';
    await createCustomPersonalityTrait(
      { id: traitId, isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
      { id: 'patience-definition', traitId, name: 'Patience', definition: 'Making space for time.', createdAt: '2026-11-01T00:00:00Z' },
    );
    await addTraitReflectionRevisionToDB({
      id: 'patience-reflection', traitId, definitionRevisionId: 'patience-definition',
      currentExpression: 'I pause before replying.', createdAt: '2026-11-02T00:00:00Z',
    });
    await setCustomPersonalityTraitActive(traitId, false, '2026-11-03T00:00:00Z');
    await expect(addTraitReflectionRevisionToDB({
      id: 'inactive-reflection', traitId, definitionRevisionId: 'patience-definition',
      desiredExpression: 'Wait more comfortably.', createdAt: '2026-11-04T00:00:00Z',
    })).rejects.toThrow(/Reactivate this trait/);
    await setCustomPersonalityTraitActive(traitId, true, '2026-11-05T00:00:00Z');
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: traitId, isActive: true })]),
      reflections: [expect.objectContaining({ id: 'patience-reflection' })],
    });
  });

  it('round-trips trait records in backups and clears custom data while preserving the built-in catalogue', async () => {
    const traitId = 'custom-trait-kindness';
    await createCustomPersonalityTrait(
      { id: traitId, isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
      { id: 'kindness-definition', traitId, name: 'Kindness', definition: 'A personal quality.', createdAt: '2026-11-01T00:00:00Z' },
    );
    await addTraitReflectionRevisionToDB({
      id: 'kindness-reflection', traitId, definitionRevisionId: 'kindness-definition',
      desiredExpression: 'Be more attentive.', createdAt: '2026-11-02T00:00:00Z',
    });
    await saveTraitExampleToDB({
      id: 'kindness-example', traitId, description: 'A private example.', occurredOn: '2026-11-02',
      recordedAt: '2026-11-03T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z',
    });
    const backup = await exportDatabase();

    await clearLifeData();
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.not.arrayContaining([expect.objectContaining({ id: traitId })]),
      definitions: expect.not.arrayContaining([expect.objectContaining({ id: 'kindness-definition' })]),
      reflections: [],
      examples: [],
    });
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: 'atlas.trait.integrity', isBuiltIn: true })]),
      definitions: expect.arrayContaining([expect.objectContaining({ id: 'atlas.trait.integrity.definition.v1' })]),
    });

    await importDatabase(backup);
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: traitId, isBuiltIn: false })]),
      definitions: expect.arrayContaining([expect.objectContaining({ id: 'kindness-definition' })]),
      reflections: expect.arrayContaining([expect.objectContaining({ id: 'kindness-reflection' })]),
      examples: expect.arrayContaining([expect.objectContaining({ id: 'kindness-example' })]),
    });
  });

  it('rejects imported trait examples with orphaned trait relationships', async () => {
    const activeSnapshot = await getPersonalityCharacterFromDB();
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const invalidDatabase = new SQL.Database(await exportDatabase());
    invalidDatabase.run('PRAGMA foreign_keys = OFF;');
    invalidDatabase.run(`
      INSERT INTO life_trait_examples
        (id, traitId, description, occurredOn, recordedAt, updatedAt)
      VALUES ('orphan-trait-example', 'missing-trait', 'Orphaned example.', '2026-11-01',
        '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z');
    `);
    await expect(importDatabase(invalidDatabase.export())).rejects.toThrow(/foreign key/i);
    invalidDatabase.close();
    await expect(getPersonalityCharacterFromDB()).resolves.toMatchObject({
      traits: expect.arrayContaining([expect.objectContaining({ id: activeSnapshot.traits[0].id })]),
    });
  });

  it('does not overwrite a pre-existing custom record whose identifier collides with a catalogue ID', async () => {
    const backupToRestore = await exportDatabase();
    const catalogId = builtInLifeAttributes[0].id;
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const legacyDatabase = new SQL.Database(backupToRestore);
    legacyDatabase.run(`
      DROP TRIGGER life_builtin_attribute_insert_guard;
      DROP TRIGGER life_builtin_attribute_update_guard;
      DROP TRIGGER life_builtin_attribute_delete_guard;
      DROP TRIGGER life_attribute_metadata_insert_guard;
      DROP TRIGGER life_attribute_metadata_update_guard;
      DROP TRIGGER life_active_attribute_dimension_insert_guard;
      DROP TRIGGER life_active_attribute_dimension_update_guard;
    `);
    legacyDatabase.run('DELETE FROM life_attribute_definitions WHERE id = ?;', [catalogId]);
    legacyDatabase.run(`
      INSERT INTO life_attribute_definitions
        (id, dimensionId, name, description, kind, valueType, priority, isBuiltIn, isActive, createdAt, updatedAt)
      VALUES (?, 'physical-health', 'My existing attribute', 'User-owned record.', 'capability', 'narrative',
        'medium', 0, 1, '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z');
    `, [catalogId]);
    legacyDatabase.run(`
      INSERT INTO life_attribute_entries
        (id, attributeId, recordedAt, valueJson, isValid, createdAt)
      VALUES ('collision-history', ?, '2026-10-02T00:00:00Z', '"Existing narrative"', 1, '2026-10-02T00:00:00Z');
    `, [catalogId]);
    legacyDatabase.run('DELETE FROM life_schema_migrations WHERE version = 4;');

    try {
      await importDatabase(legacyDatabase.export());
      await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: catalogId, name: 'My existing attribute', isBuiltIn: false }),
      ]));
      await expect(getLifeAttributeEntriesFromDB(catalogId)).resolves.toEqual([
        expect.objectContaining({ id: 'collision-history', value: 'Existing narrative' }),
      ]);
      await expect(getLifeAttributeDefinitionsFromDB()).resolves.toHaveLength(builtInLifeAttributes.length);
    } finally {
      legacyDatabase.close();
      await importDatabase(backupToRestore);
    }
  });

  it('preserves append-only Life attribute entries and derives the current valid entry', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-strength', dimensionId: 'physical-health', name: 'Strength', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z',
    });
    await addLifeAttributeEntryToDB({ id: 'strength-1', attributeId: 'life-strength', recordedAt: '2026-11-01T00:00:00.000Z', value: 70, isValid: true, createdAt: '2026-11-01T00:00:00.000Z' });
    await addLifeAttributeEntryToDB({ id: 'strength-2', attributeId: 'life-strength', recordedAt: '2026-11-02T00:00:00.000Z', value: 75, isValid: true, createdAt: '2026-11-02T00:00:00.000Z' });

    await expect(getCurrentLifeAttributeEntryFromDB('life-strength')).resolves.toMatchObject({ id: 'strength-2', value: 75 });
  });

    it('accepts frequency, rating, and narrative entries using their declared value types', async () => {
      const definitions = [
        { id: 'frequency-history', valueType: 'frequency' as const, kind: 'measurement' as const, value: 3.5 },
        { id: 'rating-history', valueType: 'rating' as const, kind: 'subjective-assessment' as const, value: 7.5 },
        { id: 'narrative-history', valueType: 'narrative' as const, kind: 'subjective-assessment' as const, value: 'More settled than last month.' },
      ];
      for (const item of definitions) {
        await saveLifeAttributeDefinitionToDB({
          id: item.id, dimensionId: 'physical-health', name: item.id, kind: item.kind, valueType: item.valueType,
          priority: 'maintain', isBuiltIn: false, isActive: true,
          createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
        });
        await addLifeAttributeEntryToDB({
          id: `${item.id}-entry`, attributeId: item.id, recordedAt: '2026-11-02T00:00:00Z',
          value: item.value, isValid: true, createdAt: '2026-11-02T00:00:00Z',
        });
        await expect(getCurrentLifeAttributeEntryFromDB(item.id)).resolves.toMatchObject({ value: item.value });
      }
      await addIdealTargetRevisionToDB({
        id: 'rating-target', attributeId: 'rating-history', targetValue: 9, priority: 'maintain',
        createdAt: '2026-11-03T00:00:00Z',
      });
      await addIdealTargetRevisionToDB({
        id: 'narrative-target', attributeId: 'narrative-history',
        narrative: 'Feel at ease and present more often.', reason: 'This supports a balanced life.',
        successDefinition: 'I can recognize it in ordinary moments.', priority: 'medium',
        createdAt: '2026-11-03T00:00:00Z',
      });
      await expect(getCurrentIdealTargetRevisionFromDB('rating-history')).resolves.toMatchObject({
        id: 'rating-target', targetValue: 9, priority: 'maintain',
      });
      await expect(getCurrentIdealTargetRevisionFromDB('narrative-history')).resolves.toMatchObject({
        id: 'narrative-target', narrative: 'Feel at ease and present more often.', priority: 'medium',
      });

      await expect(addLifeAttributeEntryToDB({
        id: 'negative-frequency', attributeId: 'frequency-history', recordedAt: '2026-11-03T00:00:00Z',
        value: -1, isValid: true, createdAt: '2026-11-03T00:00:00Z',
      })).rejects.toThrow(/non-negative/);
      await expect(addLifeAttributeEntryToDB({
        id: 'invalid-rating', attributeId: 'rating-history', recordedAt: '2026-11-03T00:00:00Z',
        value: 'high', isValid: true, createdAt: '2026-11-03T00:00:00Z',
      })).rejects.toThrow(/finite number/);
    });

    it('invalidates and corrects entries without changing the historical observation', async () => {
      await saveLifeAttributeDefinitionToDB({
        id: 'life-correction', dimensionId: 'physical-health', name: 'Correction test', kind: 'measurement', valueType: 'counter', priority: 'high',
        isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
      });
      const original: import('../../features/life/domain/types').AttributeEntry = {
        id: 'entry-original', attributeId: 'life-correction', recordedAt: '2026-11-02T00:00:00Z',
        value: 10, note: 'Original context', isValid: true, createdAt: '2026-11-03T00:00:00Z',
      };
      await addLifeAttributeEntryToDB(original);
      await expect(invalidateLifeAttributeEntryInDB(original.id, '2026-11-04T00:00:00Z', '')).rejects.toThrow(/reason is required/);

      await correctLifeAttributeEntryInDB(original.id, {
        id: 'entry-corrected', attributeId: 'life-correction', recordedAt: '2026-11-02T00:00:00Z',
        value: 12, note: 'Corrected context', isValid: true, createdAt: '2026-11-05T00:00:00Z',
      }, 'The first value was entered incorrectly.');
      const entries = await getLifeAttributeEntriesFromDB('life-correction');
      expect(entries).toEqual([
        expect.objectContaining({
          id: original.id, value: original.value, note: original.note, isValid: false,
          invalidatedAt: expect.any(String), invalidationReason: 'The first value was entered incorrectly.',
        }),
        expect.objectContaining({ id: 'entry-corrected', value: 12, isValid: true, correctsEntryId: original.id }),
      ]);
      await expect(getCurrentLifeAttributeEntryFromDB('life-correction')).resolves.toMatchObject({ id: 'entry-corrected', value: 12 });
      await expect(correctLifeAttributeEntryInDB(original.id, {
        id: 'duplicate-correction', attributeId: 'life-correction', recordedAt: '2026-11-02T00:00:00Z',
        value: 15, isValid: true, createdAt: '2026-11-06T00:00:00Z',
      }, 'Another attempt')).rejects.toThrow(/already invalid/);
      await expect(correctLifeAttributeEntryInDB('entry-corrected', {
        id: 'wrong-attribute-correction', attributeId: 'another-attribute', recordedAt: '2026-11-02T00:00:00Z',
        value: 15, isValid: true, createdAt: '2026-11-06T00:00:00Z',
      }, 'Wrong attribute')).rejects.toThrow(/same attribute/);

      await addLifeAttributeEntryToDB({
        id: 'entry-to-invalidate', attributeId: 'life-correction', recordedAt: '2026-11-07T00:00:00Z',
        value: 99, isValid: true, createdAt: '2026-11-07T00:00:00Z',
      });
      await invalidateLifeAttributeEntryInDB('entry-to-invalidate', '2026-11-08T00:00:00Z', 'This was a test value.');
      await expect(getLifeAttributeEntriesFromDB('life-correction')).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'entry-to-invalidate', value: 99, isValid: false, invalidationReason: 'This was a test value.' }),
      ]));
      await expect(getCurrentLifeAttributeEntryFromDB('life-correction')).resolves.toMatchObject({ id: 'entry-corrected', value: 12 });

      const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
      const database = new SQL.Database(await exportDatabase());
      expect(() => database.run(
        'UPDATE life_attribute_entries SET valueJson = ? WHERE id = ?;',
        ['100', 'entry-original'],
      )).toThrow(/immutable except for audited invalidation/);
      database.close();
    });

  it('normalizes timezone-aware timestamps and orders backdated and tied entries deterministically', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-ordering', dimensionId: 'physical-health', name: 'Ordering', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00+00:00', updatedAt: '2026-11-01T00:00:00+00:00',
    });

    await addLifeAttributeEntryToDB({
      id: 'entry-backdated', attributeId: 'life-ordering', recordedAt: '2026-11-01T00:00:00+05:30',
      value: 1, isValid: true, createdAt: '2026-11-04T00:00:00Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'entry-tie-z', attributeId: 'life-ordering', recordedAt: '2026-11-02T00:00:00Z',
      value: 3, isValid: true, createdAt: '2026-11-04T00:00:00Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'entry-tie-a', attributeId: 'life-ordering', recordedAt: '2026-11-02T00:00:00Z',
      value: 2, isValid: true, createdAt: '2026-11-04T00:00:00Z',
    });

    await expect(getLifeAttributeEntriesFromDB('life-ordering')).resolves.toMatchObject([
      { id: 'entry-backdated', recordedAt: '2026-10-31T18:30:00.000Z' },
      { id: 'entry-tie-a' },
      { id: 'entry-tie-z' },
    ]);
    await expect(getCurrentLifeAttributeEntryFromDB('life-ordering')).resolves.toMatchObject({ id: 'entry-tie-z', value: 3 });
  });

  it('does not rewrite historical timestamps while applying the additive migration', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-old-time', dimensionId: 'physical-health', name: 'Old timestamp', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'old-format-entry', attributeId: 'life-old-time', recordedAt: '2026-11-02T00:00:00Z',
      value: 1, isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const legacyDatabase = new SQL.Database(await exportDatabase());
    legacyDatabase.run('DROP TRIGGER life_attribute_entry_values_update;');
    legacyDatabase.run("UPDATE life_attribute_entries SET recordedAt = '2026-11-02T00:00:00+00:00' WHERE id = 'old-format-entry';");
    legacyDatabase.run(`
      DROP TRIGGER life_attribute_entry_correction_insert;
      DROP TRIGGER life_attribute_entry_invalidation_insert;
      ALTER TABLE life_attribute_entries DROP COLUMN correctsEntryId;
      ALTER TABLE life_attribute_entries DROP COLUMN invalidationReason;
      ALTER TABLE life_attribute_entries DROP COLUMN invalidatedAt;
      DELETE FROM life_schema_migrations WHERE version = 5;
    `);

    await importDatabase(legacyDatabase.export());

    await expect(getLifeAttributeEntriesFromDB('life-old-time')).resolves.toMatchObject([
      { id: 'old-format-entry', recordedAt: '2026-11-02T00:00:00+00:00', isValid: true },
    ]);
    await expect(getLifeAttributeEntriesFromDB('life-old-time')).resolves.toEqual([
      expect.objectContaining({ id: 'old-format-entry', invalidatedAt: undefined, invalidationReason: undefined, correctsEntryId: undefined }),
    ]);
    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    legacyDatabase.close();
  });

  it('upgrades a genuine version 2 profile schema without losing existing data', async () => {
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const versionTwoDatabase = new SQL.Database();
    versionTwoDatabase.run(`
      CREATE TABLE life_schema_migrations (version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
      INSERT INTO life_schema_migrations (version, appliedAt) VALUES
        (1, '2026-10-01T00:00:00Z'),
        (2, '2026-10-02T00:00:00Z');
      CREATE TABLE life_profiles (
        id TEXT PRIMARY KEY CHECK (id = 'current'),
        name TEXT,
        occupation TEXT,
        education TEXT,
        description TEXT,
        lifePhase TEXT,
        updatedAt TEXT NOT NULL
      );
      INSERT INTO life_profiles (id, name, occupation, education, description, lifePhase, updatedAt)
      VALUES ('current', 'Legacy profile', 'Teacher', 'Graduate study', 'Patient and curious.', 'Building a new routine', '2026-10-02T00:00:00Z');
      CREATE TABLE life_dimensions (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, isBuiltIn INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );
    `);
    for (const dimension of createBuiltInLifeDimensions('2026-10-01T00:00:00.000Z')) {
      versionTwoDatabase.run(
        `INSERT INTO life_dimensions (id, name, description, isBuiltIn, isActive, position, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [dimension.id, dimension.name, dimension.description, 1, 1, dimension.position, dimension.createdAt, dimension.updatedAt],
      );
    }

    await importDatabase(versionTwoDatabase.export());

    await expect(getLifeSchemaVersion()).resolves.toBe(7);
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({
      name: 'Legacy profile',
      occupation: 'Teacher',
      education: 'Graduate study',
      description: 'Patient and curious.',
      lifePhase: 'Building a new routine',
      dateOfBirth: null,
      location: null,
    });
    await expect(getLifeDimensionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'physical-health', name: 'Physical Health' }),
    ]));
    versionTwoDatabase.close();
  });

  it('rejects malformed or timezone-ambiguous Life timestamps before writing', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-invalid-time', dimensionId: 'physical-health', name: 'Invalid timestamp', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await expect(addLifeAttributeEntryToDB({
      id: 'invalid-entry', attributeId: 'life-invalid-time', recordedAt: '2026-02-30T12:00:00',
      value: 1, isValid: true, createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/ISO-8601|calendar timestamp/);
    await expect(getLifeAttributeEntriesFromDB('life-invalid-time')).resolves.toEqual([]);
  });

  it('allows a custom dimension alongside the built-in framework', async () => {
    await saveLifeDimensionToDB({ id: 'custom-community', name: 'Community', description: 'A personally defined dimension.', isBuiltIn: false, isActive: true, position: 20, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z' });
    await expect(getLifeDimensionsFromDB()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 'custom-community', isBuiltIn: false })]));
  });

  it('updates and deactivates attributes without disturbing historical references', async () => {
    const definition = {
      id: 'life-deactivate', dimensionId: 'physical-health', name: 'Activity history', kind: 'measurement' as const,
      valueType: 'counter' as const, priority: 'high' as const, isBuiltIn: false, isActive: true,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    };
    await saveLifeAttributeDefinitionToDB(definition);
    await addLifeAttributeEntryToDB({
      id: 'deactivate-entry', attributeId: definition.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 10, isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });
    await saveLifeMilestoneToDB({ id: 'deactivate-milestone', title: 'Evidence', createdAt: '2026-11-02T00:00:00Z' });
    await saveLifeActivityAttributeLinkToDB({
      id: 'deactivate-link', attributeId: definition.id, activitySource: 'life_milestones',
      activityId: 'deactivate-milestone', createdAt: '2026-11-02T00:00:00Z',
    });
    await addIdealTargetRevisionToDB({
      id: 'deactivate-target', attributeId: definition.id, targetValue: 20, priority: 'medium', createdAt: '2026-11-02T00:00:00Z',
    });

    await saveLifeAttributeDefinitionToDB({ ...definition, name: 'Updated name', isActive: false, updatedAt: '2026-11-03T00:00:00Z' });

    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: definition.id, name: 'Updated name', isActive: false }),
    ]));
    await expect(getLifeAttributeEntriesFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(getIdealTargetRevisionsFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(getLifeActivityAttributeLinksFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(addLifeAttributeEntryToDB({
      id: 'inactive-entry', attributeId: definition.id, recordedAt: '2026-11-03T00:00:00Z',
      value: 11, isValid: true, createdAt: '2026-11-03T00:00:00Z',
    })).rejects.toThrow(/is inactive/);
    await expect(addIdealTargetRevisionToDB({
      id: 'inactive-target', attributeId: definition.id, targetValue: 25,
      priority: 'medium', createdAt: '2026-11-03T00:00:00Z',
    })).rejects.toThrow(/is inactive/);

    await saveLifeAttributeDefinitionToDB({ ...definition, name: 'Reactivated name', isActive: true, updatedAt: '2026-11-04T00:00:00Z' });
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: definition.id, name: 'Reactivated name', isActive: true }),
    ]));
    await expect(getLifeAttributeEntriesFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(getIdealTargetRevisionsFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(getLifeActivityAttributeLinksFromDB(definition.id)).resolves.toHaveLength(1);
  });

  it('allows safe attribute edits but rejects incompatible metadata changes after history exists', async () => {
    const definition = {
      id: 'life-metadata-safe', dimensionId: 'physical-health', name: 'Functional capacity',
      description: 'First description.', kind: 'measurement' as const, valueType: 'counter' as const,
      unit: 'tests', measurementFrequency: 'quarterly', priority: 'medium' as const,
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    };
    await saveLifeAttributeDefinitionToDB(definition);
    await addLifeAttributeEntryToDB({
      id: 'metadata-history', attributeId: definition.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 4, isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });

    await saveLifeAttributeDefinitionToDB({
      ...definition, name: 'Everyday capacity', description: 'Updated description.',
      measurementFrequency: 'monthly', priority: 'high', updatedAt: '2026-11-03T00:00:00Z',
    });
    await expect(saveLifeAttributeDefinitionToDB({
      ...definition, valueType: 'frequency', updatedAt: '2026-11-04T00:00:00Z',
    })).rejects.toThrow(/cannot change while this attribute has history/);
    await expect(saveLifeAttributeDefinitionToDB({
      ...definition, unit: 'hours', updatedAt: '2026-11-04T00:00:00Z',
    })).rejects.toThrow(/cannot change while this attribute has history/);
    await expect(saveLifeAttributeDefinitionToDB({
      ...definition, dimensionId: 'family', updatedAt: '2026-11-04T00:00:00Z',
    })).rejects.toThrow(/cannot change while this attribute has history/);
    await expect(getLifeAttributeEntriesFromDB(definition.id)).resolves.toHaveLength(1);
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: definition.id, name: 'Everyday capacity', unit: 'tests' }),
    ]));
  });

  it('manages custom dimensions through edit and soft deactivation while preserving attribute history', async () => {
    const now = '2026-11-01T00:00:00Z';
    const dimension = {
      id: 'custom-balance', name: 'Personal balance', description: 'Original description.',
      isBuiltIn: false, isActive: true, position: 20, createdAt: now, updatedAt: now,
    };
    await saveLifeDimensionToDB(dimension);
    await saveLifeDimensionToDB({ ...dimension, name: 'Daily balance', description: 'Edited description.', updatedAt: '2026-11-02T00:00:00Z' });
    const attribute = {
      id: 'custom-balance-measure', dimensionId: dimension.id, name: 'Balance reflection',
      kind: 'subjective-assessment' as const, valueType: 'rating' as const, priority: 'medium' as const,
      isBuiltIn: false, isActive: true, createdAt: now, updatedAt: now,
    };
    await saveLifeAttributeDefinitionToDB(attribute);
    await addLifeAttributeEntryToDB({
      id: 'custom-balance-entry', attributeId: attribute.id, recordedAt: '2026-11-02T00:00:00Z',
      value: 3, isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });
    await addIdealTargetRevisionToDB({
      id: 'custom-balance-target', attributeId: attribute.id, targetValue: 4,
      priority: 'medium', createdAt: '2026-11-02T00:00:00Z',
    });

    await saveLifeDimensionToDB({ ...dimension, name: 'Daily balance', description: 'Edited description.', isActive: false, updatedAt: '2026-11-03T00:00:00Z' });
    await expect(getLifeDimensionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: dimension.id, name: 'Daily balance', isActive: false }),
    ]));
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: attribute.id, isActive: false }),
    ]));
    await expect(getLifeAttributeEntriesFromDB(attribute.id)).resolves.toHaveLength(1);
    await expect(getIdealTargetRevisionsFromDB(attribute.id)).resolves.toHaveLength(1);
    await expect(saveLifeAttributeDefinitionToDB({ ...attribute, isActive: true, updatedAt: '2026-11-03T00:00:00Z' })).rejects.toThrow(/active dimension/);

    await saveLifeDimensionToDB({ ...dimension, name: 'Daily balance', description: 'Edited description.', isActive: true, updatedAt: '2026-11-04T00:00:00Z' });
    await expect(saveLifeAttributeDefinitionToDB({ ...attribute, isActive: true, updatedAt: '2026-11-05T00:00:00Z' })).resolves.toBeUndefined();
    await expect(getLifeAttributeEntriesFromDB(attribute.id)).resolves.toHaveLength(1);
    await expect(getIdealTargetRevisionsFromDB(attribute.id)).resolves.toHaveLength(1);
  });

  it('rejects invalid repository inputs for each Life record type', async () => {
    const definition = {
      id: 'life-validation', dimensionId: 'physical-health', name: 'Validation', kind: 'measurement' as const,
      valueType: 'counter' as const, priority: 'high' as const, isBuiltIn: false, isActive: true,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    };
    await saveLifeAttributeDefinitionToDB(definition);

    await expect(saveLifeAttributeDefinitionToDB({ ...definition, kind: 'measurement', valueType: 'narrative' as never })).rejects.toThrow(/not compatible/);
    await expect(saveLifeAttributeDefinitionToDB({ ...definition, priority: 'urgent' as never })).rejects.toThrow(/priority/);
    await expect(addLifeAttributeEntryToDB({
      id: 'invalid-value', attributeId: definition.id, recordedAt: '2026-11-01T00:00:00Z',
      value: 'not numeric', isValid: true, createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/finite number/);
    await expect(addIdealTargetRevisionToDB({
      id: 'invalid-target', attributeId: definition.id, targetValue: 'not numeric', priority: 'high',
      createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/finite number/);
    await expect(saveLifeMilestoneToDB({ id: 'invalid-milestone', title: ' ', createdAt: '2026-11-01T00:00:00Z' })).rejects.toThrow(/title/);
    await expect(saveLifeReflectionToDB({
      id: 'invalid-reflection', periodType: 'decade' as never, periodStart: '2026-02-30', content: 'Text',
      createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/period type/);
    await expect(saveLifeEventToDB({
      id: 'invalid-event', eventType: 'career', title: 'Event', occurredAt: 'not a timestamp',
      createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/ISO-8601/);
    await expect(saveLifeActivityAttributeLinkToDB({
      id: 'invalid-link', attributeId: definition.id, activitySource: 'unknown_table', activityId: 'id',
      createdAt: '2026-11-01T00:00:00Z',
    })).rejects.toThrow(/Unsupported Life activity source/);
  });

  it('preserves superseded Ideal Self revisions with narrative and numerical targets', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-ideal-history', dimensionId: 'physical-health', name: 'Ideal history', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await addIdealTargetRevisionToDB({ id: 'target-1', attributeId: 'life-ideal-history', targetValue: 80, narrative: 'Feel capable and resilient in everyday life.', priority: 'high', createdAt: '2026-11-03T00:00:00.000Z' });
    const firstRevision = await getIdealTargetRevisionsFromDB('life-ideal-history');
    await addIdealTargetRevisionToDB({ id: 'target-2', attributeId: 'life-ideal-history', targetValue: 90, narrative: 'Build lasting strength without sacrificing recovery.', priority: 'maintain', createdAt: '2026-11-04T00:00:00.000Z' });

    await expect(getIdealTargetRevisionsFromDB('life-ideal-history')).resolves.toEqual([
      expect.objectContaining({ id: 'target-1', targetValue: 80, supersededAt: null }),
      expect.objectContaining({ id: 'target-2', targetValue: 90, supersededAt: null }),
    ]);
    const revisionsAfterInsert = await getIdealTargetRevisionsFromDB('life-ideal-history');
    expect(revisionsAfterInsert[0]).toEqual(firstRevision[0]);
    expect(revisionsAfterInsert[1]).toMatchObject({ id: 'target-2' });
    await expect(getCurrentIdealTargetRevisionFromDB('life-ideal-history')).resolves.toMatchObject({ id: 'target-2' });
  });

  it('includes Life profile data in exported backups', async () => {
    await saveLifeProfileToDB({ id: 'current', name: 'Atlas User', description: 'A deliberate life in progress.', updatedAt: '2026-11-05T00:00:00.000Z' });
    const backup = await exportDatabase();
    await importDatabase(backup);
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({ id: 'current', name: 'Atlas User' });
  });

  it('creates and edits a profile while allowing personal details to remain optional', async () => {
    await saveLifeProfileToDB({
      id: 'current',
      name: 'Rae',
      lifePhase: 'Starting again',
      updatedAt: '2026-11-06T09:00:00+05:30',
    });
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({
      id: 'current',
      name: 'Rae',
      lifePhase: 'Starting again',
      updatedAt: '2026-11-06T03:30:00.000Z',
      dateOfBirth: null,
      location: null,
    });

    await saveLifeProfileToDB({
      id: 'current',
      name: 'Rae A.',
      dateOfBirth: '1992-02-29',
      occupation: 'Designer',
      education: 'Self-directed',
      location: 'Northern California',
      description: 'Curious about how people learn.',
      currentCircumstances: 'Settling into a new city.',
      importantResponsibilities: 'Care for family and make time to rest.',
      interests: 'Gardening, drawing, and long walks.',
      updatedAt: '2026-11-06T10:00:00Z',
    });
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({
      name: 'Rae A.',
      dateOfBirth: '1992-02-29',
      location: 'Northern California',
      interests: 'Gardening, drawing, and long walks.',
    });
  });

  it('persists Current Self reflections independently from measurement history', async () => {
    await saveLifeCurrentSelfToDB({
      id: 'current',
      physicalCondition: 'More rested than last season.',
      currentChallenges: 'Making space for a difficult transition.',
      currentStrengths: 'Patient and willing to ask for help.',
      updatedAt: '2026-11-06T10:00:00Z',
    });
    await expect(getLifeCurrentSelfFromDB()).resolves.toMatchObject({
      id: 'current',
      physicalCondition: 'More rested than last season.',
      currentChallenges: 'Making space for a difficult transition.',
    });
    await saveLifeCurrentSelfToDB({
      id: 'current',
      careerSituation: 'Exploring new possibilities.',
      updatedAt: '2026-11-07T10:00:00Z',
    });
    await expect(getLifeCurrentSelfFromDB()).resolves.toMatchObject({
      careerSituation: 'Exploring new possibilities.',
      physicalCondition: null,
    });
    await expect(getLifeAttributeEntriesFromDB('no-duplicate-measurements')).resolves.toEqual([]);
  });

  it('keeps every overall Ideal Self narrative revision and returns the latest vision', async () => {
    const first = { id: 'overall-ideal-1', narrative: 'A thoughtful person who makes room for family and learning.', createdAt: '2026-11-06T10:00:00Z' };
    const second = { id: 'overall-ideal-2', narrative: 'A grounded life of meaningful work, deep relationships, and contribution.', createdAt: '2026-11-07T10:00:00Z' };
    await addLifeIdealSelfRevisionToDB(first);
    await addLifeIdealSelfRevisionToDB(second);

    await expect(getLifeIdealSelfRevisionsFromDB()).resolves.toEqual([
      { ...first, createdAt: '2026-11-06T10:00:00.000Z' },
      { ...second, createdAt: '2026-11-07T10:00:00.000Z' },
    ]);
    await expect(getCurrentLifeIdealSelfFromDB()).resolves.toMatchObject({
      id: second.id,
      narrative: second.narrative,
      createdAt: '2026-11-07T10:00:00.000Z',
    });
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const database = new SQL.Database(await exportDatabase());
    expect(() => database.run(
      "UPDATE life_ideal_self_revisions SET narrative = 'overwritten' WHERE id = 'overall-ideal-1';",
    )).toThrow(/immutable/);
    database.close();
  });

  it('persists custom personal values with each supported priority and supports editing/removal', async () => {
    await saveLifePersonalValueToDB({
      id: 'value-family',
      name: 'Family',
      description: 'Show up with care and attention.',
      priority: 'maintain',
      createdAt: '2026-11-06T10:00:00Z',
      updatedAt: '2026-11-06T10:00:00Z',
    });
    await saveLifePersonalValueToDB({
      id: 'value-curiosity',
      name: 'Curiosity',
      priority: 'high',
      createdAt: '2026-11-06T11:00:00Z',
      updatedAt: '2026-11-06T11:00:00Z',
    });
    await saveLifePersonalValueToDB({
      id: 'value-family',
      name: 'Family connection',
      priority: 'medium',
      createdAt: '2026-11-06T10:00:00Z',
      updatedAt: '2026-11-07T10:00:00Z',
    });

    await expect(getLifePersonalValuesFromDB()).resolves.toEqual([
      expect.objectContaining({ id: 'value-family', name: 'Family connection', priority: 'medium' }),
      expect.objectContaining({ id: 'value-curiosity', name: 'Curiosity', priority: 'high' }),
    ]);
    await deleteLifePersonalValueFromDB('value-family');
    await expect(getLifePersonalValuesFromDB()).resolves.toEqual([
      expect.objectContaining({ id: 'value-curiosity' }),
    ]);
  });

  it('rejects invalid profile, reflection, vision, and priority inputs at persistence boundaries', async () => {
    await expect(saveLifeProfileToDB({
      id: 'current',
      dateOfBirth: '1990-02-29',
      updatedAt: '2026-11-06T10:00:00Z',
    })).rejects.toThrow(/valid ISO calendar date/);
    await expect(saveLifeCurrentSelfToDB({
      id: 'current',
      updatedAt: '2026-11-06T10:00:00',
    })).rejects.toThrow(/timezone/);
    await expect(addLifeIdealSelfRevisionToDB({
      id: 'empty-vision',
      narrative: '   ',
      createdAt: '2026-11-06T10:00:00Z',
    })).rejects.toThrow(/non-empty/);
    await expect(saveLifePersonalValueToDB(JSON.parse(
      '{"id":"invalid-priority","name":"Care","priority":"urgent","createdAt":"2026-11-06T10:00:00Z","updatedAt":"2026-11-06T10:00:00Z"}',
    ))).rejects.toThrow(/priority is invalid/);

    await expect(getLifeProfileFromDB()).resolves.toBeNull();
    await expect(getLifeCurrentSelfFromDB()).resolves.toBeNull();
    await expect(getLifeIdealSelfRevisionsFromDB()).resolves.toEqual([]);
    await expect(getLifePersonalValuesFromDB()).resolves.toEqual([]);
  });

  it('round-trips every Life record type together through SQLite export and import', async () => {
    await saveLifeDimensionToDB({
      id: 'custom-roundtrip', name: 'Community', description: 'A personal dimension.', isBuiltIn: false, isActive: true, position: 21,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await saveLifeProfileToDB({ id: 'current', name: 'Round trip', updatedAt: '2026-11-01T00:00:00Z' });
    await saveLifeCurrentSelfToDB({
      id: 'current',
      knowledgeCapabilities: 'Learning to listen before solving.',
      relationshipsSocialLife: 'Making time for close friendships.',
      updatedAt: '2026-11-01T00:00:00Z',
    });
    await addLifeIdealSelfRevisionToDB({
      id: 'ideal-roundtrip', narrative: 'A generous, curious person with room for meaningful work and rest.',
      createdAt: '2026-11-01T00:00:00Z',
    });
    await saveLifePersonalValueToDB({
      id: 'value-roundtrip', name: 'Care', description: 'Act with consideration.', priority: 'maintain',
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await saveLifeAttributeDefinitionToDB({
      id: 'life-roundtrip', dimensionId: 'custom-roundtrip', name: 'Wellbeing', kind: 'subjective-assessment',
      valueType: 'rating', priority: 'medium', isBuiltIn: false, isActive: true,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'entry-roundtrip', attributeId: 'life-roundtrip', recordedAt: '2026-11-02T00:00:00Z',
      value: 8, isValid: true, createdAt: '2026-11-02T00:00:00Z',
    });
    await correctLifeAttributeEntryInDB('entry-roundtrip', {
      id: 'entry-roundtrip-corrected', attributeId: 'life-roundtrip', recordedAt: '2026-11-02T00:00:00Z',
      value: 7, note: 'Corrected after review.', isValid: true, createdAt: '2026-11-03T00:00:00Z',
    }, 'The first observation was recorded with the wrong value.');
    await addIdealTargetRevisionToDB({
      id: 'target-roundtrip', attributeId: 'life-roundtrip', targetValue: 9, narrative: 'Steady wellbeing.',
      priority: 'high', createdAt: '2026-11-02T00:00:00Z',
    });
    await saveLifeMilestoneToDB({ id: 'milestone-roundtrip', title: 'A meaningful step', achievedAt: '2026-11-02T00:00:00Z', createdAt: '2026-11-02T00:00:00Z' });
    await saveLifeActivityAttributeLinkToDB({
      id: 'link-roundtrip', attributeId: 'life-roundtrip', activitySource: 'life_milestones',
      activityId: 'milestone-roundtrip', createdAt: '2026-11-02T00:00:00Z',
    });
    await saveLifeReflectionToDB({
      id: 'reflection-roundtrip', periodType: 'monthly', periodStart: '2026-11-01', content: 'A useful month.',
      createdAt: '2026-11-02T00:00:00Z',
    });
    await saveLifeEventToDB({
      id: 'event-roundtrip', eventType: 'career', title: 'New direction', occurredAt: '2026-11-02T00:00:00Z',
      createdAt: '2026-11-02T00:00:00Z',
    });

    const backup = await exportDatabase();
    await clearLifeData();
    await flushDatabaseSave();
    await importDatabase(backup);

    await expect(getLifeDimensionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'custom-roundtrip' }),
    ]));
    await expect(getLifeProfileFromDB()).resolves.toMatchObject({ name: 'Round trip' });
    await expect(getLifeCurrentSelfFromDB()).resolves.toMatchObject({ knowledgeCapabilities: 'Learning to listen before solving.' });
    await expect(getCurrentLifeIdealSelfFromDB()).resolves.toMatchObject({ id: 'ideal-roundtrip' });
    await expect(getLifeIdealSelfRevisionsFromDB()).resolves.toHaveLength(1);
    await expect(getLifePersonalValuesFromDB()).resolves.toEqual([
      expect.objectContaining({ id: 'value-roundtrip', priority: 'maintain' }),
    ]);
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'life-roundtrip' }),
    ]));
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toHaveLength(builtInLifeAttributes.length + 1);
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(expect.arrayContaining(
      builtInLifeAttributes.map(({ id }) => expect.objectContaining({ id, isBuiltIn: true })),
    ));
    await expect(getLifeAttributeEntriesFromDB('life-roundtrip')).resolves.toEqual([
      expect.objectContaining({
        id: 'entry-roundtrip', value: 8, isValid: false,
        invalidationReason: 'The first observation was recorded with the wrong value.',
      }),
      expect.objectContaining({ id: 'entry-roundtrip-corrected', value: 7, isValid: true, correctsEntryId: 'entry-roundtrip' }),
    ]);
    await expect(getIdealTargetRevisionsFromDB('life-roundtrip')).resolves.toHaveLength(1);
    await expect(getLifeActivityAttributeLinksFromDB('life-roundtrip')).resolves.toHaveLength(1);
    await expect(getLifeMilestonesFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'milestone-roundtrip' }),
    ]));
    await expect(getLifeReflectionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'reflection-roundtrip' }),
    ]));
    await expect(getLifeEventsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'event-roundtrip' }),
    ]));
  });

  it('persists Life evidence, achievements, reflections, and events as distinct records', async () => {
    await saveLifeAttributeDefinitionToDB({
      id: 'life-evidence', dimensionId: 'physical-health', name: 'Evidence', kind: 'measurement', valueType: 'counter', priority: 'high',
      isBuiltIn: false, isActive: true, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await replaceStreakHabitsInDB([{ id: 'habit-1', name: 'Training', history: [], restDays: [], createdAt: '2026-11-01T00:00:00Z' }]);
    await saveLifeActivityAttributeLinkToDB({ id: 'link-1', attributeId: 'life-evidence', activitySource: 'streak_habits', activityId: 'habit-1', relationshipNote: 'Supports regular training.', createdAt: '2026-11-05T00:00:00.000Z' });
    await saveLifeMilestoneToDB({ id: 'milestone-1', title: 'First 10K', achievedAt: '2026-11-05T00:00:00.000Z', createdAt: '2026-11-05T00:00:00.000Z' });
    await saveLifeReflectionToDB({ id: 'reflection-1', periodType: 'monthly', periodStart: '2026-11-01', content: 'Training felt sustainable.', createdAt: '2026-11-05T00:00:00.000Z' });
    await saveLifeEventToDB({ id: 'event-1', eventType: 'career', title: 'Joined a new team', occurredAt: '2026-11-05T00:00:00.000Z', createdAt: '2026-11-05T00:00:00.000Z' });

    await expect(getLifeActivityAttributeLinksFromDB('life-evidence')).resolves.toEqual([
      expect.objectContaining({ id: 'link-1' }),
    ]);
    await expect(getLifeMilestonesFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'milestone-1' }),
    ]));
    await expect(getLifeReflectionsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'reflection-1' }),
    ]));
    await expect(getLifeEventsFromDB()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'event-1' }),
    ]));
  });

  it('clears Life records without removing the built-in framework', async () => {
    await saveGoalInDB({ id: 'unrelated-reset-goal', title: 'Keep this', completed: false, createdAt: '2026-11-01T00:00:00Z' });
    await saveLifeProfileToDB({ id: 'current', name: 'Clear this', updatedAt: '2026-11-01T00:00:00Z' });
    await saveLifeAttributeDefinitionToDB({
      id: 'custom-reset-attribute', dimensionId: 'physical-health', name: 'Remove on reset',
      kind: 'capability', valueType: 'narrative', priority: 'medium', isBuiltIn: false, isActive: true,
      createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    });
    await clearLifeData();
    await flushDatabaseSave();
    await expect(getLifeDimensionsFromDB()).resolves.toHaveLength(20);
    await expect(getLifeProfileFromDB()).resolves.toBeNull();
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toEqual(
      expect.arrayContaining(builtInLifeAttributes.map(({ id }) => expect.objectContaining({ id, isBuiltIn: true }))),
    );
    await expect(getLifeAttributeDefinitionsFromDB()).resolves.toHaveLength(builtInLifeAttributes.length);
    await expect(getGoalsFromDB()).resolves.toEqual([
      { id: 'unrelated-reset-goal', title: 'Keep this', note: undefined, completed: false, createdAt: '2026-11-01T00:00:00Z' },
    ]);
  });

  it('waits for durable Life reset persistence and propagates a storage failure', async () => {
    await saveLifeProfileToDB({ id: 'current', name: 'Reset check', updatedAt: '2026-11-01T00:00:00Z' });
    await flushDatabaseSave();
    const persistedBeforeReset = persistedValues.get('atlas.sqlite')?.slice();

    await clearLifeData();
    failNextPersist.value = true;
    await expect(flushDatabaseSave()).rejects.toThrow(/Simulated IndexedDB write failure/);
    expect(persistedValues.get('atlas.sqlite')).toEqual(persistedBeforeReset);

    await expect(getLifeProfileFromDB()).resolves.toBeNull();
    await flushDatabaseSave();
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

  it('rejects an orphaned foreign-key import without replacing the active database', async () => {
    await replaceGoalsInDB([{ id: 'fk-active-goal', title: 'Keep active data', completed: false, createdAt: '2026-11-01T00:00:00Z' }]);
    await flushDatabaseSave();
    const SQL = await initSqlJs({ locateFile: () => sqlWasmPath });
    const invalidDatabase = new SQL.Database();
    invalidDatabase.run(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE life_schema_migrations (version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
      INSERT INTO life_schema_migrations (version, appliedAt) VALUES (1, '2026-11-01T00:00:00Z');
      CREATE TABLE life_dimensions (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, isBuiltIn INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
      );
      CREATE TABLE life_attribute_definitions (
        id TEXT PRIMARY KEY, dimensionId TEXT NOT NULL, name TEXT NOT NULL, description TEXT, kind TEXT NOT NULL,
        valueType TEXT NOT NULL, unit TEXT, priority TEXT NOT NULL, measurementFrequency TEXT,
        assessmentMethodology TEXT, measurementSource TEXT, isBuiltIn INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
        FOREIGN KEY (dimensionId) REFERENCES life_dimensions(id)
      );
      CREATE TABLE life_attribute_entries (
        id TEXT PRIMARY KEY, attributeId TEXT NOT NULL, recordedAt TEXT NOT NULL, valueJson TEXT NOT NULL,
        source TEXT, note TEXT, isValid INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL,
        FOREIGN KEY (attributeId) REFERENCES life_attribute_definitions(id)
      );
      INSERT INTO life_attribute_entries (id, attributeId, recordedAt, valueJson, isValid, createdAt)
      VALUES ('orphan-entry', 'missing-attribute', '2026-11-01T00:00:00Z', '1', 1, '2026-11-01T00:00:00Z');
    `);

    await expect(importDatabase(invalidDatabase.export())).rejects.toThrow(/foreign key/i);
    await expect(getGoalsFromDB()).resolves.toEqual([
      { id: 'fk-active-goal', title: 'Keep active data', note: undefined, completed: false, createdAt: '2026-11-01T00:00:00Z' },
    ]);
    invalidDatabase.close();
  });

  it('clears the legacy glasses count once while preserving other health metrics', async () => {
    await replaceHealthSnapshotInDB(
      { weight: 72, water: 8, sleep: 7.5, workout: 30 },
      'legacy snapshot',
    );
    await removeSettingFromDB('health-water-unit-bottles-v1');

    const legacyBackup = await exportDatabase();
    await importDatabase(legacyBackup);

    await expect(getHealthSnapshotFromDB()).resolves.toMatchObject({
      health: { weight: 72, water: null, sleep: 7.5, workout: 30 },
      lastUpdated: 'legacy snapshot',
      metrics: {
        water: [expect.objectContaining({ value: null, observedAt: null, origin: 'legacy-baseline' })],
      },
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

    await expect(getHealthSnapshotFromDB()).resolves.toMatchObject({
      health: { weight: 72, water: 3, sleep: 7.5, workout: 30 },
      lastUpdated: 'bottle snapshot',
      metrics: {
        water: [expect.objectContaining({ value: 3, observedAt: null, origin: 'legacy-baseline' })],
      },
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

    await expect(getHealthSnapshotFromDB()).resolves.toMatchObject({
      health: { weight: 70, water: 4, sleep: 8, workout: 20 },
      lastUpdated: 'previously migrated snapshot',
      metrics: {
        water: [expect.objectContaining({ value: 4, observedAt: null, origin: 'legacy-baseline' })],
      },
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

  it('builds an empty Life dashboard without writing records', async () => {
    await clearLifeData();
    await clearHealthSnapshot();
    await clearJournalEntries();
    await replaceSavingsEntriesInDB([]);

    const before = await exportDatabase();
    const snapshot = await loadLifeDashboardSnapshot();
    const after = await exportDatabase();

    expect(snapshot.profile).toBeNull();
    expect(snapshot.currentSelf).toBeNull();
    expect(snapshot.idealSelf).toBeNull();
    expect(snapshot.canonicalDimensions).toHaveLength(20);
    expect(snapshot.customDimensions).toEqual([]);
    expect(snapshot.savings).toEqual({ ledgerBalance: 0, entryCount: 0 });
    expect(snapshot.journal).toEqual({ entryCount: 0, latestEntryAt: null });
    expect(Array.from(after)).toEqual(Array.from(before));
  });

  it('aggregates populated Life records with deterministic current entries and targets', async () => {
    await clearLifeData();
    await clearHealthSnapshot();
    await clearJournalEntries();
    await replaceSavingsEntriesInDB([
      { id: 'dashboard-income', amount: 25, description: 'Income', category: 'income', createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'dashboard-expense', amount: 8, description: 'Expense', category: 'expense', createdAt: '2026-11-02T00:00:00.000Z' },
    ]);
    await replaceHealthSnapshotInDB(
      { weight: 70, water: 2, sleep: null, workout: null },
      'Nov 6, 6:00 PM',
    );
    await addJournalEntryToDB({
      id: 'dashboard-journal-private',
      content: 'Private journal text must not be surfaced in the overview.',
      createdAt: '2026-11-05T10:00:00.000Z',
    });
    await saveLifeProfileToDB({
      id: 'current',
      name: 'Atlas User',
      dateOfBirth: '2000-02-29',
      occupation: 'Engineer',
      updatedAt: '2026-11-06T00:00:00.000Z',
    });
    await saveLifeDimensionToDB({
      id: 'dashboard-custom-dimension',
      name: 'Community',
      description: 'Custom dimension',
      isBuiltIn: false,
      isActive: true,
      position: 0,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    });
    await saveLifeAttributeDefinitionToDB({
      id: 'dashboard-attribute',
      dimensionId: 'dashboard-custom-dimension',
      name: 'Contribution',
      kind: 'measurement',
      valueType: 'counter',
      unit: 'items',
      priority: 'medium',
      isBuiltIn: false,
      isActive: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'dashboard-entry-a',
      attributeId: 'dashboard-attribute',
      recordedAt: '2026-11-02T00:00:00.000Z',
      value: 2,
      isValid: true,
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'dashboard-entry-z',
      attributeId: 'dashboard-attribute',
      recordedAt: '2026-11-02T00:00:00.000Z',
      value: 3,
      isValid: true,
      createdAt: '2026-11-02T00:00:00.000Z',
    });
    await addLifeAttributeEntryToDB({
      id: 'dashboard-entry-backdated',
      attributeId: 'dashboard-attribute',
      recordedAt: '2026-10-02T00:00:00.000Z',
      value: 1,
      isValid: true,
      createdAt: '2026-11-03T00:00:00.000Z',
    });
    await addIdealTargetRevisionToDB({
      id: 'dashboard-target-a',
      attributeId: 'dashboard-attribute',
      targetValue: 6,
      priority: 'medium',
      createdAt: '2026-11-04T00:00:00.000Z',
    });
    await addIdealTargetRevisionToDB({
      id: 'dashboard-target-z',
      attributeId: 'dashboard-attribute',
      targetValue: 7,
      priority: 'medium',
      createdAt: '2026-11-04T00:00:00.000Z',
    });
    await invalidateLifeAttributeEntryInDB('dashboard-entry-z', '2026-11-06T00:00:00.000Z', 'Test invalidation');
    await saveLifeAttributeDefinitionToDB({
      id: 'dashboard-attribute',
      dimensionId: 'dashboard-custom-dimension',
      name: 'Contribution',
      kind: 'measurement',
      valueType: 'counter',
      unit: 'items',
      priority: 'medium',
      isBuiltIn: false,
      isActive: false,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-06T00:00:00.000Z',
    });

    const attributeState = await getLifeDashboardAttributeStateFromDB();
    const snapshot = await loadLifeDashboardSnapshot();
    const dimension = snapshot.customDimensions.find(({ dimension: item }) => item.id === 'dashboard-custom-dimension');
    const attribute = dimension?.attributes.find(({ definition }) => definition.id === 'dashboard-attribute');

    expect(attributeState.entries).toEqual([expect.objectContaining({ id: 'dashboard-entry-a', value: 2 })]);
    expect(attributeState.targets).toEqual([expect.objectContaining({ id: 'dashboard-target-z', targetValue: 7 })]);
    expect(attribute).toMatchObject({
      definition: { isActive: false },
      currentEntry: { id: 'dashboard-entry-a', value: 2 },
      currentTarget: { id: 'dashboard-target-z', targetValue: 7 },
    });
    expect(snapshot.profile).toMatchObject({ name: 'Atlas User', dateOfBirth: '2000-02-29' });
    expect(snapshot.healthSnapshot?.health).toMatchObject({ weight: 70, water: 2 });
    expect(snapshot.savings).toEqual({ ledgerBalance: 17, entryCount: 2 });
    expect(snapshot.journal).toEqual({ entryCount: 1, latestEntryAt: '2026-11-05T10:00:00.000Z' });
    expect(await getJournalDashboardSummaryFromDB()).not.toHaveProperty('content');
    expect((await getPersonalityCharacterPreviewFromDB()).examples).toEqual([]);
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
