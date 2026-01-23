/**
 * Game V3: Political Actor Simulation
 * "You are a real political actor tied to a specific place"
 */

import { Persona, County, State } from './index';
import { PressureCategory, PressureMeters, DEFAULT_PRESSURE } from './gameV2';

// Re-export for convenience
export type { PressureCategory, PressureMeters };
export { DEFAULT_PRESSURE };

/** Player role - determines jurisdiction and decision scope */
export type PlayerRole = 'state-legislator' | 'senator' | 'governor';

/** Jurisdiction for the player */
export interface Jurisdiction {
  type: 'state' | 'district' | 'federal';
  state?: State;
  district?: string; // For legislators
  name: string;
}

/** Constituent - named, persistent character */
export interface Constituent {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: {
    county: string;
    state: string;
    inJurisdiction: boolean; // In player's jurisdiction?
  };
  familyContext: string; // e.g., "Single parent, 2 kids"
  coreConcern: string; // Their main issue
  nonNegotiableValue: string; // What they won't compromise on
  /** Full background story */
  background: {
    personalHistory: string; // Their life story
    economicSituation: string; // Financial context
    communityInvolvement: string; // How they engage with community
    politicalViews: string; // Their political perspective (descriptive, not judgmental)
    challenges: string[]; // Current challenges they face
    hopes: string[]; // What they hope for
  };
  /** Current emotional state / reaction to recent decisions */
  currentReaction?: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
    message: string;
    affectedBy: string[]; // Policy IDs that affected them
  };
}

/** Policy decision card */
export interface PolicyCard {
  id: string;
  title: string;
  level: 'federal' | 'state';
  /** Framed arguments from different groups (not neutral pros/cons) */
  arguments: {
    group: string; // e.g., "Workers", "Businesses", "Environmentalists"
    position: 'for' | 'against';
    statement: string;
  }[];
  /** Who it directly affects */
  directImpact: {
    description: string;
    groups: string[];
    regions: string[];
  };
  /** Who it indirectly affects */
  indirectImpact: {
    description: string;
    groups: string[];
    regions: string[];
  };
  /** Known immediate effects */
  immediateEffects: {
    pressureChanges: Partial<Record<PressureCategory, number>>;
    affectedConstituents: string[]; // Constituent IDs
  };
  /** Uncertain/delayed effects (revealed later) */
  uncertainEffects?: {
    description: string;
    probability: number; // 0-1
    possibleOutcomes: string[];
  };
  delayedEffects?: {
    description: string;
    turnsUntilReveal: number;
  };
  /** Time pressure - how urgent is this? */
  urgency: 'low' | 'medium' | 'high' | 'critical';
  /** Time remaining before auto-decision or escalation */
  timeRemaining?: number; // seconds
  /** Real-world policy information */
  realWorldPolicy?: {
    billNumber?: string; // e.g., "H.R. 1234"
    congressGovUrl?: string; // Link to Congress.gov
    newsArticles?: Array<{
      title: string;
      url: string;
      source: string;
    }>;
    status: string; // e.g., "Introduced", "In Committee", "Passed House"
    description: string; // Real-world context
  };
}

/** Pressure category (same as V2) */
export type PressureCategory =
  | 'economic'
  | 'health'
  | 'education'
  | 'housing'
  | 'environment'
  | 'rightsSafety';

export type PressureMeters = Record<PressureCategory, number>;

/** Policy decision made by player */
export interface PolicyDecision {
  policyId: string;
  policy: PolicyCard; // Store full policy for review
  choice: 'support' | 'oppose' | 'abstain';
  timestamp: number;
  timeTaken: number; // seconds
}

/** Game session state */
export interface GameSessionV3 {
  id: string;
  playerRole: PlayerRole;
  jurisdiction: Jurisdiction;
  /** Persistent constituents */
  constituents: Constituent[];
  /** Current pressure meters */
  pressure: PressureMeters;
  /** Policies in queue (accumulate if ignored) */
  policyQueue: PolicyCard[];
  /** Current policy being decided */
  currentPolicy: PolicyCard | null;
  /** Decisions made */
  decisions: PolicyDecision[];
  /** Turn/timeline */
  currentTurn: number;
  /** Time remaining in session (optional) */
  timeRemaining?: number;
  /** Uncertain effects that will be revealed */
  pendingReveals: {
    policyId: string;
    turnToReveal: number;
    effect: string;
  }[];
  startTime: number;
  ended: boolean;
}

/** End-of-session summary */
export interface SessionSummary {
  decisionsMade: number;
  constituentsBenefited: Constituent[];
  constituentsHarmed: Constituent[];
  pressureChanges: {
    improved: PressureCategory[];
    worsened: PressureCategory[];
  };
  insights: string[]; // e.g., "Here's why leaders in this region often prioritize X over Y"
}
