/**
 * Start Game V3 — Political Actor Simulation
 * POST /api/game/v3/start
 * Body: { role: 'state-legislator' | 'senator' | 'governor' }
 */

import { NextResponse } from 'next/server';
import { getAllStatesWithElections } from '@/data/stateElectionData';
import { getAllCountiesFromElections } from '@/data/countyDataFromElections';
import { DEFAULT_PRESSURE, type GameSessionV3, type PlayerRole, type Jurisdiction, type Constituent, type PolicyCard } from '@/types/gameV3';
import { generateConstituents } from '@/data/constituents';
import { drawPolicyCards } from '@/data/policyCards';

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    
    if (!role || !['state-legislator', 'senator', 'governor'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role required: state-legislator, senator, or governor' },
        { status: 400 }
      );
    }

    // Get jurisdiction
    const states = await getAllStatesWithElections();
    const randomState = states[Math.floor(Math.random() * states.length)];
    
    const jurisdiction: Jurisdiction = {
      type: role === 'senator' ? 'federal' : 'state',
      state: randomState,
      name: role === 'senator' ? `${randomState.name} (Federal)` : randomState.name,
    };

    // Get counties for constituents
    const allCounties = await getAllCountiesFromElections();
    const stateCounties = allCounties
      .filter((c) => c.stateId === randomState.abbreviation)
      .map((c) => c.name)
      .slice(0, 10);

    // Generate game state with AI (constituents + policies in one call)
    let constituents: Constituent[];
    let allPolicies: PolicyCard[];
    
    try {
      // Call the generate function directly (server-side)
      const { generateGameState } = await import('@/app/api/game/v3/generate/route');
      const result = await generateGameState(role, {
        state: randomState.name,
        counties: stateCounties,
      });
      constituents = result.constituents;
      allPolicies = result.policies;
      console.log(`[game/v3/start] Generated ${constituents.length} constituents and ${allPolicies.length} policies via AI`);
    } catch (e) {
      console.warn('[game/v3/start] AI generation failed, using fallback data:', e);
      // Fallback to hardcoded data if AI fails
      constituents = generateConstituents(
        { state: randomState.name, counties: stateCounties },
        6
      );
      allPolicies = drawPolicyCards(role as PlayerRole, 10);
    }

    if (allPolicies.length === 0) {
      console.error('[game/v3/start] No policies available for role:', role);
      return NextResponse.json(
        { error: 'No policies available for this role. Please try again.' },
        { status: 500 }
      );
    }
    
    const currentPolicy = allPolicies[0] || null;
    const policyQueue = allPolicies.slice(1); // Rest of queue

    console.log('[game/v3/start] Session created:', {
      role,
      jurisdiction: jurisdiction.name,
      constituentsCount: constituents.length,
      currentPolicy: currentPolicy?.title,
      queueLength: policyQueue.length,
    });

    const session: GameSessionV3 = {
      id: `session-v3-${Date.now()}`,
      playerRole: role as PlayerRole,
      jurisdiction,
      constituents,
      pressure: { ...DEFAULT_PRESSURE },
      policyQueue,
      currentPolicy,
      decisions: [],
      currentTurn: 1,
      pendingReveals: [],
      startTime: Date.now(),
      ended: false,
    };

    return NextResponse.json({ session });
  } catch (e) {
    console.error('[game/v3/start]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start game' },
      { status: 500 }
    );
  }
}
