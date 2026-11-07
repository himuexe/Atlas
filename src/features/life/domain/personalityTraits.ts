import { normalizeLifeTimestamp } from './types';

export const traitImportanceLevels = ['low', 'medium', 'high'] as const;
export type TraitImportance = typeof traitImportanceLevels[number];

export interface PersonalityTrait {
  id: string;
  isBuiltIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TraitDefinitionRevision {
  id: string;
  traitId: string;
  name: string;
  definition: string;
  description?: string;
  createdAt: string;
}

export interface TraitReflectionRevision {
  id: string;
  traitId: string;
  definitionRevisionId: string;
  currentExpression?: string;
  desiredExpression?: string;
  personalMeaning?: string;
  importance?: TraitImportance;
  developmentNotes?: string;
  createdAt: string;
}

export interface TraitExample {
  id: string;
  traitId: string;
  description: string;
  occurredOn: string;
  recordedAt: string;
  context?: string;
  updatedAt: string;
}

export interface PersonalityCharacterSnapshot {
  traits: PersonalityTrait[];
  definitions: TraitDefinitionRevision[];
  reflections: TraitReflectionRevision[];
  examples: TraitExample[];
}

export interface BuiltInTraitSeed {
  id: string;
  name: string;
  definition: string;
  description: string;
}

export const builtInPersonalityTraits: readonly BuiltInTraitSeed[] = [
  { id: 'integrity', name: 'Integrity', definition: 'Acting in alignment with considered principles and commitments, including when it is inconvenient.', description: 'Personal integrity can include recognizing when your principles are in tension and choosing thoughtfully.' },
  { id: 'honesty', name: 'Honesty', definition: 'Representing what you believe to be true faithfully, including acknowledging uncertainty or mistakes.', description: 'Honesty is about truthful representation, not bluntness or sharing every private thought.' },
  { id: 'courage', name: 'Courage', definition: 'Choosing to face meaningful difficulty, risk, or discomfort despite fear.', description: 'Courage is not the absence of fear, and what deserves courage is personal and contextual.' },
  { id: 'empathy', name: 'Empathy', definition: 'Trying to understand another person’s perspective and emotional experience.', description: 'Understanding someone’s perspective does not require agreeing with them.' },
  { id: 'compassion', name: 'Compassion', definition: 'Responding to suffering or need with care and a willingness to help where appropriate.', description: 'Compassion can include care for yourself and respect for healthy boundaries.' },
  { id: 'discipline', name: 'Discipline', definition: 'Directing attention and choices toward intentions despite distraction or short-term resistance.', description: 'This is a reflection on personal choices, not a measure of activity completion.' },
  { id: 'curiosity', name: 'Curiosity', definition: 'Seeking to understand, explore, and ask questions with openness.', description: 'Curiosity can be quiet and private; it does not require constant novelty.' },
  { id: 'ambition', name: 'Ambition', definition: 'Caring about pursuing meaningful aims or growth in a way that fits your values.', description: 'More ambition is not inherently better; its direction and balance are personal.' },
  { id: 'patience', name: 'Patience', definition: 'Allowing time, uncertainty, or delay without unnecessary reactivity.', description: 'Patience does not mean accepting harmful circumstances or avoiding needed action.' },
  { id: 'resilience', name: 'Resilience', definition: 'Finding ways to recover, adapt, or continue after difficulty.', description: 'Resilience does not require enduring harm or coping without support.' },
  { id: 'adaptability', name: 'Adaptability', definition: 'Adjusting plans or approaches when circumstances change.', description: 'Adaptability can coexist with stable principles and boundaries.' },
  { id: 'independence', name: 'Independence', definition: 'Exercising self-direction and judgment while recognizing the value of interdependence.', description: 'Independence is not a requirement to do everything alone.' },
  { id: 'generosity', name: 'Generosity', definition: 'Offering care, attention, knowledge, time, or resources within personally sustainable limits.', description: 'Generosity can take many forms and should not require self-neglect.' },
  { id: 'humility', name: 'Humility', definition: 'Holding a grounded view of yourself and remaining open to learning or correction.', description: 'Humility does not mean diminishing your needs, abilities, or accomplishments.' },
  { id: 'accountability', name: 'Accountability', definition: 'Taking ownership of your choices and their effects, including making amends where appropriate.', description: 'Accountability includes context and repair, not automatic self-blame.' },
  { id: 'reliability', name: 'Reliability', definition: 'Following through on commitments or communicating when they cannot be kept.', description: 'Reliability includes setting realistic commitments and being clear when plans change.' },
  { id: 'open-mindedness', name: 'Open-mindedness', definition: 'Considering unfamiliar views or evidence fairly without requiring agreement.', description: 'Being open-minded does not mean abandoning discernment or personal boundaries.' },
  { id: 'creativity', name: 'Creativity', definition: 'Bringing imagination and original approaches to expression or problem-solving.', description: 'Creativity is a way of approaching things, not a count of completed output.' },
  { id: 'wisdom', name: 'Wisdom', definition: 'Applying judgment with attention to context, consequences, uncertainty, and what matters.', description: 'Wisdom is personal and contextual, not a score or fixed endpoint.' },
] as const;

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
  return value.trim();
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`);
  return value.trim() || undefined;
}

function normalizeImportance(value: unknown): TraitImportance | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' && traitImportanceLevels.includes(value as TraitImportance)) {
    return value as TraitImportance;
  }
  throw new Error('Trait importance must be low, medium, or high.');
}

export function normalizeTraitDefinition(definition: TraitDefinitionRevision): TraitDefinitionRevision {
  return {
    id: requiredText(definition.id, 'Trait definition ID'),
    traitId: requiredText(definition.traitId, 'Trait ID'),
    name: requiredText(definition.name, 'Trait name'),
    definition: requiredText(definition.definition, 'Trait definition'),
    description: optionalText(definition.description, 'Trait description'),
    createdAt: normalizeLifeTimestamp(definition.createdAt, 'Trait definition createdAt'),
  };
}

export function normalizeTraitReflection(reflection: TraitReflectionRevision): TraitReflectionRevision {
  const normalized: TraitReflectionRevision = {
    id: requiredText(reflection.id, 'Trait reflection ID'),
    traitId: requiredText(reflection.traitId, 'Trait ID'),
    definitionRevisionId: requiredText(reflection.definitionRevisionId, 'Trait definition revision ID'),
    currentExpression: optionalText(reflection.currentExpression, 'Current expression'),
    desiredExpression: optionalText(reflection.desiredExpression, 'Desired expression'),
    personalMeaning: optionalText(reflection.personalMeaning, 'Personal meaning'),
    importance: normalizeImportance(reflection.importance),
    developmentNotes: optionalText(reflection.developmentNotes, 'Development notes'),
    createdAt: normalizeLifeTimestamp(reflection.createdAt, 'Trait reflection createdAt'),
  };
  if (!normalized.currentExpression && !normalized.desiredExpression && !normalized.personalMeaning && !normalized.developmentNotes && !normalized.importance) {
    throw new Error('Add a reflection, importance, or development note before saving.');
  }
  return normalized;
}

export function normalizeTraitExample(example: TraitExample): TraitExample {
  const occurredOn = requiredText(example.occurredOn, 'Example occurrence date');
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(occurredOn);
  const year = Number(dateMatch?.[1]);
  const month = Number(dateMatch?.[2]);
  const day = Number(dateMatch?.[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (!dateMatch || month < 1 || month > 12 || day < 1 || day > (daysPerMonth[month - 1] ?? 0)) {
    throw new Error('Example occurrence date must be a valid ISO calendar date.');
  }
  return {
    id: requiredText(example.id, 'Trait example ID'),
    traitId: requiredText(example.traitId, 'Trait ID'),
    description: requiredText(example.description, 'Example description'),
    occurredOn,
    recordedAt: normalizeLifeTimestamp(example.recordedAt, 'Example recordedAt'),
    context: optionalText(example.context, 'Example context'),
    updatedAt: normalizeLifeTimestamp(example.updatedAt, 'Example updatedAt'),
  };
}
