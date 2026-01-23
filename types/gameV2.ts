/**
 * Game V2: Pressure-based core loop
 * "The player is learning what it feels like to live inside political constraints."
 */

import { Persona, County } from './index';

/** Pressure categories — each 0–100. If any maxes out → Local Crisis */
export type PressureCategory =
  | 'economic'
  | 'health'
  | 'education'
  | 'housing'
  | 'environment'
  | 'rightsSafety';

export type PressureMeters = Record<PressureCategory, number>;

/** Event card — drawn at session start and between turns */
export interface EventCard {
  id: string;
  title: string;
  description: string;
  /** e.g. "Federal", "State", "Local" */
  level: 'federal' | 'state' | 'local';
  /** Which pressure meters this event affects */
  pressureDelta: Partial<Record<PressureCategory, number>>;
  /** Short narrative for immediate feedback */
  narrative: string;
  /** Optional: real-world policy reference */
  sourceHint?: string;
}

/** Player action — 2–3 per turn, conditional */
export type ActionType =
  | 'learn'
  | 'reprioritize'
  | 'engage'
  | 'ignore';

export interface GameAction {
  id: ActionType;
  label: string;
  /** Narrative description (no mechanical effect for engage) */
  description: string;
  /** Pressure changes; tradeoffs required */
  pressureDelta: Partial<Record<PressureCategory, number>>;
  /** Short feedback text */
  feedback: string;
  /** Which pressure category this "addresses" (for ignore, it's short-term relief) */
  targetCategory?: PressureCategory;
}

/** Single turn: events applied → player chooses actions → consequences */
export interface GameTurn {
  turnNumber: number;
  eventCards: EventCard[];
  pressureBefore: PressureMeters;
  pressureAfter: PressureMeters;
  actionsTaken: GameAction[];
  narrativeFeedback: string;
  /** Triggered if any pressure hit 100 */
  localCrisis?: {
    title: string;
    description: string;
    cascadingEffects: string[];
  };
}

/** Session state — modular for expansion */
export interface GameSessionV2 {
  id: string;
  persona: Persona;
  county: County;
  /** Top 3 priorities; may shift over time */
  topPriorities: { issue: string; importance: number; description: string }[];
  pressure: PressureMeters;
  turns: GameTurn[];
  currentTurn: number;
  /** Map revealed after first turn */
  mapRevealed: boolean;
  /** Insight badges earned (no points) */
  insightBadges: string[];
  startTime: number;
  /** Session ended (crisis, reflection, or quit) */
  ended: boolean;
}

/** Default pressure (all 0) */
export const DEFAULT_PRESSURE: PressureMeters = {
  economic: 0,
  health: 0,
  education: 0,
  housing: 0,
  environment: 0,
  rightsSafety: 0,
};

/** Labels for UI */
export const PRESSURE_LABELS: Record<PressureCategory, string> = {
  economic: 'Economic',
  health: 'Health',
  education: 'Education',
  housing: 'Housing',
  environment: 'Environment',
  rightsSafety: 'Rights & Safety',
};
