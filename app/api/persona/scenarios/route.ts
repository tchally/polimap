import { NextResponse } from 'next/server';
import { Persona, County } from '@/types';
import { PolicyScenario } from '@/types/game';
import { getCountyByIdWithElections } from '@/data/enrichedCountyData';
import { getAllPolicyData } from '@/services/policyDataService';

/**
 * Generate policy scenarios for a persona using AI
 * POST /api/persona/scenarios
 * Body: { personaId: string, countyId: string }
 */
export async function POST(request: Request) {
  try {
    const { personaId, countyId } = await request.json();

    if (!personaId || !countyId) {
      return NextResponse.json(
        { error: 'personaId and countyId are required' },
        { status: 400 }
      );
    }

    // For now, we'll need to get persona from somewhere
    // In a full implementation, personas would be stored/retrieved
    // For now, we'll use the county to generate scenarios
    const county = await getCountyByIdWithElections(countyId);
    if (!county) {
      return NextResponse.json(
        { error: `County ${countyId} not found` },
        { status: 404 }
      );
    }

    // Fetch real policy data
    const newsApiKey = process.env.NEWS_API_KEY;
    console.log(`[Scenarios API] Fetching policy data for ${county.name}, ${county.stateName}...`);
    const policyData = await getAllPolicyData(county, newsApiKey);
    
    console.log(`[Scenarios API] Policy data fetched:`, {
      articles: policyData.articles.length,
      federalBills: policyData.federalBills.length,
      stateBills: policyData.stateBills.length,
    });

    // Generate scenarios using AI with real policy data
    const scenarios = await generatePolicyScenarios(county, personaId, policyData);
    console.log(`[Scenarios API] Generated ${scenarios.length} scenarios`);

    return NextResponse.json(scenarios, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to generate scenarios' },
      { status: 500 }
    );
  }
}

/**
 * Generate policy scenarios using AI based on county and persona context
 * Now uses real policy data from News API and other sources
 */
async function generatePolicyScenarios(
  county: County,
  personaId: string,
  policyData?: {
    articles: any[];
    federalBills: any[];
    stateBills: any[];
  }
): Promise<PolicyScenario[]> {
  const anthropicKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    // Fallback to rule-based scenarios if no AI
    return generateFallbackScenarios(county);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: anthropicKey.trim() });

    const prompt = buildScenarioPrompt(county, policyData);

    console.log(`[Scenarios API] Calling Anthropic API with ${policyData?.articles.length || 0} policy articles...`);
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000, // Increased for more scenarios
      temperature: 1.0, // Increased for more variety
      system: 'You are an expert at creating realistic, engaging policy scenarios for a political empathy game. CRITICALLY IMPORTANT: Generate DIVERSE scenarios covering DIFFERENT policy areas. Each scenario must be unique and based on different real policies when provided.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      let text = content.text.trim();
      
      // Extract JSON from response
      if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/g, '');
      }
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      
      const response = JSON.parse(jsonText);
      return parseScenarioResponse(response.scenarios || [], county, personaId);
    }
    throw new Error('Unexpected response format from Anthropic');
  } catch (error) {
    console.error('Anthropic API error generating scenarios:', error);
    // Fallback to rule-based scenarios
    return generateFallbackScenarios(county);
  }
}

/**
 * Build the prompt for scenario generation
 * Now includes real policy data from News API
 */
