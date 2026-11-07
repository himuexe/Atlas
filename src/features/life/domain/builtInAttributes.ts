import type { AttributeDefinition, AttributeKind, AttributeValueType, LifePriority } from './types';

export interface BuiltInAttributeDefinition {
  id: string;
  dimensionId: string;
  name: string;
  description: string;
  rationale: string;
  kind: AttributeKind;
  valueType: AttributeValueType;
  unit?: string;
  measurementFrequency?: string;
  financialType?: AttributeDefinition['financialType'];
  priority: LifePriority;
}

export const builtInLifeAttributes: readonly BuiltInAttributeDefinition[] = [
  {
    id: 'atlas.builtin.physical-functional-capacity', dimensionId: 'physical-health',
    name: 'Functional capacity', description: 'How your body supports the everyday activities that matter to you.',
    rationale: 'Reflects practical physical capability without duplicating tracked health metrics.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.physical-wellbeing', dimensionId: 'physical-health',
    name: 'Perceived physical wellbeing', description: 'Your own overall sense of physical wellbeing.',
    rationale: 'Provides a subjective perspective that complements, rather than replaces, health records.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.cognition-reasoning', dimensionId: 'intelligence-cognition',
    name: 'Analytical reasoning', description: 'How you understand complex ideas, weigh evidence, and work through problems.',
    rationale: 'Focuses on an applied cognitive capability, not a claim about fixed intelligence.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.cognition-flexibility', dimensionId: 'intelligence-cognition',
    name: 'Cognitive flexibility', description: 'How you adapt your thinking when assumptions or circumstances change.',
    rationale: 'Adds a distinct capability alongside reasoning without counting learning activities.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.mental-emotional-regulation', dimensionId: 'mental-emotional-wellbeing',
    name: 'Emotional regulation', description: 'Your ability to notice, understand, and respond to emotions in ways that help you.',
    rationale: 'Describes a learnable capability without treating it as a diagnosis.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.mental-wellbeing', dimensionId: 'mental-emotional-wellbeing',
    name: 'Emotional wellbeing', description: 'Your personal sense of emotional steadiness and wellbeing.',
    rationale: 'Offers a subjective snapshot distinct from the capability of emotional regulation.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.happiness-life-satisfaction', dimensionId: 'happiness-life-satisfaction',
    name: 'Life satisfaction', description: 'How satisfied you feel with life as a whole, by your own definition.',
    rationale: 'A broad, optional reflection that anchors this dimension without fragmenting it into overlapping scores.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.family-connection', dimensionId: 'family',
    name: 'Family connection', description: 'Your own sense of care, connection, and belonging within your family relationships.',
    rationale: 'Centers the quality of connection rather than family structure or time spent.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.family-role-balance', dimensionId: 'family',
    name: 'Family role balance', description: 'How manageable and meaningful your chosen family responsibilities feel.',
    rationale: 'Separates personal role balance from the quality of family connection.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.romantic-relationship-wellbeing', dimensionId: 'romantic-relationships',
    name: 'Relationship wellbeing', description: 'Your personal experience of wellbeing in a romantic relationship, if applicable.',
    rationale: 'Keeps reflection optional and does not presume relationship status.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.romantic-communication-repair', dimensionId: 'romantic-relationships',
    name: 'Communication and repair', description: 'How you and a partner communicate, navigate disagreement, and reconnect, if applicable.',
    rationale: 'Names a practical relationship capability without rating another person.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: as useful', priority: 'medium',
  },
  {
    id: 'atlas.builtin.social-belonging', dimensionId: 'social-life-friendships',
    name: 'Sense of belonging', description: 'Your own sense of acceptance and connection in the communities you choose.',
    rationale: 'Reflects felt belonging without counting contacts or social events.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.social-support', dimensionId: 'social-life-friendships',
    name: 'Perceived social support', description: 'How supported you feel by the friendships and community in your life.',
    rationale: 'Locates support in broader social relationships; trust is not treated as a standalone reputation metric.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.career-alignment', dimensionId: 'career-professional-development',
    name: 'Career alignment', description: 'How well your current professional direction fits your values and priorities.',
    rationale: 'Reflects fit and meaning without assuming a particular employment path.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.career-capability', dimensionId: 'career-professional-development',
    name: 'Professional capability', description: 'The skills and strengths you bring to your work or chosen contribution.',
    rationale: 'Describes capability rather than activity volume, title, or status.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.wealth-financial-security', dimensionId: 'wealth-financial-health',
    name: 'Financial security', description: 'Your subjective sense of stability and security in your financial circumstances.',
    rationale: 'Explicitly captures felt security without copying balances or transactions from Savings.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.wealth-reported-net-worth', dimensionId: 'wealth-financial-health',
    name: 'User-reported net worth', description: 'A personal estimate of assets minus liabilities, in the currency and as-of date you provide.',
    rationale: 'A dated user-reported observation, not derived from Savings or an inventory managed by Atlas.',
    kind: 'measurement', valueType: 'numeric', financialType: 'net-worth', measurementFrequency: 'Optional review: as useful', priority: 'medium',
  },
  {
    id: 'atlas.builtin.wealth-reported-income', dimensionId: 'wealth-financial-health',
    name: 'User-reported income', description: 'Income for an explicitly stated period and scope, such as gross salary or take-home pay.',
    rationale: 'Keeps the reporting period and scope attached to each entry; Atlas does not infer a complete income total.',
    kind: 'measurement', valueType: 'numeric', financialType: 'income', measurementFrequency: 'Optional review: as useful', priority: 'medium',
  },
  {
    id: 'atlas.builtin.wealth-decision-making', dimensionId: 'wealth-financial-health',
    name: 'Financial decision-making', description: 'Your confidence and capability in making financial decisions that fit your circumstances.',
    rationale: 'Focuses on personal capability rather than collecting account details.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.assets-essentials', dimensionId: 'assets-possessions',
    name: 'Essential resource adequacy', description: 'Whether the resources and possessions important to daily life meet your needs.',
    rationale: 'Emphasizes sufficiency and needs rather than ownership or asset value.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.assets-stewardship', dimensionId: 'assets-possessions',
    name: 'Stewardship of possessions', description: 'How you care for and use the possessions you choose to keep.',
    rationale: 'Encourages intentional stewardship without rewarding accumulation.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.knowledge-application', dimensionId: 'knowledge-education',
    name: 'Knowledge and skill application', description: 'Knowledge or skills you can apply in areas that matter to you.',
    rationale: 'Captures applied learning without counting study sessions or requiring formal credentials.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.creativity-capability', dimensionId: 'creativity-expression',
    name: 'Creative capability', description: 'Creative skills, approaches, or forms of expression you are developing or using.',
    rationale: 'Describes ability and expression independently of the quantity of output.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.creative-works-completed', dimensionId: 'creativity-expression',
    name: 'Completed creative works', description: 'An optional count of finished creative works you choose to recognize; it does not measure creative ability or worth.',
    rationale: 'Retained only as an explicitly optional output counter, separate from creative capability.',
    kind: 'measurement', valueType: 'counter', unit: 'works', measurementFrequency: 'Optional review: as completed', priority: 'low',
  },
  {
    id: 'atlas.builtin.character-self-regulation', dimensionId: 'discipline-character',
    name: 'Self-regulation', description: 'How you manage attention, impulses, and responses in situations that matter to you.',
    rationale: 'Focuses on a developable capacity and avoids a duplicate consistency or commitment count.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.character-integrity', dimensionId: 'discipline-character',
    name: 'Integrity in action', description: 'How your choices reflect honesty, responsibility, and the principles you choose.',
    rationale: 'Distinct from self-regulation: it concerns values expressed in conduct, not consistency alone.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.influence-communication', dimensionId: 'influence-reputation',
    name: 'Communication effectiveness', description: 'How clearly and considerately you communicate in contexts that matter to you.',
    rationale: 'A practical capability that avoids treating reputation or influence as a popularity score.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.contribution-meaning', dimensionId: 'contribution-impact',
    name: 'Meaningful contribution', description: 'Your sense that your chosen contributions matter to people, communities, or causes you value.',
    rationale: 'Centers meaning and chosen impact rather than counting service activity.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.purpose-clarity', dimensionId: 'philosophy-purpose',
    name: 'Clarity of purpose', description: 'How clearly you can describe what gives direction and meaning to your life.',
    rationale: 'Keeps this dimension focused on purpose; personal values are maintained separately.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.lifestyle-environment-fit', dimensionId: 'lifestyle-environment',
    name: 'Fit of living environment', description: 'How well your surroundings support your needs and the life you want to live.',
    rationale: 'A broad reflection on environment without requiring a possessions inventory.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.lifestyle-time-autonomy', dimensionId: 'lifestyle-environment',
    name: 'Time autonomy', description: 'Your sense of choice and control over how you use your time.',
    rationale: 'Reflects perceived time freedom without tracking or scoring activity.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: monthly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.hobbies-leisure-meaning', dimensionId: 'hobbies-activities',
    name: 'Meaning in leisure', description: 'How enjoyable or restorative your chosen leisure and hobbies feel.',
    rationale: 'Focuses on the experience of recreation, not the volume of participation.',
    kind: 'subjective-assessment', valueType: 'rating', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.experiences-meaningful-range', dimensionId: 'experiences-adventure',
    name: 'Meaningful experiences', description: 'Experiences, places, or cultures you have encountered and personally want to remember.',
    rationale: 'Offers an optional user-authored record of lived experiences without counting trips or inferring events from Journal entries.',
    kind: 'subjective-assessment', valueType: 'narrative', measurementFrequency: 'Optional review: as useful', priority: 'low',
  },
  {
    id: 'atlas.builtin.future-adaptability', dimensionId: 'future-potential-opportunities',
    name: 'Adaptability', description: 'How you respond to changing circumstances and learn to work with uncertainty.',
    rationale: 'Describes a useful capability without predicting success or requiring constant change.',
    kind: 'capability', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
  {
    id: 'atlas.builtin.future-perceived-options', dimensionId: 'future-potential-opportunities',
    name: 'Perceived options', description: 'The possibilities and choices you can currently see for your future.',
    rationale: 'Captures a person’s perspective on opportunity without implying that every option must be pursued.',
    kind: 'subjective-assessment', valueType: 'narrative', measurementFrequency: 'Optional review: quarterly', priority: 'medium',
  },
];

export function createBuiltInLifeAttributes(timestamp: string): AttributeDefinition[] {
  return builtInLifeAttributes.map(({ rationale: _rationale, ...attribute }) => ({
    ...attribute,
    isBuiltIn: true,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}
