import type { LifeDimension } from './types';

interface BuiltInDimensionDefinition {
  id: string;
  name: string;
  description: string;
}

export const LIFE_DIMENSIONS_VERSION = 1;

export const builtInLifeDimensions: readonly BuiltInDimensionDefinition[] = [
  { id: 'physical-health', name: 'Physical Health', description: 'The condition, care, and resilience of the body.' },
  { id: 'intelligence-cognition', name: 'Intelligence & Cognitive Abilities', description: 'Thinking, learning, reasoning, and curiosity.' },
  { id: 'mental-emotional-wellbeing', name: 'Mental & Emotional Wellbeing', description: 'Emotional resilience, clarity, and psychological wellbeing.' },
  { id: 'happiness-life-satisfaction', name: 'Happiness & Life Satisfaction', description: 'Contentment, enjoyment, fulfilment, and freedom.' },
  { id: 'family', name: 'Family', description: 'Family relationships, responsibilities, and connection.' },
  { id: 'romantic-relationships', name: 'Romantic Relationships', description: 'Intimacy, trust, respect, and relationship satisfaction.' },
  { id: 'social-life-friendships', name: 'Social Life & Friendships', description: 'Friendship, community, social confidence, and support.' },
  { id: 'career-professional-development', name: 'Career & Professional Development', description: 'Professional capability, direction, and contribution.' },
  { id: 'wealth-financial-health', name: 'Wealth & Financial Health', description: 'Financial security, literacy, cash flow, and independence.' },
  { id: 'assets-possessions', name: 'Assets & Possessions', description: 'The inventory and stewardship of owned possessions.' },
  { id: 'knowledge-education', name: 'Knowledge & Education', description: 'Learning, qualifications, literacy, and understanding.' },
  { id: 'creativity-expression', name: 'Creativity & Expression', description: 'Original thinking and creative practice or output.' },
  { id: 'experiences-adventure', name: 'Experiences & Adventure', description: 'Exploration, memories, novelty, and life outside routine.' },
  { id: 'discipline-character', name: 'Discipline & Character', description: 'Values expressed through consistent choices and conduct.' },
  { id: 'influence-reputation', name: 'Influence & Reputation', description: 'Credibility, leadership, communication, and social impact.' },
  { id: 'contribution-impact', name: 'Contribution & Impact', description: 'Service, mentorship, responsibility, and legacy.' },
  { id: 'philosophy-purpose', name: 'Philosophy & Purpose', description: 'Values, meaning, worldview, and long-term direction.' },
  { id: 'lifestyle-environment', name: 'Lifestyle & Environment', description: 'Home, routine, safety, time freedom, and surroundings.' },
  { id: 'hobbies-activities', name: 'Hobbies & Activities', description: 'Recreation, interests, play, and enjoyment.' },
  { id: 'future-potential-opportunities', name: 'Future Potential & Opportunities', description: 'Options, adaptability, resources, and unexplored possibilities.' },
];

export function createBuiltInLifeDimensions(timestamp: string): LifeDimension[] {
  return builtInLifeDimensions.map((dimension, position) => ({
    ...dimension,
    isBuiltIn: true,
    isActive: true,
    position,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}
