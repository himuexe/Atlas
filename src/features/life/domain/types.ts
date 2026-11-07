export const lifePriorities = ['high', 'medium', 'low', 'maintain'] as const;
export type LifePriority = typeof lifePriorities[number];

export const attributeValueTypes = ['numeric', 'rating', 'boolean', 'counter', 'frequency', 'milestone', 'narrative'] as const;
export type AttributeValueType = typeof attributeValueTypes[number];

export const attributeKinds = ['measurement', 'capability', 'subjective-assessment'] as const;
export type AttributeKind = typeof attributeKinds[number];

export interface LifeDimension {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= (daysByMonth[month - 1] ?? 0);
}

export interface LifeProfile {
  id: 'current';
  name?: string;
  dateOfBirth?: string;
  occupation?: string;
  education?: string;
  location?: string;
  description?: string;
  lifePhase?: string;
  currentCircumstances?: string;
  importantResponsibilities?: string;
  interests?: string;
  updatedAt: string;
}

export interface LifeCurrentSelf {
  id: 'current';
  physicalCondition?: string;
  careerSituation?: string;
  financialCircumstances?: string;
  knowledgeCapabilities?: string;
  relationshipsSocialLife?: string;
  habitsCharacter?: string;
  currentChallenges?: string;
  currentStrengths?: string;
  updatedAt: string;
}

export interface LifeIdealSelfRevision {
  id: string;
  narrative: string;
  createdAt: string;
}

export interface LifePersonalValue {
  id: string;
  name: string;
  description?: string;
  priority: LifePriority;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeDefinition {
  id: string;
  dimensionId: string;
  name: string;
  description?: string;
  kind: AttributeKind;
  valueType: AttributeValueType;
  unit?: string;
  priority: LifePriority;
  measurementFrequency?: string;
  assessmentMethodology?: string;
  measurementSource?: string;
  financialType?: 'net-worth' | 'income';
  isBuiltIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeEntry {
  id: string;
  attributeId: string;
  recordedAt: string;
  value: unknown;
  source?: string;
  note?: string;
  currency?: string;
  scope?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  isValid: boolean;
  createdAt: string;
  invalidatedAt?: string;
  invalidationReason?: string;
  correctsEntryId?: string;
}

export interface IdealTargetRevision {
  id: string;
  attributeId: string;
  targetValue?: unknown;
  currency?: string;
  scope?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  narrative?: string;
  reason?: string;
  successDefinition?: string;
  priority: LifePriority;
  createdAt: string;
  supersededAt?: string;
}

export interface ActivityAttributeLink {
  id: string;
  attributeId: string;
  activitySource: string;
  activityId: string;
  relationshipNote?: string;
  createdAt: string;
}

export interface LifeMilestone {
  id: string;
  title: string;
  description?: string;
  achievedAt?: string;
  evidence?: string;
  reflection?: string;
  createdAt: string;
}

export interface LifeReflection {
  id: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'annual' | 'multi-year' | 'custom';
  periodStart: string;
  periodEnd?: string;
  content: string;
  createdAt: string;
  modifiedAt?: string;
}

export interface LifeEvent {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  occurredAt: string;
  createdAt: string;
}

export function isLifePriority(value: unknown): value is LifePriority {
  return typeof value === 'string' && lifePriorities.includes(value as LifePriority);
}

export function isAttributeValueType(value: unknown): value is AttributeValueType {
  return typeof value === 'string' && attributeValueTypes.includes(value as AttributeValueType);
}

export function isAttributeKind(value: unknown): value is AttributeKind {
  return typeof value === 'string' && attributeKinds.includes(value as AttributeKind);
}

export function validateAttributeDefinition(
  input: Pick<AttributeDefinition, 'dimensionId' | 'name' | 'kind' | 'valueType' | 'priority'> &
    Partial<Pick<AttributeDefinition, 'unit' | 'financialType'>>,
): string[] {
  const errors: string[] = [];
  if (typeof input.dimensionId !== 'string' || !input.dimensionId.trim()) errors.push('An attribute must belong to a dimension.');
  if (typeof input.name !== 'string' || !input.name.trim()) errors.push('An attribute needs a name.');
  if (!isAttributeKind(input.kind)) errors.push('Attribute kind is invalid.');
  if (!isAttributeValueType(input.valueType)) errors.push('Attribute value type is invalid.');
  if (!isLifePriority(input.priority)) errors.push('Attribute priority is invalid.');
  if (isAttributeKind(input.kind) && isAttributeValueType(input.valueType)) {
    const compatible =
      (input.kind === 'measurement' && ['numeric', 'counter', 'frequency'].includes(input.valueType)) ||
      (input.kind === 'measurement' && input.valueType === 'milestone') ||
      (input.kind === 'capability' && input.valueType === 'boolean') ||
      (input.kind === 'capability' && input.valueType === 'narrative') ||
      (input.kind === 'subjective-assessment' && input.valueType === 'boolean') ||
      (input.kind === 'subjective-assessment' && (input.valueType === 'rating' || input.valueType === 'narrative'));
    if (!compatible) errors.push('Attribute category and measurement type are not compatible.');
  }
  if (input.unit !== undefined && typeof input.unit !== 'string') errors.push('Attribute unit must be a string.');
  else if (typeof input.unit === 'string' && input.unit.trim() && input.kind !== 'measurement') {
    errors.push('Only measurement attributes can define a unit.');
  }
  if (input.financialType !== undefined && input.financialType !== 'income' && input.financialType !== 'net-worth') {
    errors.push('Financial observation type is invalid.');
  }
  if (input.financialType && (input.kind !== 'measurement' || input.valueType !== 'numeric')) {
    errors.push('Financial observations must use numeric measurement values.');
  }
  return errors;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
  return value.trim();
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`);
  return value;
}

export function normalizeLifeTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} must be an ISO-8601 timestamp with an explicit timezone.`);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) throw new Error(`${field} must be an ISO-8601 timestamp with an explicit timezone.`);

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const daysInMonth = daysByMonth[month - 1] ?? 0;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59) {
    throw new Error(`${field} is not a valid calendar timestamp.`);
  }
  if (zone !== 'Z') {
    const offsetHours = Number(zone.slice(1, 3));
    const offsetMinutes = Number(zone.slice(4, 6));
    if (offsetHours > 23 || offsetMinutes > 59) throw new Error(`${field} has an invalid timezone offset.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`${field} is not a valid timestamp.`);
  return parsed.toISOString();
}

function normalizePriority(value: unknown, field: string): LifePriority {
  if (!isLifePriority(value)) throw new Error(`${field} is invalid.`);
  return value;
}

function normalizeValue(value: unknown, valueType: AttributeValueType, field: string): unknown {
  switch (valueType) {
    case 'numeric':
    case 'rating':
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a finite number.`);
      break;
    case 'counter':
    case 'frequency':
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative finite number.`);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean.`);
      break;
    case 'milestone':
    case 'narrative':
      requiredText(value, field);
      break;
  }
  return value;
}

