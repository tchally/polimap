/**
 * Generate Game State with AI
 * POST /api/game/v3/generate
 * Body: { role: 'state-legislator' | 'senator' | 'governor', jurisdiction: { state: string, counties: string[] } }
 * 
 * Generates constituents and policies in a single AI call
 */

import { NextResponse } from 'next/server';
import { Constituent, PolicyCard, PlayerRole, PressureCategory } from '@/types/gameV3';

export async function generateGameState(
  role: PlayerRole,
  jurisdiction: { state: string; counties: string[] }
): Promise<{ constituents: Constituent[]; policies: PolicyCard[] }> {
  try {
    if (!role || !jurisdiction) {
      throw new Error('Role and jurisdiction required');
    }

    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: apiKey.trim() });

    // Single AI call to generate everything
    const prompt = `You are generating a realistic political decision-making game scenario.

Context:
- Player Role: ${role}
- Jurisdiction: ${jurisdiction.state}
- Counties: ${jurisdiction.counties.join(', ')}

Generate:
1. 6 diverse constituents with full backgrounds
2. 10-12 relevant policies for this role and jurisdiction

For each constituent, provide:
- name, age, occupation
- location (county from the list, state)
- familyContext (e.g., "Single parent, 2 kids")
- coreConcern (their main political issue)
- nonNegotiableValue (what they won't compromise on)
- background object with: personalHistory, economicSituation, communityInvolvement, politicalViews (descriptive, not judgmental), challenges (array), hopes (array)

For each policy, provide:
- title (realistic policy name)
- level: "${role === 'senator' ? 'federal' : 'state'}"
- arguments: array of 3-4 groups with position ('for' or 'against') and statement
- directImpact: { description, groups: [], regions: [] }
- indirectImpact: { description, groups: [], regions: [] }
- immediateEffects: { pressureChanges: object with keys from ['economic', 'health', 'education', 'housing', 'environment', 'rightsSafety'], affectedConstituents: array of constituent IDs }
- urgency: 'low' | 'medium' | 'high' | 'critical'
- timeRemaining: number (seconds, 120-300)
- realWorldPolicy: { description: string about real-world context, status: string, billNumber: optional string, congressGovUrl: optional string (for federal), newsArticles: array with {title, url, source} }

Make policies relevant to current U.S. political debates (2024-2025). Make constituents diverse in age, occupation, and concerns.

Return ONLY valid JSON in this exact format:
{
  "constituents": [/* array of 6 constituents */],
  "policies": [/* array of 10-12 policies - MUST generate at least 10 */]
}

IMPORTANT: For each policy's realWorldPolicy, include actual URLs when possible:
- congressGovUrl: Use format "https://www.congress.gov/bill/XXXth-congress/house-bill/XXXX" or similar for federal bills
- newsArticles: Include real news article URLs about similar policies (use placeholder URLs if needed, format: "https://www.example.com/article-title")`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const block = message.content[0];
    if (block?.type !== 'text') {
      throw new Error('Unexpected response format from AI');
    }

    const text = block.text.trim();
    // Try to extract JSON from markdown code blocks or find JSON object
    let jsonText = text;
    
    // Match markdown code blocks - using string concatenation to avoid parser issues
    const backtick = '`';
    const codeBlockPattern = backtick + backtick + backtick + '(?:json)?\\s*([\\s\\S]*?)\\s*' + backtick + backtick + backtick;
    const codeBlockRegex = new RegExp(codeBlockPattern);
    const codeBlockMatch = text.match(codeBlockRegex);
    
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // Fallback: try to find JSON object
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0];
      }
    }
    const parsed = JSON.parse(jsonText);

    // Validate and format constituents
    const constituents: Constituent[] = parsed.constituents.map((c: any, i: number) => ({
      id: c.id || `constituent-${i + 1}`,
      name: c.name,
      age: c.age,
      occupation: c.occupation,
      location: {
        county: c.location?.county || jurisdiction.counties[i % jurisdiction.counties.length],
        state: jurisdiction.state,
        inJurisdiction: c.location?.inJurisdiction !== false,
      },
      familyContext: c.familyContext,
      coreConcern: c.coreConcern,
      nonNegotiableValue: c.nonNegotiableValue,
      background: {
        personalHistory: c.background?.personalHistory || 'Background information not available.',
        economicSituation: c.background?.economicSituation || 'Economic situation not specified.',
        communityInvolvement: c.background?.communityInvolvement || 'Community involvement not specified.',
        politicalViews: c.background?.politicalViews || 'Political views not specified.',
        challenges: c.background?.challenges || [],
        hopes: c.background?.hopes || [],
      },
    }));

    // Validate and format policies
    const policies: PolicyCard[] = parsed.policies.map((p: any, i: number) => ({
      id: p.id || `policy-${i + 1}`,
      title: p.title,
      level: p.level || (role === 'senator' ? 'federal' : 'state'),
      arguments: p.arguments || [],
      directImpact: p.directImpact || { description: '', groups: [], regions: [] },
      indirectImpact: p.indirectImpact || { description: '', groups: [], regions: [] },
      immediateEffects: {
        pressureChanges: p.immediateEffects?.pressureChanges || {},
        affectedConstituents: p.immediateEffects?.affectedConstituents || [],
      },
      uncertainEffects: p.uncertainEffects,
      delayedEffects: p.delayedEffects,
      urgency: p.urgency || 'medium',
      timeRemaining: p.timeRemaining || 180,
      realWorldPolicy: p.realWorldPolicy,
    }));

    return {
      constituents,
      policies,
    };
  } catch (e) {
    console.error('[game/v3/generate]', e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate game state');
  }
}

export async function POST(request: Request) {
  try {
    const { role, jurisdiction } = await request.json();
    
    if (!role || !jurisdiction) {
      return NextResponse.json(
        { error: 'Role and jurisdiction required' },
        { status: 400 }
      );
    }

    const result = await generateGameState(role, jurisdiction);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[game/v3/generate]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate game state' },
      { status: 500 }
    );
  }
}
