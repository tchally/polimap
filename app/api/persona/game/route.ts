import { NextResponse } from 'next/server';
import { PersonaGameState, PolicyDecision, PolicyScenario } from '@/types/game';
import { Persona, County } from '@/types';

/**
 * Initialize or update game session for a persona
 * POST /api/persona/game
 * Body: { personaId: string, countyId: string, decision?: PolicyDecision }
 */
export async function POST(request: Request) {
  try {
    const { personaId, countyId, decision } = await request.json();

    if (!personaId || !countyId) {
      return NextResponse.json(
        { error: 'personaId and countyId are required' },
        { status: 400 }
      );
    }

    // This would normally load from a database
    // For now, we'll initialize a new game state
    // In production, you'd store game sessions in a database

    return NextResponse.json(
      { error: 'Game session management not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error managing game session:', error);
    return NextResponse.json(
      { error: 'Failed to manage game session' },
      { status: 500 }
    );
  }
}

/**
 * Apply a decision to the game state
 */
export function applyDecisionToGameState(
  gameState: PersonaGameState,
  scenario: PolicyScenario,
  choice: 'accepted' | 'rejected'
): PersonaGameState {
  const impact = choice === 'accepted' ? scenario.impacts.ifAccepted : scenario.impacts.ifRejected;

  // Apply financial impacts
  const newIncome = gameState.currentIncome + (impact.financial.incomeChange || 0);
  
  // Apply priority changes
  const newPriorities = gameState.currentPriorities.map(priority => {
    const change = impact.priorityChanges[priority.issue] || 0;
    return {
      ...priority,
      importance: Math.max(0, Math.min(100, priority.importance + change)),
    };
  });

  // Update metrics
  const financialChange = impact.financial.incomeChange || 0;
  const financialSecurityChange = financialChange > 0 ? 5 : financialChange < 0 ? -5 : 0;
  const qualityOfLifeChange = impact.financial.costOfLivingChange 
    ? (impact.financial.costOfLivingChange < 0 ? 3 : -3)
    : 0;

  // Record the decision
  const newDecision: PolicyDecision = {
    scenarioId: scenario.id,
    choice,
    timestamp: Date.now(),
    personaStateBefore: { ...gameState },
    personaStateAfter: {
      ...gameState,
      currentIncome: newIncome,
      currentPriorities: newPriorities,
      decisions: [...gameState.decisions],
      timelinePosition: gameState.timelinePosition + 1,
      metrics: {
        financialSecurity: Math.max(0, Math.min(100, gameState.metrics.financialSecurity + financialSecurityChange)),
        qualityOfLife: Math.max(0, Math.min(100, gameState.metrics.qualityOfLife + qualityOfLifeChange)),
        communityEngagement: gameState.metrics.communityEngagement, // Can change based on policy type
      },
    },
  };

  return newDecision.personaStateAfter;
}
