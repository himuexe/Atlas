import {
  addLifeIdealSelfRevisionToDB,
  addTraitDefinitionRevisionToDB,
  addTraitReflectionRevisionToDB,
  addIdealTargetRevisionToDB,
  addLifeAttributeEntryToDB,
  correctLifeAttributeEntryInDB,
  deleteLifePersonalValueFromDB,
  deleteLifeReflectionFromDB,
  deleteTraitExampleFromDB,
  createCustomPersonalityTrait,
  getCurrentIdealTargetRevisionFromDB,
  getCurrentLifeIdealSelfFromDB,
  getCurrentLifeAttributeEntryFromDB,
  getHealthSnapshotFromDB,
  getJournalDashboardSummaryFromDB,
  getLifeCurrentSelfFromDB,
  getLifeDashboardAttributeStateFromDB,
  getLifeAttributeDefinitionsFromDB,
  getLifeAttributeEntriesFromDB,
  getLifeDimensionsFromDB,
  getIdealTargetRevisionsFromDB,
  getLifeIdealSelfRevisionsFromDB,
  getLifePersonalValuesFromDB,
  getPersonalityCharacterFromDB,
  getLifeProfileFromDB,
  getLifeReflectionsFromDB,
  getPersonalityCharacterPreviewFromDB,
  getSavingsEntriesFromDB,
  invalidateLifeAttributeEntryInDB,
  saveLifeAttributeDefinitionToDB,
  saveLifeCurrentSelfToDB,
  saveLifeDimensionToDB,
  saveLifePersonalValueToDB,
  saveLifeProfileToDB,
  saveLifeReflectionToDB,
  saveTraitExampleToDB,
  setCustomPersonalityTraitActive,
} from '../../../lib/persistence/sqlite';
import { buildLifeDashboardSnapshot, type LifeDashboardSnapshot } from '../domain/dashboard';
import type {
  AttributeDefinition,
  AttributeEntry,
  IdealTargetRevision,
  LifeCurrentSelf,
  LifeDimension,
  LifeIdealSelfRevision,
  LifePersonalValue,
  LifeProfile,
  LifeReflection,
} from '../domain/types';
import type {
  PersonalityCharacterSnapshot,
  PersonalityTrait,
  TraitDefinitionRevision,
  TraitExample,
  TraitReflectionRevision,
} from '../domain/personalityTraits';

export interface LifeFoundationSnapshot {
  profile: LifeProfile | null;
  currentSelf: LifeCurrentSelf | null;
  idealSelf: LifeIdealSelfRevision | null;
  idealSelfHistory: LifeIdealSelfRevision[];
  personalValues: LifePersonalValue[];
  dimensions: LifeDimension[];
  attributes: AttributeDefinition[];
}

export interface LifeAttributeDetailSnapshot {
  currentEntry: AttributeEntry | null;
  entries: AttributeEntry[];
  currentTarget: IdealTargetRevision | null;
  targetHistory: IdealTargetRevision[];
}

/** Keeps Life's UI independent of the shared SQLite implementation. */
export async function loadLifeFoundation(): Promise<LifeFoundationSnapshot> {
  const [profile, currentSelf, idealSelf, idealSelfHistory, personalValues, dimensions, attributes] = await Promise.all([
    getLifeProfileFromDB(),
    getLifeCurrentSelfFromDB(),
    getCurrentLifeIdealSelfFromDB(),
    getLifeIdealSelfRevisionsFromDB(),
    getLifePersonalValuesFromDB(),
    getLifeDimensionsFromDB(),
    getLifeAttributeDefinitionsFromDB(),
  ]);
  return { profile, currentSelf, idealSelf, idealSelfHistory, personalValues, dimensions, attributes };
}

export async function loadLifeDashboardSnapshot(): Promise<LifeDashboardSnapshot> {
  const [
    profile,
    currentSelf,
    idealSelf,
    dimensions,
    attributes,
    attributeState,
    personalValues,
    personality,
    healthSnapshot,
    savingsEntries,
    journal,
  ] = await Promise.all([
    getLifeProfileFromDB(),
    getLifeCurrentSelfFromDB(),
    getCurrentLifeIdealSelfFromDB(),
    getLifeDimensionsFromDB(),
    getLifeAttributeDefinitionsFromDB(),
    getLifeDashboardAttributeStateFromDB(),
    getLifePersonalValuesFromDB(),
    getPersonalityCharacterPreviewFromDB(),
    getHealthSnapshotFromDB(),
    getSavingsEntriesFromDB(),
    getJournalDashboardSummaryFromDB(),
  ]);
  return buildLifeDashboardSnapshot({
    profile,
    currentSelf,
    idealSelf,
    dimensions,
    attributes,
    entries: attributeState.entries,
    targets: attributeState.targets,
    personalValues,
    personality,
    healthSnapshot,
    savingsEntries,
    journal,
  });
}