export function normalizeLifeDimension(dimension: LifeDimension): LifeDimension {
  return {
    ...dimension,
    id: requiredText(dimension.id, 'Dimension ID'),
    name: requiredText(dimension.name, 'Dimension name'),
    description: typeof dimension.description === 'string' ? dimension.description : (() => { throw new Error('Dimension description must be a string.'); })(),
    isBuiltIn: typeof dimension.isBuiltIn === 'boolean' ? dimension.isBuiltIn : (() => { throw new Error('Dimension built-in flag must be boolean.'); })(),
    isActive: typeof dimension.isActive === 'boolean' ? dimension.isActive : (() => { throw new Error('Dimension active flag must be boolean.'); })(),
    position: Number.isInteger(dimension.position) && dimension.position >= 0 ? dimension.position : (() => { throw new Error('Dimension position must be a non-negative integer.'); })(),
    createdAt: normalizeLifeTimestamp(dimension.createdAt, 'Dimension createdAt'),
    updatedAt: normalizeLifeTimestamp(dimension.updatedAt, 'Dimension updatedAt'),
  };
}

export function normalizeLifeProfile(profile: LifeProfile): LifeProfile {
  if (profile.id !== 'current') throw new Error('Life profile ID must be current.');
  const dateOfBirth = optionalText(profile.dateOfBirth, 'Profile date of birth');
  if (dateOfBirth !== undefined && !isCalendarDate(dateOfBirth)) {
    throw new Error('Profile date of birth must be a valid ISO calendar date.');
  }
  return {
    ...profile,
    name: optionalText(profile.name, 'Profile name'),
    dateOfBirth,
    occupation: optionalText(profile.occupation, 'Profile occupation'),
    education: optionalText(profile.education, 'Profile education'),
    location: optionalText(profile.location, 'Profile location'),
    description: optionalText(profile.description, 'Profile description'),
    lifePhase: optionalText(profile.lifePhase, 'Profile life phase'),
    currentCircumstances: optionalText(profile.currentCircumstances, 'Profile current circumstances'),
    importantResponsibilities: optionalText(profile.importantResponsibilities, 'Profile responsibilities'),
    interests: optionalText(profile.interests, 'Profile interests'),
    updatedAt: normalizeLifeTimestamp(profile.updatedAt, 'Profile updatedAt'),
  };
}