function buildScenarioPrompt(
  county: County,
  policyData?: {
    articles: any[];
    federalBills: any[];
    stateBills: any[];
  }
): string {
  const demographics = county.demographics || {};
  const income = county.medianIncome || 60000;
  const politicalLean = county.politicalLean;

  // Build context from real policy data
  let realPolicyContext = '';
  if (policyData && policyData.articles.length > 0) {
    const articles = policyData.articles.slice(0, 15); // Use top 15 articles for variety
    realPolicyContext = `\n\nREAL POLICY CONTEXT (from News API - CRITICAL: Generate DIFFERENT scenarios based on these actual policies):\n\n`;
    realPolicyContext += `You MUST create 5-7 UNIQUE scenarios, each based on a DIFFERENT policy from this list. Do NOT repeat the same policy.\n\n`;
    
    articles.forEach((article, idx) => {
      realPolicyContext += `${idx + 1}. [${article.level.toUpperCase()}] ${article.title}\n`;
      realPolicyContext += `   Description: ${article.description.substring(0, 250)}...\n`;
      realPolicyContext += `   Topics: ${article.topics.join(', ') || 'Policy'}\n`;
      realPolicyContext += `   Source: ${article.source}\n`;
      realPolicyContext += `   URL: ${article.url}\n\n`;
    });
    
    realPolicyContext += `\nIMPORTANT: Create scenarios covering DIFFERENT policy areas (housing, healthcare, education, taxes, climate, etc.). Each scenario must reference a different real policy from above.\n`;
  } else {
    // If no real policy data, provide guidance for variety
    realPolicyContext = `\n\nSince no real policy data is available, generate 5-7 DIFFERENT scenarios covering:\n`;
    realPolicyContext += `1. Housing/Urban Development (rent control, affordable housing, zoning)\n`;
    realPolicyContext += `2. Healthcare (Medicaid expansion, mental health, prescription drugs)\n`;
    realPolicyContext += `3. Education (school funding, teacher pay, student loans)\n`;
    realPolicyContext += `4. Economic Policy (minimum wage, tax credits, small business support)\n`;
    realPolicyContext += `5. Environmental/Climate (renewable energy, pollution, conservation)\n`;
    realPolicyContext += `6. Infrastructure (transportation, broadband, water systems)\n`;
    realPolicyContext += `7. Social Services (childcare, elder care, food assistance)\n\n`;
  }

  return `Generate 5-7 realistic, engaging policy scenarios for a persona living in ${county.name}, ${county.stateName}.

${realPolicyContext}

County Context:
- Median income: $${income.toLocaleString()}
- Political leaning: ${politicalLean}
- Population: ${county.population.toLocaleString()}
- Demographics: Age ${demographics.age?.median || 38}, Education and race distribution available

Requirements:
1. **VARIETY IS CRITICAL**: Generate 5-7 COMPLETELY DIFFERENT scenarios. Each must cover a different policy area/topic.
2. If real policy data is provided above, base each scenario on a DIFFERENT real policy from the list. Each scenario = one unique policy.
3. Mix of policy types: federal (30%), state (40%), local (30%) - vary the types across scenarios
4. Each scenario must have a unique title and focus on different issues (housing, healthcare, education, environment, economy, etc.)
5. Focus on issues relevant to this region (${county.name}, ${county.stateName}) and income level ($${income.toLocaleString()})
6. Policies should have clear accept/reject outcomes with meaningful, realistic impacts
7. Make scenarios interesting and relatable - show how policies affect daily life
8. Reference actual policy names, bill numbers, or news sources when available from the real data above
9. DO NOT create multiple scenarios about the same topic or policy

Each scenario should have:
- title: Short, engaging title
- description: Brief description of what's happening
- policyType: "federal", "state", or "local"
- urgency: "low", "medium", or "high"
- affectedAreas: Array of 2-4 areas (e.g., ["Housing", "Healthcare", "Education"])
- policy: { name, summary, details, status: "proposed"/"debated"/"voting", proposer }
- regionalContext: Why this matters in ${county.name}
- impacts.ifAccepted: { financial: { incomeChange, taxChange, costOfLivingChange }, priorityChanges: {}, qualityOfLife: { description, affectedAreas }, longTerm: { description } }
- impacts.ifRejected: Same structure as ifAccepted
- impactNarratives.ifAccepted: A detailed 2-3 sentence narrative describing what happened to the persona months after accepting this policy. Make it realistic, personal, and show concrete impacts on their life (e.g., "Three months after the housing policy passed, [persona name] received a notice that their rent increase would be capped at 5%. This allowed them to finally start a small emergency fund...")
- impactNarratives.ifRejected: Same as ifAccepted but for rejecting the policy
- timelinePosition: 0-6 (when this decision appears)

Output as JSON:
{
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "string",
      "description": "string",
      "policyType": "federal" | "state" | "local",
      "urgency": "low" | "medium" | "high",
      "affectedAreas": ["string"],
      "policy": {
        "name": "string",
        "summary": "string",
        "details": "string",
        "status": "proposed" | "debated" | "voting",
        "proposer": "string"
      },
      "regionalContext": "string",
      "impacts": {
        "ifAccepted": {
          "financial": { "incomeChange": 0, "taxChange": 0, "costOfLivingChange": 0 },
          "priorityChanges": {},
          "qualityOfLife": { "description": "string", "affectedAreas": ["string"] },
          "longTerm": { "description": "string" }
        },
        "ifRejected": {
          "financial": { "incomeChange": 0, "taxChange": 0, "costOfLivingChange": 0 },
          "priorityChanges": {},
          "qualityOfLife": { "description": "string", "affectedAreas": ["string"] },
          "longTerm": { "description": "string" }
        }
      },
      "impactNarratives": {
        "ifAccepted": "A detailed narrative of what happened to the persona after accepting this policy",
        "ifRejected": "A detailed narrative of what happened to the persona after rejecting this policy"
      },
      "timelinePosition": 0
    }
  ]
}`;
}

