import { NextResponse } from 'next/server';
import { County, Persona } from '@/types';
import { getCountyByIdWithElections } from '@/data/enrichedCountyData';

/**
 * Generate a persona using AI based on county demographics and politics
 * POST /api/persona/generate
 * Body: { countyId: string }
 */
export async function POST(request: Request) {
  try {
    const { countyId } = await request.json();

    if (!countyId) {
      return NextResponse.json(
        { error: 'countyId is required' },
        { status: 400 }
      );
    }

    console.log(`[Persona API] Generating persona for county: ${countyId}`);

    // Fetch county data
    console.log(`[Persona API] Looking up county: ${countyId}`);
    const county = await getCountyByIdWithElections(countyId);
    if (!county) {
      // Try to get a few sample county IDs for debugging
      const { getAllCountiesFromElections } = await import('@/data/countyDataFromElections');
      const allCounties = await getAllCountiesFromElections();
      const stateMatch = countyId.match(/^([A-Z]{2})-/i);
      const stateId = stateMatch ? stateMatch[1].toUpperCase() : null;
      const sampleIds = stateId
        ? allCounties
            .filter(c => c.stateId === stateId)
            .slice(0, 10)
            .map(c => c.id)
        : allCounties.slice(0, 10).map(c => c.id);
      
      console.error(`County ${countyId} not found. Sample county IDs: ${sampleIds.join(', ')}`);
      return NextResponse.json(
        { error: `County ${countyId} not found. The county may not exist in the database or may use a different ID format. Sample IDs for this state: ${sampleIds.join(', ')}` },
        { status: 404 }
      );
    }

    console.log(`[Persona API] County found: ${county.name}, ${county.stateName}`);

    // Generate persona using AI
    console.log(`[Persona API] Starting AI generation...`);
    const persona = await generatePersonaWithAI(county);
    
    // Note: Policy scenarios will be generated on-demand when user starts playing
    // This avoids blocking persona generation and allows scenarios to be fresh

    // Generate a unique ID for the persona
    const personaId = `persona-${countyId}-${Date.now()}`;
    const fullPersona: Persona = { ...persona, id: personaId, countyId };

    console.log(`[Persona API] Persona generated successfully: ${fullPersona.name}`);
    return NextResponse.json(fullPersona, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[Persona API] Error generating persona:', error);
    if (error instanceof Error) {
      console.error('[Persona API] Error message:', error.message);
      console.error('[Persona API] Error stack:', error.stack);
      return NextResponse.json(
        { error: `Failed to generate persona: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate persona' },
      { status: 500 }
    );
  }
}

/**
 * Generate a persona using AI based on county data
 */
async function generatePersonaWithAI(county: County): Promise<Omit<Persona, 'id' | 'countyId'>> {
  // Check which AI provider is configured
  // Support both CLAUDE_API_KEY and ANTHROPIC_API_KEY naming conventions
  const anthropicKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    return await generateWithAnthropic(county, anthropicKey);
  } else {
    // Fallback to rule-based generation if no AI is configured
    console.warn('No AI API key found. Using fallback persona generation.');
    return generateFallbackPersona(county);
  }
}

/**
 * Generate persona using Anthropic Claude
 */
async function generateWithAnthropic(county: County, apiKey: string): Promise<Omit<Persona, 'id' | 'countyId'>> {
  try {
    // Lazy load to avoid module resolution errors if package isn't installed
    console.log('[Anthropic] Importing SDK...');
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    console.log('[Anthropic] SDK imported, creating client...');
    const anthropic = new Anthropic({ apiKey: apiKey.trim() });

    const prompt = buildPersonaPrompt(county);
    console.log('[Anthropic] Calling API with prompt length:', prompt.length);
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.8,
      system: 'You are an expert at creating realistic, empathetic personas for a political empathy application. Generate personas that reflect real people in real communities, with authentic backgrounds and concerns. Always respond with valid JSON only, no additional text or markdown.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      let text = content.text.trim();
      
      // Remove markdown code blocks if present
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/g, '');
      }
      
      // Try to extract JSON object if there's extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      
      const personaJson = JSON.parse(jsonText);
      return parsePersonaResponse(personaJson, county);
    }
    throw new Error('Unexpected response format from Anthropic');
  } catch (error) {
    console.error('Anthropic API error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw new Error('Failed to generate persona with Anthropic');
  }
}

/**
 * Build the prompt for persona generation
 */
function buildPersonaPrompt(county: County): string {
  const demographics = county.demographics || {};
  const age = demographics.age?.median || 38;
  const income = county.medianIncome || 60000;
  const race = demographics.race || {};
  const education = demographics.education || {};

  return `Create a realistic persona for someone living in ${county.name}, ${county.stateName}.

County Context:
- Median age: ${age} years
- Median household income: $${income.toLocaleString()}
- Political leaning: ${county.politicalLean}
${demographics.age?.distribution ? `- Age distribution: ${JSON.stringify(demographics.age.distribution)}` : ''}
${Object.keys(race).length > 0 ? `- Race/Ethnicity: ${Object.entries(race).map(([r, p]) => `${r}: ${p}%`).join(', ')}` : ''}
${Object.keys(education).length > 0 ? `- Education (25+): ${Object.entries(education).map(([e, p]) => `${e}: ${p}%`).join(', ')}` : ''}
- Population: ${county.population.toLocaleString()}

Generate a realistic persona with:

1. Name: Appropriate for the demographics and region
2. Age: Between ${Math.max(18, age - 15)} and ${age + 15} years old (near the county median)
3. Occupation: Realistic for the education level and income range (consider common jobs in similar counties)
4. Household: 
   - Size: 1-4 people (typical for the area)
   - Income: Within county range ($${Math.max(20000, Math.round(income * 0.6)).toLocaleString()} - $${Math.round(income * 1.5).toLocaleString()})
   - Type: Renting or owning (realistic for income level)
5. Top 3 priorities (based on local context, income level, and demographics):
   - Each priority should have: issue name, importance (0-100), description
   - Consider issues like: housing affordability, healthcare access, education, jobs, climate change, taxes, infrastructure, etc.
6. Political alignment: Should reflect the county's ${county.politicalLean} lean but with personal nuance
7. Background story: 1-2 sentences connecting them to the area and their current situation

Output as JSON with this exact structure:
{
  "name": "string",
  "age": number,
  "occupation": "string",
  "householdInfo": {
    "size": number,
    "income": number,
    "type": "string (e.g., 'Renting apartment', 'Owns home', 'Renting house with family')"
  },
  "politicalAlignment": "democratic" | "republican" | "swing" | "strongly-democratic" | "strongly-republican",
  "topPriorities": [
    {
      "issue": "string",
      "importance": number (0-100),
      "description": "string (1-2 sentences explaining why this matters to them)"
    },
    {
      "issue": "string",
      "importance": number (0-100),
      "description": "string"
    },
    {
      "issue": "string",
      "importance": number (0-100),
      "description": "string"
    }
  ],
  "background": "string (1-2 sentences)"
}`;
}

/**
 * Parse and validate AI response into Persona object
 */
function parsePersonaResponse(json: any, county: County): Omit<Persona, 'id' | 'countyId'> {
  // Validate and parse the response
  if (!json.name || !json.age || !json.occupation) {
    throw new Error('Invalid persona response: missing required fields');
  }

  // Ensure political alignment matches expected type
  const validAlignments: Array<Persona['politicalAlignment']> = [
    'strongly-democratic',
    'democratic',
    'swing',
    'republican',
    'strongly-republican',
  ];
  const alignment = validAlignments.includes(json.politicalAlignment)
    ? json.politicalAlignment
    : county.politicalLean; // Fallback to county lean

  // Validate and format top priorities
  const topPriorities = Array.isArray(json.topPriorities)
    ? json.topPriorities
        .slice(0, 3)
        .map((p: any) => ({
          issue: p.issue || 'General Concern',
          importance: Math.min(100, Math.max(0, parseInt(p.importance) || 50)),
          description: p.description || '',
        }))
    : [];

  // Ensure we have at least 3 priorities
  while (topPriorities.length < 3) {
    topPriorities.push({
      issue: 'Community Well-being',
      importance: 50,
      description: 'General concern for the community.',
    });
  }

  return {
    name: json.name,
    age: Math.max(18, Math.min(100, parseInt(json.age) || 35)),
    occupation: json.occupation,
    householdInfo: {
      size: Math.max(1, Math.min(8, parseInt(json.householdInfo?.size) || 2)),
      income: parseInt(json.householdInfo?.income) || Math.round(county.medianIncome * 0.8),
      type: json.householdInfo?.type || 'Renting',
    },
    politicalAlignment: alignment,
    topPriorities,
    background: json.background || `A resident of ${county.name}, ${county.stateName}.`,
  };
}

/**
 * Fallback persona generation (rule-based) if no AI is available
 */
function generateFallbackPersona(county: County): Omit<Persona, 'id' | 'countyId'> {
  const age = county.demographics?.age?.median || 38;
  const income = county.medianIncome || 60000;
  
  // Simple rule-based generation
  const names = ['Alex Johnson', 'Jordan Smith', 'Taylor Martinez', 'Morgan Williams', 'Casey Brown'];
  const occupations = ['Teacher', 'Healthcare Worker', 'Small Business Owner', 'Construction Worker', 'Office Manager'];
  
  const priorities = [
    { issue: 'Housing Affordability', importance: 75, description: 'Concerned about housing costs and availability.' },
    { issue: 'Healthcare Access', importance: 70, description: 'Wants affordable and accessible healthcare.' },
    { issue: 'Economic Opportunity', importance: 65, description: 'Seeking better job opportunities and wages.' },
  ];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    age: age + Math.floor(Math.random() * 20) - 10, // ±10 years
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    householdInfo: {
      size: Math.floor(Math.random() * 3) + 1, // 1-3
      income: Math.round(income * (0.7 + Math.random() * 0.6)), // 70-130% of median
      type: Math.random() > 0.5 ? 'Renting' : 'Owns home',
    },
    politicalAlignment: county.politicalLean,
    topPriorities: priorities,
    background: `A resident of ${county.name}, ${county.stateName}, focused on building a better future for their family and community.`,
  };
}