const currentSelfFields = [
  'physicalCondition',
  'careerSituation',
  'financialCircumstances',
  'knowledgeCapabilities',
  'relationshipsSocialLife',
  'habitsCharacter',
  'currentChallenges',
  'currentStrengths',
] as const;

export function normalizeLifeCurrentSelf(currentSelf: LifeCurrentSelf): LifeCurrentSelf {
  if (currentSelf.id !== 'current') throw new Error('Current Self ID must be current.');
  const normalized: LifeCurrentSelf = {
    ...currentSelf,
    updatedAt: normalizeLifeTimestamp(currentSelf.updatedAt, 'Current Self updatedAt'),
  };
  for (const field of currentSelfFields) {
    normalized[field] = optionalText(currentSelf[field], `Current Self ${field}`);
  }
  return normalized;
}

export function normalizeLifeIdealSelfRevision(revision: LifeIdealSelfRevision): LifeIdealSelfRevision {
  return {
    ...revision,
    id: requiredText(revision.id, 'Ideal Self revision ID'),
    narrative: requiredText(revision.narrative, 'Ideal Self narrative'),
    createdAt: normalizeLifeTimestamp(revision.createdAt, 'Ideal Self createdAt'),
  };
}

export function normalizeLifePersonalValue(value: LifePersonalValue): LifePersonalValue {
  return {
    ...value,
    id: requiredText(value.id, 'Personal value ID'),
    name: requiredText(value.name, 'Personal value name'),
    description: optionalText(value.description, 'Personal value description'),
    priority: normalizePriority(value.priority, 'Personal value priority'),
    createdAt: normalizeLifeTimestamp(value.createdAt, 'Personal value createdAt'),
    updatedAt: normalizeLifeTimestamp(value.updatedAt, 'Personal value updatedAt'),
  };
}

export function normalizeAttributeDefinition(
  definition: AttributeDefinition,
  options: { allowUnchangedLegacyMetadata?: boolean } = {},
): AttributeDefinition {
  const errors = validateAttributeDefinition(definition);
  const validationErrors = options.allowUnchangedLegacyMetadata
    ? errors.filter((error) => !error.startsWith('Attribute category and measurement type'))
    : errors;
  if (validationErrors.length) throw new Error(validationErrors.join(' '));
  if (typeof definition.id !== 'string' || !definition.id.trim()) throw new Error('Attribute ID must be a non-empty string.');
  if (typeof definition.isBuiltIn !== 'boolean' || typeof definition.isActive !== 'boolean') throw new Error('Attribute flags must be boolean.');
  return {
    ...definition,
    id: definition.id.trim(),
    dimensionId: definition.dimensionId.trim(),
    name: definition.name.trim(),
    description: optionalText(definition.description, 'Attribute description'),
    unit: optionalText(definition.unit, 'Attribute unit')?.trim() || undefined,
    measurementFrequency: optionalText(definition.measurementFrequency, 'Measurement frequency')?.trim() || undefined,
    assessmentMethodology: optionalText(definition.assessmentMethodology, 'Assessment methodology'),
    measurementSource: optionalText(definition.measurementSource, 'Measurement source'),
    financialType: definition.financialType,
    createdAt: normalizeLifeTimestamp(definition.createdAt, 'Attribute createdAt'),
    updatedAt: normalizeLifeTimestamp(definition.updatedAt, 'Attribute updatedAt'),
  };
}

