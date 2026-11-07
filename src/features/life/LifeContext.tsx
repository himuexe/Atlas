import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type {
  AttributeDefinition,
  LifeCurrentSelf,
  LifeDimension,
  LifeIdealSelfRevision,
  LifePersonalValue,
  LifeProfile,
} from './domain/types';
import {
  createLifeIdealSelfRevision,
  deleteLifePersonalValue,
  loadLifeFoundation,
  saveLifeAttributeDefinition,
  saveLifeCurrentSelf,
  saveLifeDimension,
  saveLifePersonalValue,
  saveLifeProfile,
} from './persistence/lifeRepository';

interface LifeContextValue {
  profile: LifeProfile | null;
  currentSelf: LifeCurrentSelf | null;
  idealSelf: LifeIdealSelfRevision | null;
  idealSelfHistory: LifeIdealSelfRevision[];
  personalValues: LifePersonalValue[];
  dimensions: LifeDimension[];
  attributes: AttributeDefinition[];
  isLoading: boolean;
  loadError: string | null;
  updateProfile: (profile: LifeProfile) => Promise<void>;
  updateCurrentSelf: (currentSelf: LifeCurrentSelf) => Promise<void>;
  addIdealSelfRevision: (revision: LifeIdealSelfRevision) => Promise<void>;
  upsertPersonalValue: (value: LifePersonalValue) => Promise<void>;
  removePersonalValue: (id: string) => Promise<void>;
  saveDimension: (dimension: LifeDimension) => Promise<void>;
  saveAttribute: (attribute: AttributeDefinition) => Promise<void>;
}

const LifeContext = createContext<LifeContextValue | null>(null);

export function LifeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LifeContextValue>({
    profile: null,
    currentSelf: null,
    idealSelf: null,
    idealSelfHistory: [],
    personalValues: [],
    dimensions: [],
    attributes: [],
    isLoading: true,
    loadError: null,
    updateProfile: async () => undefined,
    updateCurrentSelf: async () => undefined,
    addIdealSelfRevision: async () => undefined,
    upsertPersonalValue: async () => undefined,
    removePersonalValue: async () => undefined,
    saveDimension: async () => undefined,
    saveAttribute: async () => undefined,
  });

  useEffect(() => {
    let mounted = true;
    void loadLifeFoundation()
      .then((snapshot) => {
        if (mounted) setState((current) => ({ ...current, ...snapshot, isLoading: false }));
      })
      .catch((error) => {
        console.error('Failed to load Life foundation', error);
        if (mounted) setState((current) => ({ ...current, isLoading: false, loadError: 'Life could not be loaded from local storage.' }));
      });
    return () => { mounted = false; };
  }, []);

  const updateProfile = async (profile: LifeProfile) => {
    await saveLifeProfile(profile);
    setState((current) => ({ ...current, profile }));
  };
  const updateCurrentSelf = async (currentSelf: LifeCurrentSelf) => {
    await saveLifeCurrentSelf(currentSelf);
    setState((current) => ({ ...current, currentSelf }));
  };
  const addIdealSelfRevision = async (revision: LifeIdealSelfRevision) => {
    await createLifeIdealSelfRevision(revision);
    setState((current) => {
      const idealSelfHistory = [...current.idealSelfHistory, revision]
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
      return { ...current, idealSelf: idealSelfHistory[idealSelfHistory.length - 1] ?? revision, idealSelfHistory };
    });
  };
  const upsertPersonalValue = async (value: LifePersonalValue) => {
    await saveLifePersonalValue(value);
    setState((current) => ({
      ...current,
      personalValues: current.personalValues.some((item) => item.id === value.id)
        ? current.personalValues.map((item) => item.id === value.id ? value : item)
        : [...current.personalValues, value].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)),
    }));
  };
  const removePersonalValue = async (id: string) => {
    await deleteLifePersonalValue(id);
    setState((current) => ({ ...current, personalValues: current.personalValues.filter((value) => value.id !== id) }));
  };
  const saveDimension = async (dimension: LifeDimension) => {
    await saveLifeDimension(dimension);
    setState((current) => ({
      ...current,
      dimensions: current.dimensions.some((item) => item.id === dimension.id)
        ? current.dimensions.map((item) => item.id === dimension.id ? dimension : item)
        : [...current.dimensions, dimension],
    }));
    if (!dimension.isActive) {
      setState((current) => ({
        ...current,
        attributes: current.attributes.map((attribute) =>
          attribute.dimensionId === dimension.id && !attribute.isBuiltIn
            ? { ...attribute, isActive: false }
            : attribute,
        ),
      }));
    }
  };
  const saveAttribute = async (attribute: AttributeDefinition) => {
    await saveLifeAttributeDefinition(attribute);
    setState((current) => ({
      ...current,
      attributes: current.attributes.some((item) => item.id === attribute.id)
        ? current.attributes.map((item) => item.id === attribute.id ? attribute : item)
        : [...current.attributes, attribute],
    }));
  };

  return (
    <LifeContext.Provider value={{
      ...state,
      updateProfile,
      updateCurrentSelf,
      addIdealSelfRevision,
      upsertPersonalValue,
      removePersonalValue,
      saveDimension,
      saveAttribute,
    }}>
      {children}
    </LifeContext.Provider>
  );
}

export function useLifeContext(): LifeContextValue {
  const context = useContext(LifeContext);
  if (!context) throw new Error('useLifeContext must be used within a LifeProvider');
  return context;
}
