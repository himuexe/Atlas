import { describe, expect, it } from 'vitest';
import type { AttributeDefinition, LifeDimension } from './domain/types';
import { builtInLifeDimensions } from './domain/dimensions';
import { buildLifeDimensionExplorerItems } from './dimensionExplorerModel';

function attribute(
  id: string,
  dimensionId: string,
  isBuiltIn: boolean,
  name = id,
): AttributeDefinition {
  return {
    id,
    dimensionId,
    name,
    description: `${name} description`,
    kind: 'measurement',
    valueType: 'counter',
    unit: 'kg',
    priority: 'medium',
    isBuiltIn,
    isActive: true,
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
  };
}

function customDimension(): LifeDimension {
  return {
    id: 'custom-dimension',
    name: 'Time outdoors',
    description: 'The time and space spent outside.',
    isBuiltIn: false,
    isActive: true,
    position: 0,
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
  };
}

describe('Life dimension explorer model', () => {
  it('presents all twenty canonical dimensions with their descriptions', () => {
    const items = buildLifeDimensionExplorerItems([], []);

    expect(items).toHaveLength(20);
    expect(items.map(({ id }) => id)).toEqual(builtInLifeDimensions.map(({ id }) => id));
    expect(items.every(({ isBuiltIn, description }) => isBuiltIn && description.length > 0)).toBe(true);
  });

  it('associates built-in and custom attributes with the right dimension', () => {
    const builtInId = builtInLifeDimensions[0].id;
    const items = buildLifeDimensionExplorerItems(
      [customDimension()],
      [
        attribute('custom-health-note', builtInId, false, 'Personal note'),
        attribute('builtin-health-measure', builtInId, true, 'Body measure'),
        attribute('custom-outdoor-time', 'custom-dimension', false, 'Hours outside'),
      ],
    );
    const health = items.find(({ id }) => id === builtInId);
    const custom = items.find(({ id }) => id === 'custom-dimension');

    expect(health?.attributes.map(({ id }) => id)).toEqual(['builtin-health-measure', 'custom-health-note']);
    expect(custom).toMatchObject({
      name: 'Time outdoors',
      isBuiltIn: false,
      attributes: [expect.objectContaining({ id: 'custom-outdoor-time', isBuiltIn: false })],
    });
  });

  it('keeps the no-attributes state explicit for unconfigured dimensions', () => {
    const items = buildLifeDimensionExplorerItems([], []);

    expect(items.every(({ attributes }) => attributes.length === 0)).toBe(true);
    expect(items.find(({ id }) => id === 'family')?.attributes).toEqual([]);
  });
});