export async function loadLifeAttributeDetail(attributeId: string): Promise<LifeAttributeDetailSnapshot> {
  const [currentEntry, entries, currentTarget, targetHistory] = await Promise.all([
    getCurrentLifeAttributeEntryFromDB(attributeId),
    getLifeAttributeEntriesFromDB(attributeId),
    getCurrentIdealTargetRevisionFromDB(attributeId),
    getIdealTargetRevisionsFromDB(attributeId),
  ]);
  return { currentEntry, entries, currentTarget, targetHistory };
}

export async function recordLifeAttributeEntry(entry: AttributeEntry): Promise<void> {
  await addLifeAttributeEntryToDB(entry);
}

export async function correctLifeAttributeEntry(entryId: string, entry: AttributeEntry, reason: string): Promise<void> {
  await correctLifeAttributeEntryInDB(entryId, entry, reason);
}

export async function invalidateLifeAttributeEntry(entryId: string, invalidatedAt: string, reason: string): Promise<void> {
  await invalidateLifeAttributeEntryInDB(entryId, invalidatedAt, reason);
}

export async function saveLifeAttributeTarget(revision: IdealTargetRevision): Promise<void> {
  await addIdealTargetRevisionToDB(revision);
}

export async function saveLifeProfile(profile: LifeProfile): Promise<void> {
  await saveLifeProfileToDB(profile);
}

export async function saveLifeCurrentSelf(currentSelf: LifeCurrentSelf): Promise<void> {
  await saveLifeCurrentSelfToDB(currentSelf);
}

export async function createLifeIdealSelfRevision(revision: LifeIdealSelfRevision): Promise<void> {
  await addLifeIdealSelfRevisionToDB(revision);
}

export async function saveLifePersonalValue(value: LifePersonalValue): Promise<void> {
  await saveLifePersonalValueToDB(value);
}

export async function deleteLifePersonalValue(id: string): Promise<void> {
  await deleteLifePersonalValueFromDB(id);
}

export async function loadLifeReflections(): Promise<LifeReflection[]> {
  return getLifeReflectionsFromDB();
}

export async function saveLifeReflection(reflection: LifeReflection): Promise<void> {
  await saveLifeReflectionToDB(reflection);
}

export async function deleteLifeReflection(id: string): Promise<void> {
  await deleteLifeReflectionFromDB(id);
}

export async function saveLifeDimension(dimension: LifeDimension): Promise<void> {
  await saveLifeDimensionToDB(dimension);
}

export async function saveLifeAttributeDefinition(attribute: AttributeDefinition): Promise<void> {
  await saveLifeAttributeDefinitionToDB(attribute);
}

export async function loadPersonalityCharacter(): Promise<PersonalityCharacterSnapshot> {
  return getPersonalityCharacterFromDB();
}

export async function createPersonalityTrait(
  trait: PersonalityTrait,
  definition: TraitDefinitionRevision,
): Promise<void> {
  await createCustomPersonalityTrait(trait, definition);
}

export async function addPersonalityTraitDefinition(definition: TraitDefinitionRevision): Promise<void> {
  await addTraitDefinitionRevisionToDB(definition);
}

export async function setPersonalityTraitActive(id: string, isActive: boolean, updatedAt: string): Promise<void> {
  await setCustomPersonalityTraitActive(id, isActive, updatedAt);
}

export async function addPersonalityTraitReflection(reflection: TraitReflectionRevision): Promise<void> {
  await addTraitReflectionRevisionToDB(reflection);
}

export async function savePersonalityTraitExample(example: TraitExample): Promise<void> {
  await saveTraitExampleToDB(example);
}

export async function removePersonalityTraitExample(id: string): Promise<void> {
  await deleteTraitExampleFromDB(id);
}
