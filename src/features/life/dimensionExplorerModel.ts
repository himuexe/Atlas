import { builtInLifeDimensions } from './domain/dimensions';
import type { AttributeDefinition, LifeDimension } from './domain/types';

export interface LifeDimensionExplorerItem {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  isActive: boolean;
  position: number;
  attributes: AttributeDefinition[];
}

export function buildLifeDimensionExplorerItems(
  dimensions: LifeDimension[],
  attributes: AttributeDefinition[],
): LifeDimensionExplorerItem[] {
  const builtInItems = builtInLifeDimensions.map((dimension, position) => ({
    ...dimension,
    isBuiltIn: true,
    isActive: true,
    position,
    attributes: attributes
      .filter((attribute) => attribute.dimensionId === dimension.id)
      .sort((left, right) => Number(right.isBuiltIn) - Number(left.isBuiltIn) || left.name.localeCompare(right.name)),
  }));
  const builtInIds = new Set(builtInLifeDimensions.map((dimension) => dimension.id));
  const customItems = dimensions
    .filter((dimension) => !dimension.isBuiltIn && !builtInIds.has(dimension.id))
    .sort((left, right) => left.position - right.position || left.name.localeCompare(right.name))
    .map((dimension) => ({
      id: dimension.id,
      name: dimension.name,
      description: dimension.description,
      isBuiltIn: false,
      isActive: dimension.isActive,
      position: dimension.position,
      attributes: attributes
        .filter((attribute) => attribute.dimensionId === dimension.id)
        .sort((left, right) => Number(right.isBuiltIn) - Number(left.isBuiltIn) || left.name.localeCompare(right.name)),
    }));

  return [...builtInItems, ...customItems];
}