export function normalizeAttributeEntry(
  entry: AttributeEntry,
  valueType: AttributeValueType,
  options: { financialType?: AttributeDefinition['financialType'] } = {},
): AttributeEntry {
  if (typeof entry.isValid !== 'boolean') throw new Error('Entry validity flag must be boolean.');
  const currency = optionalText(entry.currency, 'Entry currency')?.trim().toUpperCase();
  const scope = optionalText(entry.scope, 'Entry scope')?.trim();
  const reportingPeriodStart = optionalText(entry.reportingPeriodStart, 'Entry reporting period start');
  const reportingPeriodEnd = optionalText(entry.reportingPeriodEnd, 'Entry reporting period end');
  if (options.financialType && (!currency || !/^[A-Z]{3}$/.test(currency))) {
    throw new Error('Financial observations require a three-letter currency code.');
  }
  if (options.financialType === 'income') {
    if (!scope) throw new Error('Income observations require an explicit scope.');
    if (!reportingPeriodStart || !isCalendarDate(reportingPeriodStart)) {
      throw new Error('Income observations require a valid reporting-period start date.');
    }
    if (!reportingPeriodEnd || !isCalendarDate(reportingPeriodEnd)) {
      throw new Error('Income observations require a valid reporting-period end date.');
    }
    if (reportingPeriodEnd < reportingPeriodStart) {
      throw new Error('Income reporting-period end cannot be before its start.');
    }
  } else if (scope || reportingPeriodStart || reportingPeriodEnd) {
    throw new Error('Reporting scope and period are only supported for income observations.');
  }
  if (!options.financialType && currency) throw new Error('Currency is only supported for financial observations.');
  return {
    ...entry,
    id: requiredText(entry.id, 'Entry ID'),
    attributeId: requiredText(entry.attributeId, 'Entry attributeId'),
    recordedAt: normalizeLifeTimestamp(entry.recordedAt, 'Entry recordedAt'),
    createdAt: normalizeLifeTimestamp(entry.createdAt, 'Entry createdAt'),
    value: normalizeValue(entry.value, valueType, 'Entry value'),
    currency,
    scope,
    reportingPeriodStart,
    reportingPeriodEnd,
    source: optionalText(entry.source, 'Entry source'),
    note: optionalText(entry.note, 'Entry note'),
    invalidatedAt: entry.invalidatedAt === undefined ? undefined : normalizeLifeTimestamp(entry.invalidatedAt, 'Entry invalidatedAt'),
    invalidationReason: optionalText(entry.invalidationReason, 'Entry invalidation reason'),
    correctsEntryId: entry.correctsEntryId === undefined ? undefined : requiredText(entry.correctsEntryId, 'Corrected entry ID'),
  };
}

export function normalizeIdealTargetRevision(
  revision: IdealTargetRevision,
  valueType: AttributeValueType,
  options: { financialType?: AttributeDefinition['financialType'] } = {},
): IdealTargetRevision {
  const narrative = optionalText(revision.narrative, 'Ideal Self narrative');
  if (revision.targetValue === undefined && !narrative?.trim()) throw new Error('An Ideal Self revision needs a target value or narrative.');
  const currency = optionalText(revision.currency, 'Ideal Self currency')?.trim().toUpperCase();
  const scope = optionalText(revision.scope, 'Ideal Self income scope')?.trim();
  const reportingPeriodStart = optionalText(revision.reportingPeriodStart, 'Ideal Self reporting-period start');
  const reportingPeriodEnd = optionalText(revision.reportingPeriodEnd, 'Ideal Self reporting-period end');
  if (revision.targetValue === undefined && (currency || scope || reportingPeriodStart || reportingPeriodEnd)) {
    throw new Error('Financial metadata requires a numeric Ideal Self target.');
  }
  if (revision.targetValue !== undefined && options.financialType && (!currency || !/^[A-Z]{3}$/.test(currency))) {
    throw new Error('Financial Ideal Self targets require a three-letter currency code.');
  }
  if (revision.targetValue !== undefined && options.financialType === 'income') {
    if (!scope) throw new Error('Income Ideal Self targets require an explicit scope.');
    if (!reportingPeriodStart || !isCalendarDate(reportingPeriodStart)) {
      throw new Error('Income Ideal Self targets require a valid reporting-period start date.');
    }
    if (!reportingPeriodEnd || !isCalendarDate(reportingPeriodEnd)) {
      throw new Error('Income Ideal Self targets require a valid reporting-period end date.');
    }
    if (reportingPeriodEnd < reportingPeriodStart) {
      throw new Error('Income Ideal Self reporting-period end cannot be before its start.');
    }
  } else if (scope || reportingPeriodStart || reportingPeriodEnd) {
    throw new Error('Reporting scope and period are only supported for income targets.');
  }
  if (!options.financialType && currency) throw new Error('Currency is only supported for financial targets.');
  return {
    ...revision,
    id: requiredText(revision.id, 'Ideal Self revision ID'),
    attributeId: requiredText(revision.attributeId, 'Ideal Self attributeId'),
    targetValue: revision.targetValue === undefined ? undefined : normalizeValue(revision.targetValue, valueType, 'Ideal Self target value'),
    currency,
    scope,
    reportingPeriodStart,
    reportingPeriodEnd,
    narrative,
    reason: optionalText(revision.reason, 'Ideal Self reason'),
    successDefinition: optionalText(revision.successDefinition, 'Ideal Self success definition'),
    priority: normalizePriority(revision.priority, 'Ideal Self priority'),
    createdAt: normalizeLifeTimestamp(revision.createdAt, 'Ideal Self createdAt'),
  };
}

