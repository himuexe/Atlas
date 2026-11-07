import { describe, expect, it } from 'vitest';
import { builtInLifeDimensions, createBuiltInLifeDimensions, LIFE_DIMENSIONS_VERSION } from './dimensions';
import { builtInLifeAttributes, createBuiltInLifeAttributes } from './builtInAttributes';
import { validateAttributeDefinition } from './types';

describe('Life domain foundation', () => {
  it('defines the 20 versioned built-in dimensions with stable IDs', () => {
    expect(LIFE_DIMENSIONS_VERSION).toBe(1);
    expect(builtInLifeDimensions).toHaveLength(20);
    expect(new Set(builtInLifeDimensions.map((dimension) => dimension.id)).size).toBe(20);
    expect(createBuiltInLifeDimensions('2026-11-06T00:00:00.000Z')[0]).toMatchObject({ id: 'physical-health', isBuiltIn: true, isActive: true });
  });

  it('validates the domain boundary for attribute definitions', () => {
    expect(validateAttributeDefinition({ dimensionId: '', name: '', kind: 'unknown' as never, valueType: 'other' as never, priority: 'urgent' as never })).toHaveLength(5);
    expect(validateAttributeDefinition({ dimensionId: 'physical-health', name: 'Creative works', kind: 'measurement', valueType: 'counter', priority: 'high', unit: 'works' })).toEqual([]);
    expect(validateAttributeDefinition({ dimensionId: 'physical-health', name: 'Invalid', kind: 'measurement', valueType: 'narrative', priority: 'high' })).toContain('Attribute category and measurement type are not compatible.');
    expect(validateAttributeDefinition({ dimensionId: 'physical-health', name: 'Invalid unit', kind: 'capability', valueType: 'narrative', priority: 'high', unit: 'sessions' })).toContain('Only measurement attributes can define a unit.');
  });

  it('defines an optional built-in catalogue with intentional coverage and no activity or milestone tracking', () => {
    const seeded = createBuiltInLifeAttributes('2026-11-06T00:00:00.000Z');
    expect(builtInLifeAttributes.length).toBeGreaterThan(20);
    expect(new Set(builtInLifeAttributes.map(({ id }) => id)).size).toBe(builtInLifeAttributes.length);
    expect(seeded.every(({ isBuiltIn, isActive }) => isBuiltIn && isActive)).toBe(true);
    expect(new Set(builtInLifeAttributes.map(({ dimensionId }) => dimensionId))).toEqual(
      new Set(builtInLifeDimensions.map(({ id }) => id)),
    );
    expect(builtInLifeAttributes.find(({ id }) => id === 'atlas.builtin.creative-works-completed')).toMatchObject({
      kind: 'measurement',
      valueType: 'counter',
      unit: 'works',
    });
    expect(builtInLifeAttributes.find(({ dimensionId }) => dimensionId === 'experiences-adventure')).toMatchObject({
      kind: 'subjective-assessment',
      valueType: 'narrative',
    });
    expect(builtInLifeAttributes.every(({ kind, valueType }) =>
      (kind === 'measurement' && (valueType === 'counter' || valueType === 'frequency')) ||
      (kind === 'measurement' && valueType === 'numeric') ||
      (kind === 'capability' && valueType === 'narrative') ||
      (kind === 'capability' && valueType === 'boolean') ||
      (kind === 'subjective-assessment' && (valueType === 'rating' || valueType === 'narrative')),
    )).toBe(true);
  });
});
