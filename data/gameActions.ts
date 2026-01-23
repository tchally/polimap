/**
 * Player Actions — 2–3 per turn, conditional
 * Tradeoffs required; user cannot address everything.
 */

import { GameAction, PressureCategory } from '@/types/gameV2';

/** Base action definitions. Context-specific variants can override feedback. */
export const GAME_ACTIONS: GameAction[] = [
  {
    id: 'learn',
    label: 'Learn more about this issue',
    description: 'Reduce uncertainty. You spend time reading, talking to neighbors, or watching local meetings.',
    pressureDelta: {}, // No direct pressure change; reduces "uncertainty" narratively
    feedback: 'You feel less in the dark. You understand the tradeoffs better—and that they’re not simple.',
    targetCategory: undefined,
  },
  {
    id: 'reprioritize',
    label: 'Reprioritize your focus',
    description: 'Shift what matters most to you right now. Something else gets less attention.',
    pressureDelta: {}, // Implementer applies -5 to one category, +5 to another based on choice
    feedback: 'You’ve consciously decided what to prioritize. It helps—but you’re aware of what you’re deprioritizing.',
    targetCategory: undefined,
  },
  {
    id: 'engage',
    label: 'Engage locally',
    description: 'Vote, retrain, move, or advocate—in narrative only. You take action in your community.',
    pressureDelta: {}, // Narrative only; no mechanical effect
    feedback: 'You showed up. It might not change everything, but you’re part of the story now.',
    targetCategory: undefined,
  },
  {
    id: 'ignore',
    label: 'Ignore this issue for now',
    description: 'Short-term relief. You focus elsewhere. Long-term, pressure may build.',
    pressureDelta: { economic: 3, health: 2, housing: 2, education: 2, environment: 2, rightsSafety: 2 }, // Small across-the-board rise later
    feedback: 'You set it aside. You feel a bit lighter today—but you wonder what you’re postponing.',
    targetCategory: undefined,
  },
];

/** Get 2–3 actions for current turn. Can be conditional on events, pressure, etc. */
export function getActionsForTurn(
  eventCategories: PressureCategory[],
  actionsUsed: string[] = []
): GameAction[] {
  const pool = GAME_ACTIONS.filter((a) => !actionsUsed.includes(a.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3); // 2–3 actions; we use 3
}