/**
 * Parse and validate AI response
 */
function parseScenarioResponse(
  scenarios: any[],
  county: County,
  personaId: string
): PolicyScenario[] {
  return scenarios
    .slice(0, 7) // Limit to 7 scenarios
    .map((s, index) => ({
      id: s.id || `scenario-${personaId}-${index}`,
      title: s.title || 'Policy Decision',
      description: s.description || '',
      policyType: ['federal', 'state', 'local'].includes(s.policyType) 
        ? s.policyType 
        : 'state',
      urgency: ['low', 'medium', 'high'].includes(s.urgency)
        ? s.urgency
        : 'medium',
      affectedAreas: Array.isArray(s.affectedAreas) ? s.affectedAreas : [],
      policy: {
        name: s.policy?.name || 'Policy',
        summary: s.policy?.summary || '',
        details: s.policy?.details || '',
        status: ['proposed', 'debated', 'voting', 'pending'].includes(s.policy?.status)
          ? s.policy.status
          : 'proposed',
        proposer: s.policy?.proposer || 'Legislative Body',
      },
      regionalContext: s.regionalContext || `This policy affects residents of ${county.name}.`,
      impacts: {
        ifAccepted: {
          financial: {
            incomeChange: parseInt(s.impacts?.ifAccepted?.financial?.incomeChange) || 0,
            taxChange: parseInt(s.impacts?.ifAccepted?.financial?.taxChange) || 0,
            costOfLivingChange: parseFloat(s.impacts?.ifAccepted?.financial?.costOfLivingChange) || 0,
          },
          priorityChanges: s.impacts?.ifAccepted?.priorityChanges || {},
          qualityOfLife: {
            description: s.impacts?.ifAccepted?.qualityOfLife?.description || '',
            affectedAreas: s.impacts?.ifAccepted?.qualityOfLife?.affectedAreas || [],
          },
          longTerm: {
            description: s.impacts?.ifAccepted?.longTerm?.description || '',
            nextScenarioTriggers: s.impacts?.ifAccepted?.longTerm?.nextScenarioTriggers || [],
          },
        },
        ifRejected: {
          financial: {
            incomeChange: parseInt(s.impacts?.ifRejected?.financial?.incomeChange) || 0,
            taxChange: parseInt(s.impacts?.ifRejected?.financial?.taxChange) || 0,
            costOfLivingChange: parseFloat(s.impacts?.ifRejected?.financial?.costOfLivingChange) || 0,
          },
          priorityChanges: s.impacts?.ifRejected?.priorityChanges || {},
          qualityOfLife: {
            description: s.impacts?.ifRejected?.qualityOfLife?.description || '',
            affectedAreas: s.impacts?.ifRejected?.qualityOfLife?.affectedAreas || [],
          },
          longTerm: {
            description: s.impacts?.ifRejected?.longTerm?.description || '',
            nextScenarioTriggers: s.impacts?.ifRejected?.longTerm?.nextScenarioTriggers || [],
          },
        },
      },
      timelinePosition: parseInt(s.timelinePosition) || index,
      impactNarratives: {
        ifAccepted: s.impactNarratives?.ifAccepted || s.impacts?.ifAccepted?.longTerm?.description || 'The policy has been implemented and is affecting your life.',
        ifRejected: s.impactNarratives?.ifRejected || s.impacts?.ifRejected?.longTerm?.description || 'The policy was not implemented, and the situation continues.',
      },
    }))
    .sort((a, b) => a.timelinePosition - b.timelinePosition);
}

