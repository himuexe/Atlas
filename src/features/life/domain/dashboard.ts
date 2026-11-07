import { builtInLifeDimensions } from './dimensions';
import type {
  AttributeDefinition,
  AttributeEntry,
  IdealTargetRevision,
  LifeCurrentSelf,
  LifeDimension,
  LifeIdealSelfRevision,
  LifePersonalValue,
  LifeProfile,
} from './types';
import type { PersonalityCharacterSnapshot, TraitReflectionRevision } from './personalityTraits';
import type { HealthMetricEntry, HealthMetricKey, HealthSnapshot } from '../../health/types';

export interface LifeDashboardAttribute {
  definition: AttributeDefinition;
  currentEntry: AttributeEntry | null;
  currentTarget: IdealTargetRevision | null;
}

export interface LifeDashboardDimension {
  dimension: LifeDimension;
  attributes: LifeDashboardAttribute[];
}

export interface LifeDashboardSource {
  profile: LifeProfile | null;
  currentSelf: LifeCurrentSelf | null;
  idealSelf: LifeIdealSelfRevision | null;
  dimensions: LifeDimension[];
  attributes: AttributeDefinition[];
  entries: AttributeEntry[];
  targets: IdealTargetRevision[];
  personalValues: LifePersonalValue[];
  personality: PersonalityCharacterSnapshot;
  healthSnapshot: {
    health: HealthSnapshot;
    metrics: Record<HealthMetricKey, HealthMetricEntry[]>;
    lastUpdated: string;
  } | null;
  savingsEntries: Array<{ amount: number; category: 'income' | 'expense' | 'savings' }>;
  journal: {
    entryCount: number;
    latestEntryAt: string | null;
  };
}

export interface LifeDashboardSnapshot {
  profile: LifeProfile | null;
  currentSelf: LifeCurrentSelf | null;
  idealSelf: LifeIdealSelfRevision | null;
  canonicalDimensions: LifeDashboardDimension[];
  customDimensions: LifeDashboardDimension[];
  personalValues: LifePersonalValue[];
  reflectedTraits: Array<{
    id: string;
    name: string;
    reflection: TraitReflectionRevision;
  }>;
  healthSnapshot: LifeDashboardSource['healthSnapshot'];
  savings: {
    ledgerBalance: number;
    entryCount: number;
  };
  journal: {
    entryCount: number;
    latestEntryAt: string | null;
  };
}

function compareRevision(left: { createdAt: string; id: string }, right: { createdAt: string; id: string }): number {
  const timestampOrder = Date.parse(left.createdAt) - Date.parse(right.createdAt);
  if (timestampOrder) return timestampOrder;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

export function calculateAge(dateOfBirth: string | undefined, today: Date): number | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  if (
    year > currentYear ||
    (year === currentYear && month - 1 > currentMonth) ||
    (year === currentYear && month - 1 === currentMonth && day > currentDay)
  ) return null;

  let age = currentYear - year;
  if (currentMonth < month - 1 || (currentMonth === month - 1 && currentDay < day)) age -= 1;
  return age;
}

function currentRevisionByTrait<T extends { traitId: string; createdAt: string; id: string }>(
  revisions: T[],
): Map<string, T> {
  const current = new Map<string, T>();
  for (const revision of revisions) {
    const previous = current.get(revision.traitId);
    if (!previous || compareRevision(previous, revision) < 0) current.set(revision.traitId, revision);
  }
  return current;
}

export function buildLifeDashboardSnapshot(source: LifeDashboardSource): LifeDashboardSnapshot {
  const entries = new Map(source.entries.map((entry) => [entry.attributeId, entry]));
  const targets = new Map(source.targets.map((target) => [target.attributeId, target]));
  const storedDimensions = [
    ...source.dimensions,
    ...builtInLifeDimensions
      .filter((dimension) => !source.dimensions.some((stored) => stored.id === dimension.id))
      .map((dimension, position): LifeDimension => ({
        ...dimension,
        isBuiltIn: true,
        isActive: true,
        position,
        createdAt: '',
        updatedAt: '',
      })),
  ];
  const orderedDimensions = [
    ...builtInLifeDimensions.flatMap((builtIn) => {
      const dimension = storedDimensions.find((candidate) => candidate.id === builtIn.id);
      return dimension ? [dimension] : [];
    }),
    ...source.dimensions
      .filter((dimension) => !dimension.isBuiltIn && !builtInLifeDimensions.some((builtIn) => builtIn.id === dimension.id))
      .sort((left, right) => left.position - right.position || left.name.localeCompare(right.name)),
  ];
  const dimensions = orderedDimensions.map((dimension) => ({
    dimension,
    attributes: source.attributes
      .filter((attribute) => attribute.dimensionId === dimension.id)
      .sort((left, right) => Number(right.isBuiltIn) - Number(left.isBuiltIn) || left.name.localeCompare(right.name))
      .map((definition) => ({
        definition,
        currentEntry: entries.get(definition.id) ?? null,
        currentTarget: targets.get(definition.id) ?? null,
      })),
  }));
  const currentDefinitions = currentRevisionByTrait(source.personality.definitions);
  const currentReflections = currentRevisionByTrait(source.personality.reflections);
  const reflectedTraits = source.personality.traits
    .filter((trait) => trait.isActive)
    .flatMap((trait) => {
      const reflection = currentReflections.get(trait.id);
      const definition = currentDefinitions.get(trait.id);
      return reflection && definition ? [{ id: trait.id, name: definition.name, reflection }] : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    profile: source.profile,
    currentSelf: source.currentSelf,
    idealSelf: source.idealSelf,
    canonicalDimensions: dimensions.filter(({ dimension }) => builtInLifeDimensions.some((item) => item.id === dimension.id)),
    customDimensions: dimensions.filter(({ dimension }) =>
      !builtInLifeDimensions.some((builtIn) => builtIn.id === dimension.id)),
    personalValues: source.personalValues,
    reflectedTraits,
    healthSnapshot: source.healthSnapshot,
    savings: {
      ledgerBalance: source.savingsEntries.reduce((balance, entry) =>
        balance + (entry.category === 'expense' ? -Math.abs(entry.amount) : Math.abs(entry.amount)), 0),
      entryCount: source.savingsEntries.length,
    },
    journal: source.journal,
  };
}
