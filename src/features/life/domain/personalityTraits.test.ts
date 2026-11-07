import { describe, expect, it } from 'vitest';
import {
  builtInPersonalityTraits,
  normalizeTraitDefinition,
  normalizeTraitExample,
  normalizeTraitReflection,
} from './personalityTraits';

describe('personality and character traits', () => {
  it('defines the approved optional starter catalogue with unique stable identifiers', () => {
    expect(builtInPersonalityTraits.map(({ name }) => name)).toEqual([
      'Integrity', 'Honesty', 'Courage', 'Empathy', 'Compassion', 'Discipline', 'Curiosity',
      'Ambition', 'Patience', 'Resilience', 'Adaptability', 'Independence', 'Generosity',
      'Humility', 'Accountability', 'Reliability', 'Open-mindedness', 'Creativity', 'Wisdom',
    ]);
    expect(new Set(builtInPersonalityTraits.map(({ id }) => id)).size).toBe(19);
    expect(builtInPersonalityTraits.every(({ definition, description }) => definition && description)).toBe(true);
  });

  it('normalizes trait definitions without requiring a description', () => {
    expect(normalizeTraitDefinition({
      id: 'definition-1',
      traitId: 'trait-1',
      name: '  Care  ',
      definition: '  Offer care thoughtfully. ',
      createdAt: '2026-11-01T00:00:00+00:00',
    })).toEqual({
      id: 'definition-1',
      traitId: 'trait-1',
      name: 'Care',
      definition: 'Offer care thoughtfully.',
      description: undefined,
      createdAt: '2026-11-01T00:00:00.000Z',
    });
    expect(() => normalizeTraitDefinition({
      id: 'definition-2',
      traitId: 'trait-1',
      name: ' ',
      definition: 'A definition.',
      createdAt: '2026-11-01T00:00:00Z',
    })).toThrow(/name must be a non-empty/);
  });

  it('accepts optional narrative fields and supported importance, but not empty or invalid reflections', () => {
    expect(normalizeTraitReflection({
      id: 'reflection-1',
      traitId: 'trait-1',
      definitionRevisionId: 'definition-1',
      desiredExpression: 'More willing to ask for help.',
      importance: 'medium',
      createdAt: '2026-11-02T00:00:00Z',
    })).toMatchObject({
      desiredExpression: 'More willing to ask for help.',
      importance: 'medium',
    });
    expect(() => normalizeTraitReflection({
      id: 'reflection-empty',
      traitId: 'trait-1',
      definitionRevisionId: 'definition-1',
      createdAt: '2026-11-02T00:00:00Z',
    })).toThrow(/Add a reflection/);
    expect(() => normalizeTraitReflection({
      id: 'reflection-invalid',
      traitId: 'trait-1',
      definitionRevisionId: 'definition-1',
      importance: 'urgent' as never,
      createdAt: '2026-11-02T00:00:00Z',
    })).toThrow(/importance/);
  });

  it('validates occurrence dates independently from recording timestamps', () => {
    expect(normalizeTraitExample({
      id: 'example-1',
      traitId: 'trait-1',
      description: 'I reconsidered my first reaction.',
      occurredOn: '2026-11-02',
      recordedAt: '2026-11-05T00:00:00Z',
      updatedAt: '2026-11-05T00:00:00Z',
    })).toMatchObject({ occurredOn: '2026-11-02', recordedAt: '2026-11-05T00:00:00.000Z' });
    expect(() => normalizeTraitExample({
      id: 'example-invalid-date',
      traitId: 'trait-1',
      description: 'A moment.',
      occurredOn: '2026-02-31',
      recordedAt: '2026-11-05T00:00:00Z',
      updatedAt: '2026-11-05T00:00:00Z',
    })).toThrow(/valid ISO calendar date/);
  });
});
