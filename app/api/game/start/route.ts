/**
 * Start a new game session — drop user into persona scenario, no map initially
 * POST /api/game/start
 * Body: { countyId?: string } — optional; if omitted, random county
 */

import { NextResponse } from 'next/server';
import { getAllCountiesFromElections } from '@/data/countyDataFromElections';
import { getCountyByIdWithElections } from '@/data/enrichedCountyData';
import { EVENT_CARDS, drawEventCards } from '@/data/eventCards';
import { DEFAULT_PRESSURE, type PressureMeters, type GameSessionV2 } from '@/types/gameV2';
import { Persona, County } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { countyId: requestedCountyId } = body;

    let county: County | undefined;

    if (requestedCountyId) {
      county = await getCountyByIdWithElections(requestedCountyId);
    }

    if (!county) {
      const all = await getAllCountiesFromElections();
      if (all.length === 0) {
        return NextResponse.json(
          { error: 'No counties available' },
          { status: 503 }
        );
      }
      const i = Math.floor(Math.random() * all.length);
      county = await getCountyByIdWithElections(all[i].id);
      if (!county) county = all[i];
    }

    // Generate persona via existing API logic (inline to avoid extra HTTP)
    const persona = await generatePersonaForCounty(county);
    persona.id = `persona-${county.id}-${Date.now()}`;
    persona.countyId = county.id;

    // Draw 1–2 event cards at session start
    const eventCards = drawEventCards(EVENT_CARDS, 2);

    // Apply pressure from events
    const pressure = applyPressureDeltas(
      { ...DEFAULT_PRESSURE },
      eventCards.map((e) => e.pressureDelta)
    );

    const session: GameSessionV2 = {
      id: `session-${Date.now()}`,
      persona,
      county,
      topPriorities: [...persona.topPriorities],
      pressure,
      turns: [],
      currentTurn: 0,
      mapRevealed: false,
      insightBadges: [],
      startTime: Date.now(),
      ended: false,
    };

    return NextResponse.json({
      session,
      eventCards,
    });
  } catch (e) {
    console.error('[game/start]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start game' },
      { status: 500 }
    );
  }
}

function applyPressureDeltas(
  base: PressureMeters,
  deltas: Partial<Record<keyof PressureMeters, number>>[]
): PressureMeters {
  const next = { ...base };
  for (const d of deltas) {
    for (const [k, v] of Object.entries(d)) {
      if (typeof v !== 'number') continue;
      const key = k as keyof PressureMeters;
      next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + v));
    }
  }
  return next;
}

async function generatePersonaForCounty(county: County): Promise<Persona> {
  const key = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (key) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: key.trim() });
      const income = county.medianIncome ?? 60_000;
      const age = county.demographics?.age?.median ?? 38;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: `Generate a single fictional but data-informed persona for someone living in ${county.name}, ${county.stateName}. Median income ~$${income.toLocaleString()}, median age ~${age}. Return valid JSON only, no markdown, with this exact shape:
{
  "name": "string",
  "age": number,
  "occupation": "string",
  "householdInfo": { "size": number, "income": number, "type": "string" },
  "politicalAlignment": "strongly-democratic"|"democratic"|"swing"|"republican"|"strongly-republican",
  "topPriorities": [{"issue":"string","importance":number,"description":"string"}, ...],
  "background": "string"
}
Top priorities: exactly 3. Alignment is descriptive, not judgmental.`,
          },
        ],
      });

      const block = message.content[0];
      const text = block?.type === 'text' ? block.text : '';
      const raw = text.trim().replace(/^```json?\s*|\s*```$/g, '');
      const j = JSON.parse(raw);
      return {
        id: '',
        countyId: county.id,
        name: j.name || 'Alex',
        age: typeof j.age === 'number' ? j.age : age,
        occupation: j.occupation || 'Worker',
        householdInfo: {
          size: j.householdInfo?.size ?? 2,
          income: j.householdInfo?.income ?? income,
          type: j.householdInfo?.type || 'Household',
        },
        politicalAlignment: j.politicalAlignment || 'swing',
        topPriorities: Array.isArray(j.topPriorities) ? j.topPriorities.slice(0, 3) : [],
        background: j.background || '',
      };
    } catch (err) {
      console.warn('[game/start] AI persona fallback:', err);
    }
  }

  return {
    id: '',
    countyId: county.id,
    name: 'Alex',
    age: county.demographics?.age?.median ?? 38,
    occupation: 'Worker',
    householdInfo: {
      size: 2,
      income: county.medianIncome ?? 60_000,
      type: 'Household',
    },
    politicalAlignment: 'swing',
    topPriorities: [
      { issue: 'Economic opportunity', importance: 80, description: 'Jobs and wages.' },
      { issue: 'Healthcare', importance: 75, description: 'Access and cost.' },
      { issue: 'Housing', importance: 70, description: 'Affordability and stability.' },
    ],
    background: `Living in ${county.name}, ${county.stateName}.`,
  };
}