export function normalizeActivityAttributeLink(link: ActivityAttributeLink): ActivityAttributeLink {
  return {
    ...link,
    id: requiredText(link.id, 'Activity link ID'),
    attributeId: requiredText(link.attributeId, 'Activity link attributeId'),
    activitySource: requiredText(link.activitySource, 'Activity source'),
    activityId: requiredText(link.activityId, 'Activity ID'),
    relationshipNote: optionalText(link.relationshipNote, 'Activity relationship note'),
    createdAt: normalizeLifeTimestamp(link.createdAt, 'Activity link createdAt'),
  };
}

export function normalizeLifeMilestone(milestone: LifeMilestone): LifeMilestone {
  return {
    ...milestone,
    id: requiredText(milestone.id, 'Milestone ID'),
    title: requiredText(milestone.title, 'Milestone title'),
    description: optionalText(milestone.description, 'Milestone description'),
    achievedAt: milestone.achievedAt === undefined ? undefined : normalizeLifeTimestamp(milestone.achievedAt, 'Milestone achievedAt'),
    evidence: optionalText(milestone.evidence, 'Milestone evidence'),
    reflection: optionalText(milestone.reflection, 'Milestone reflection'),
    createdAt: normalizeLifeTimestamp(milestone.createdAt, 'Milestone createdAt'),
  };
}

export function normalizeLifeReflection(reflection: LifeReflection): LifeReflection {
  const periodTypes = ['daily', 'weekly', 'monthly', 'annual', 'multi-year', 'custom'];
  if (!periodTypes.includes(reflection.periodType)) throw new Error('Reflection period type is invalid.');
  const periodStart = requiredText(reflection.periodStart, 'Reflection periodStart');
  if (!isCalendarDate(periodStart)) {
    throw new Error('Reflection periodStart must be an ISO calendar date.');
  }
  const periodEnd = optionalText(reflection.periodEnd, 'Reflection periodEnd');
  if (periodEnd !== undefined && !isCalendarDate(periodEnd)) {
    throw new Error('Reflection periodEnd must be an ISO calendar date.');
  }
  if (periodEnd && periodEnd < periodStart) throw new Error('Reflection periodEnd cannot be before periodStart.');
  if (reflection.periodType === 'multi-year' && (!periodEnd || Number(periodEnd.slice(0, 4)) - Number(periodStart.slice(0, 4)) < 2)) {
    throw new Error('A multi-year reflection must span at least two calendar years.');
  }
  return {
    ...reflection,
    id: requiredText(reflection.id, 'Reflection ID'),
    periodStart,
    periodEnd,
    content: requiredText(reflection.content, 'Reflection content'),
    createdAt: normalizeLifeTimestamp(reflection.createdAt, 'Reflection createdAt'),
    modifiedAt: normalizeLifeTimestamp(reflection.modifiedAt ?? reflection.createdAt, 'Reflection modifiedAt'),
  };
}

export function normalizeLifeEvent(event: LifeEvent): LifeEvent {
  return {
    ...event,
    id: requiredText(event.id, 'Event ID'),
    eventType: requiredText(event.eventType, 'Event type'),
    title: requiredText(event.title, 'Event title'),
    description: optionalText(event.description, 'Event description'),
    occurredAt: normalizeLifeTimestamp(event.occurredAt, 'Event occurredAt'),
    createdAt: normalizeLifeTimestamp(event.createdAt, 'Event createdAt'),
  };
}