/**
 * Fallback rule-based scenario generation
 * Generates multiple different scenarios when AI is unavailable
 */
function generateFallbackScenarios(county: County): PolicyScenario[] {
  // Generate multiple different scenarios based on county characteristics
  const scenarios: PolicyScenario[] = [];
  const income = county.medianIncome || 60000;

  // 1. Housing policy
  scenarios.push({
    id: 'scenario-housing',
    title: 'Housing Affordability Initiative',
    description: 'A new proposal would create a housing trust fund to support affordable housing development.',
    policyType: 'local',
    urgency: 'high',
    affectedAreas: ['Housing', 'Cost of Living'],
    policy: {
      name: 'Affordable Housing Trust Fund',
      summary: 'Creates a dedicated fund for affordable housing construction and rental assistance',
      details: 'The proposal would allocate 2% of property taxes to support affordable housing initiatives.',
      status: 'proposed',
      proposer: 'City Council',
    },
    regionalContext: `Housing costs are a major concern in ${county.name}, with median income at $${county.medianIncome.toLocaleString()}.`,
    impacts: {
      ifAccepted: {
        financial: { incomeChange: 0, taxChange: -200, costOfLivingChange: -5 },
        priorityChanges: { 'Housing Affordability': -10 },
        qualityOfLife: {
          description: 'More affordable housing options become available over time.',
          affectedAreas: ['Housing Stability'],
        },
        longTerm: {
          description: 'Community becomes more accessible to diverse income levels.',
          nextScenarioTriggers: [],
        },
      },
      ifRejected: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: 5 },
        priorityChanges: { 'Housing Affordability': 15 },
        qualityOfLife: {
          description: 'Housing costs continue to rise, making it harder to stay in the area.',
          affectedAreas: ['Housing Stability', 'Financial Security'],
        },
        longTerm: {
          description: 'Area becomes less affordable for middle-income residents.',
          nextScenarioTriggers: [],
        },
      },
    },
    impactNarratives: {
      ifAccepted: `Several months after the housing trust fund was approved, you noticed something change. Your landlord sent a notice that instead of the usual 8% annual rent increase, it would only be 3% this year. That extra $150 per month in savings meant you could finally start putting money into an emergency fund. For the first time in years, you're not living paycheck to paycheck.`,
      ifRejected: `Without the housing trust fund, rental prices in your neighborhood continued their upward climb. Your landlord raised rent by 10% this year, and you had to take on a weekend side job just to cover the difference. The stress of working seven days a week is starting to wear on you, and you're considering moving to a cheaper area, even though it means a longer commute and leaving the community you've called home.`,
    },
    timelinePosition: 0,
  });

  // 2. Healthcare policy
  scenarios.push({
    id: 'scenario-healthcare',
    title: 'State Medicaid Expansion Proposal',
    description: 'A proposal to expand Medicaid coverage to more low-income residents.',
    policyType: 'state',
    urgency: 'high',
    affectedAreas: ['Healthcare', 'Financial Security'],
    policy: {
      name: 'Medicaid Expansion Act',
      summary: 'Expands Medicaid eligibility to cover more residents below 138% of poverty line',
      details: 'Would provide health insurance to an additional 150,000 state residents.',
      status: 'debated',
      proposer: 'State Legislature',
    },
    regionalContext: `Healthcare access is a major concern in ${county.name}, especially for residents earning around $${income.toLocaleString()}.`,
    impacts: {
      ifAccepted: {
        financial: { incomeChange: 0, taxChange: 100, costOfLivingChange: -8 },
        priorityChanges: { 'Healthcare Access': -15 },
        qualityOfLife: {
          description: 'Access to preventive care and treatment improves significantly.',
          affectedAreas: ['Healthcare Access', 'Health Outcomes'],
        },
        longTerm: {
          description: 'Better health outcomes lead to lower medical debt and missed work.',
          nextScenarioTriggers: [],
        },
      },
      ifRejected: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: 3 },
        priorityChanges: { 'Healthcare Access': 20 },
        qualityOfLife: {
          description: 'Many residents continue to go without necessary medical care.',
          affectedAreas: ['Healthcare Access', 'Financial Security'],
        },
        longTerm: {
          description: 'Untreated conditions lead to worse outcomes and higher emergency costs.',
          nextScenarioTriggers: [],
        },
      },
    },
    impactNarratives: {
      ifAccepted: `Six months after Medicaid expansion passed, you finally got that persistent cough checked out. The doctor found early-stage issues that would have been much worse without treatment. Your medical debt, which had been growing, started shrinking because preventive care is now covered. You're sleeping better knowing you and your family have health coverage.`,
      ifRejected: `Without Medicaid expansion, you continue to avoid going to the doctor because you can't afford it. That persistent pain you've been ignoring has gotten worse, but you know a doctor visit would mean choosing between rent and healthcare. You've started researching free clinics, but they're all an hour's drive away and have months-long waitlists.`,
    },
    timelinePosition: 1,
  });

  // 3. Education policy
  scenarios.push({
    id: 'scenario-education',
    title: 'Public School Funding Initiative',
    description: 'A local ballot measure to increase school funding through property tax.',
    policyType: 'local',
    urgency: 'medium',
    affectedAreas: ['Education', 'Taxes'],
    policy: {
      name: 'School District Funding Measure',
      summary: 'Increases property tax by 0.5% to fund teacher salaries and classroom resources',
      details: 'Would raise an additional $2 million annually for local schools.',
      status: 'voting',
      proposer: 'School Board',
    },
    regionalContext: `Schools in ${county.name} have struggled with teacher retention and outdated resources.`,
    impacts: {
      ifAccepted: {
        financial: { incomeChange: 0, taxChange: 300, costOfLivingChange: 2 },
        priorityChanges: { 'Education Quality': -12, 'Taxes': 8 },
        qualityOfLife: {
          description: 'Children benefit from better-funded schools with more resources.',
          affectedAreas: ['Education Quality', 'Child Development'],
        },
        longTerm: {
          description: 'Improved education outcomes benefit the entire community long-term.',
          nextScenarioTriggers: [],
        },
      },
      ifRejected: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: 0 },
        priorityChanges: { 'Education Quality': 10 },
        qualityOfLife: {
          description: 'Schools continue to struggle with resources and teacher shortages.',
          affectedAreas: ['Education Quality', 'Community Investment'],
        },
        longTerm: {
          description: 'Educational outcomes may continue to lag, affecting future opportunities.',
          nextScenarioTriggers: [],
        },
      },
    },
    impactNarratives: {
      ifAccepted: `After the school funding measure passed, your child's teacher stayed instead of moving to a better-paying district. The classroom now has updated textbooks and technology. You notice your child is more engaged with school. The extra $25 a month in taxes is noticeable, but you believe it's an investment in your child's future.`,
      ifRejected: `The school funding measure failed, and your child's favorite teacher announced they're leaving at the end of the year. Class sizes are getting larger, and the school is still using 10-year-old textbooks. You're starting to consider private school or moving to a different district, but both options seem financially out of reach.`,
    },
    timelinePosition: 2,
  });

  // 4. Economic policy
  scenarios.push({
    id: 'scenario-economy',
    title: 'Small Business Tax Credit Program',
    description: 'State program offers tax credits to small businesses that hire locally.',
    policyType: 'state',
    urgency: 'medium',
    affectedAreas: ['Employment', 'Economic Development'],
    policy: {
      name: 'Local Hiring Tax Credit',
      summary: 'Provides $3,000 tax credit per local hire to businesses with fewer than 50 employees',
      details: 'Aims to boost local employment and support small businesses.',
      status: 'proposed',
      proposer: 'State Economic Development Office',
    },
    regionalContext: `Small businesses are the backbone of ${county.name}'s economy, but many struggle to hire.`,
    impacts: {
      ifAccepted: {
        financial: { incomeChange: 2000, taxChange: -50, costOfLivingChange: 0 },
        priorityChanges: { 'Economic Opportunity': -10 },
        qualityOfLife: {
          description: 'More job opportunities and support for local businesses.',
          affectedAreas: ['Employment', 'Local Economy'],
        },
        longTerm: {
          description: 'Strengthened local economy benefits all residents.',
          nextScenarioTriggers: [],
        },
      },
      ifRejected: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: 0 },
        priorityChanges: { 'Economic Opportunity': 8 },
        qualityOfLife: {
          description: 'Small businesses continue to struggle with hiring and growth.',
          affectedAreas: ['Employment', 'Local Economy'],
        },
        longTerm: {
          description: 'Limited job opportunities may persist in the area.',
          nextScenarioTriggers: [],
        },
      },
    },
    impactNarratives: {
      ifAccepted: `Three months after the tax credit program launched, you got a callback from a local business you'd applied to months ago. They were finally able to afford hiring someone, and that someone was you. The new job pays better than your previous one, and you're working in your own community instead of commuting an hour away. The local economy feels more vibrant.`,
      ifRejected: `Without the tax credit program, the small businesses in your area continue to operate with skeleton crews. You've been looking for work for six months, but most local businesses say they can't afford to hire. You're considering taking a job in the city an hour away, which means less time with family and higher commuting costs.`,
    },
    timelinePosition: 3,
  });

  // 5. Climate/Environment policy
  scenarios.push({
    id: 'scenario-climate',
    title: 'Renewable Energy Transition Plan',
    description: 'County plan to transition to 50% renewable energy by 2030.',
    policyType: 'local',
    urgency: 'low',
    affectedAreas: ['Environment', 'Energy Costs'],
    policy: {
      name: 'Renewable Energy Mandate',
      summary: 'Requires county utilities to source 50% renewable energy, with phased implementation',
      details: 'Would create local green jobs but may slightly increase energy costs initially.',
      status: 'debated',
      proposer: 'County Commission',
    },
    regionalContext: `${county.name} faces both environmental concerns and energy affordability issues.`,
    impacts: {
      ifAccepted: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: 3 },
        priorityChanges: { 'Environmental Protection': -15, 'Cost of Living': 5 },
        qualityOfLife: {
          description: 'Better air quality and local green jobs, but slightly higher energy bills.',
          affectedAreas: ['Environmental Health', 'Job Opportunities'],
        },
        longTerm: {
          description: 'Long-term environmental and health benefits, plus potential for lower costs as technology improves.',
          nextScenarioTriggers: [],
        },
      },
      ifRejected: {
        financial: { incomeChange: 0, taxChange: 0, costOfLivingChange: -2 },
        priorityChanges: { 'Environmental Protection': 12 },
        qualityOfLife: {
          description: 'Energy costs remain stable short-term, but environmental concerns persist.',
          affectedAreas: ['Environmental Health', 'Long-term Sustainability'],
        },
        longTerm: {
          description: 'Missed opportunity for green jobs and environmental improvements.',
          nextScenarioTriggers: [],
        },
      },
    },
    impactNarratives: {
      ifAccepted: `A year after the renewable energy plan started, you notice the air quality has improved - your seasonal allergies aren't as bad. A new solar installation company opened in town and hired your neighbor. Your energy bill went up by about $15 a month, which is manageable. You're seeing more electric vehicle charging stations around, and the community feels like it's moving forward.`,
      ifRejected: `The renewable energy plan was rejected, and your energy costs stayed the same. But you've noticed more smoggy days, and your doctor mentioned that air quality could be affecting your child's asthma. You see news about green energy jobs going to neighboring counties, and you wonder if your area is falling behind.`,
    },
    timelinePosition: 4,
  });

  return scenarios;
}
