import { NextResponse } from 'next/server';
import { PersonaGameState } from '@/types/game';
import { Persona, County } from '@/types';
import { getCountyByIdWithElections } from '@/data/enrichedCountyData';

/**
 * Initialize a game session for a persona
 * POST /api/persona/initialize-game
 * Body: { persona: Persona }
 */
export async function POST(request: Request) {
  try {
    const { persona } = await request.json();

    if (!persona || !persona.countyId) {
      return NextResponse.json(
        { error: 'persona with countyId is required' },
        { status: 400 }
      );
    }

    // Get county data
    const county = await getCountyByIdWithElections(persona.countyId);
    if (!county) {
      return NextResponse.json(
        { error: `County ${persona.countyId} not found` },
        { status: 404 }
      );
    }

    // Initialize game state
    const gameState: PersonaGameState = {
      persona,
      county,
      currentIncome: persona.householdInfo.income,
      currentPriorities: [...persona.topPriorities],
      lifeEvents: [],
      decisions: [],
      timelinePosition: 0,
      metrics: {
        financialSecurity: 50, // Start at neutral
        qualityOfLife: 50,
        communityEngagement: 50,
      },
    };

    return NextResponse.json(gameState, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error initializing game:', error);
    return NextResponse.json(
      { error: 'Failed to initialize game' },
      { status: 500 }
    );
  }
}
