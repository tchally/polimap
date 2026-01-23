/**
 * Game mechanics and decision tree types for persona exploration
 */

import { Persona, County } from './index';

/**
 * A policy scenario that the persona encounters
 */
export interface PolicyScenario {
  id: string;
  title: string;
  description: string;
  policyType: 'federal' | 'state' | 'local';
  urgency: 'low' | 'medium' | 'high'; // How time-sensitive is this decision
  affectedAreas: string[]; // e.g., ['Housing', 'Healthcare', 'Education']
  
  // The actual policy details
  policy: {
    name: string;
    summary: string;
    details: string;
    status: 'proposed' | 'debated' | 'voting' | 'pending'; // Current status of the policy
    proposer: string; // e.g., "State Legislature", "City Council", "Federal Bill H.R. 1234"
  };
  
  // How this affects the persona if accepted/rejected
  impacts: {
    ifAccepted: ScenarioImpact;
    ifRejected: ScenarioImpact;
  };
  
  // Pre-generated impact narratives (created upfront to avoid AI calls during gameplay)
  impactNarratives?: {
    ifAccepted: string; // Detailed narrative of what happened to the persona
    ifRejected: string; // Detailed narrative of what happened to the persona
  };
  
  // Context about why this matters in the persona's region
  regionalContext: string;
  
  // When this decision happens (timeline position)
  timelinePosition: number; // 0 = start, higher = later
}

/**
 * Impact of a decision on the persona
 */
export interface ScenarioImpact {
  // Financial impacts
  financial: {
    incomeChange?: number; // Dollar amount change per year
    taxChange?: number; // Tax amount change per year
    costOfLivingChange?: number; // Percentage change
  };
  
  // Priority impacts (how priorities shift)
  priorityChanges: {
    [issue: string]: number; // Change in importance (0-100)
  };
  
  // Quality of life impacts
  qualityOfLife: {
    description: string; // Narrative description of the impact
    affectedAreas: string[]; // e.g., ['Housing Stability', 'Healthcare Access']
  };
  
  // Long-term consequences
  longTerm: {
    description: string;
    nextScenarioTriggers?: string[]; // IDs of scenarios that might be triggered by this choice
  };
}

/**
 * User's decision on a policy
 */
export interface PolicyDecision {
  scenarioId: string;
  choice: 'accepted' | 'rejected';
  timestamp: number;
  personaStateBefore: PersonaGameState;
  personaStateAfter: PersonaGameState;
}

/**
 * Current state of the persona in the game
 */
export interface PersonaGameState {
  persona: Persona;
  county: County;
  
  // Current situation (changes as decisions are made)
  currentIncome: number; // Can change based on policy impacts
  currentPriorities: {
    issue: string;
    importance: number;
    description: string;
  }[];
  
  // Life events that have occurred
  lifeEvents: LifeEvent[];
  
  // Decisions made
  decisions: PolicyDecision[];
  
  // Current timeline position
  timelinePosition: number;
  
  // Accumulated impact metrics
  metrics: {
    financialSecurity: number; // 0-100
    qualityOfLife: number; // 0-100
    communityEngagement: number; // 0-100
  };
}

/**
 * Life events that happen over time
 */
export interface LifeEvent {
  id: string;
  type: 'job_change' | 'housing_change' | 'family_change' | 'economic_change' | 'community_event';
  title: string;
  description: string;
  timestamp: number;
  impact: {
    incomeChange?: number;
    priorityChanges?: { [issue: string]: number };
  };
}

/**
 * A decision node in the game flow
 */
export interface DecisionNode {
  id: string;
  scenario: PolicyScenario;
  availableChoices: ('accept' | 'reject')[];
  prerequisites?: string[]; // Decision IDs that must be completed first
  triggers?: string[]; // Scenario IDs that this decision might trigger
}

/**
 * Game session - tracks a user's playthrough
 */
export interface GameSession {
  id: string;
  personaId: string;
  countyId: string;
  state: PersonaGameState;
  startTime: number;
  lastUpdateTime: number;
  completed: boolean;
  score?: number; // Optional game score
}
