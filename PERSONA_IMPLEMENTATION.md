# Persona System Implementation Plan

## Overview

The persona system will dynamically generate realistic personas using AI, based on:
- County demographics (Census data)
- Local political context (election data)
- Regional economic conditions
- Current policy discussions (local and federal)

## Architecture

### 1. AI Persona Generation API
**File**: `app/api/persona/generate/route.ts`

**Purpose**: Generate a persona on-demand when user clicks "Create Persona"

**Inputs**:
- County demographics (age, race, education, income)
- County political lean
- County name and state
- Regional context (optional)

**AI Prompt Structure**:
```
Create a realistic persona for someone living in {countyName}, {stateName}.

Demographics:
- Median age: {age}
- Income distribution: {incomeData}
- Education levels: {educationData}
- Race/ethnicity: {raceData}
- Political leaning: {politicalLean}

Generate:
1. Name (culturally appropriate for demographics)
2. Age (realistic for county median ± 10 years)
3. Occupation (typical for area/education level)
4. Household (size, income, type - aligned with county data)
5. Top 3 priorities (based on local context and demographics)
6. Background story (connects persona to county/region)
7. Political alignment (realistic variation from county lean)
```

**Response**: `Persona` object matching the TypeScript interface

---

### 2. Policy Data Sources

#### Option A: News API (Recommended for Real-Time)
- **NewsAPI** (https://newsapi.org) - Free tier: 100 requests/day
- Filter by: county name, state, topics (politics, economy, housing, etc.)
- Extract: policies being discussed, proposed legislation, local issues

#### Option B: Legislative APIs
- **Congress.gov API** - Federal bills and resolutions
- **State legislative APIs** (varies by state)
- **Ballotpedia API** - Local ballot measures

#### Option C: Web Scraping (Backup)
- Local news sites
- City/county council agendas
- State legislature websites

**Implementation**: `utils/policyFetcher.ts`
- Fetch recent policy discussions
- Parse and categorize by issue type
- Cache for 24 hours

---

### 3. Policy Impact Analysis

**File**: `app/api/policy/impact/route.ts`

**Purpose**: Calculate how a policy affects a specific persona

**Process**:
1. Receive: Policy description + Persona data
2. AI analyzes: 
   - Direct impacts (income, housing, healthcare, etc.)
   - Indirect impacts (community, economy, environment)
   - Alignment with persona priorities
3. Return: Impact assessment with outcomes

**AI Prompt**:
```
Analyze how this policy affects {personaName}, a {age}-year-old {occupation} 
in {countyName}, {stateName}:

Persona context:
- Income: {income}
- Priorities: {priorities}
- Political views: {alignment}

Policy: {policyDescription}

Provide:
1. Direct impacts (financial, practical)
2. Indirect impacts (community, long-term)
3. Priority alignment (how this affects their top concerns)
4. Positive outcomes (if passed)
5. Negative outcomes (if passed)
6. Alternative scenarios
```

---

### 4. Game-Like Decision System

**File**: `components/PersonaExploration.tsx` (enhanced)

**Features**:
- **Life Events**: Random or triggered events (job change, housing issue, policy vote)
- **Choices**: User makes decisions as the persona
- **Consequences**: Show immediate and long-term impacts
- **Progress Tracking**: Track persona's situation over time
- **Policy Votes**: Present policies, let user decide how persona votes

**State Management**:
```typescript
interface PersonaGameState {
  persona: Persona;
  currentScenario: Scenario | null;
  decisions: Decision[];
  impacts: Impact[];
  currentIncome: number;
  currentPriorities: Priority[];
  timeline: Event[];
}
```

---

## Implementation Phases

### Phase 1: AI Persona Generation (Start Here)

1. **Choose AI Provider**
   - OpenAI GPT-4 (recommended for quality)
   - Anthropic Claude (good alternative)
   - Google Gemini (cost-effective)
   - Open source: Llama 3, Mistral (requires self-hosting)

2. **Install AI SDK**
   ```bash
   npm install openai  # or @anthropic-ai/sdk, @google/generative-ai
   ```

3. **Create API Route**
   - `app/api/persona/generate/route.ts`
   - Accept county ID
   - Fetch county data
   - Generate persona via AI
   - Return Persona object

4. **Update PersonaScreen**
   - Add "Generate Persona" button
   - Show loading state
   - Display generated persona
   - Cache generated personas (localStorage or API cache)

---

### Phase 2: Policy Data Integration

1. **Set up News API**
   - Register for NewsAPI key
   - Create `utils/newsApi.ts`
   - Fetch recent news for county/state
   - Extract policy discussions

2. **Create Policy Service**
   - `services/policyService.ts`
   - Fetch and cache policies
   - Categorize by issue type
   - Match to persona priorities

3. **Update PersonaExploration**
   - Fetch real policies for persona's region
   - Show policies relevant to persona's priorities
   - Use real policy text instead of mock scenarios

---

### Phase 3: Policy Impact Analysis

1. **Create Impact API**
   - `app/api/policy/impact/route.ts`
   - Accept policy + persona
   - Use AI to analyze impact
   - Return structured impact data

2. **Update Scenario Display**
   - Show real policy impacts
   - Display AI-generated outcomes
   - Calculate priority changes based on impacts

---

### Phase 4: Game Mechanics

1. **Add Decision System**
   - Present choices at key moments
   - Track user decisions
   - Calculate consequences

2. **Add Timeline/Events**
   - Random life events
   - Policy votes
   - Economic changes
   - Community issues

3. **Add Progress Tracking**
   - Visualize persona's situation over time
   - Show how choices affect priorities/income
   - Compare different decision paths

---

## API Keys Needed

1. **AI Provider** (choose one):
   - OpenAI: `OPENAI_API_KEY`
   - Anthropic: `ANTHROPIC_API_KEY`
   - Google: `GOOGLE_AI_API_KEY`

2. **News API** (optional):
   - `NEWS_API_KEY`

Add to `.env`:
```
OPENAI_API_KEY=your_key_here
NEWS_API_KEY=your_key_here
```

---

## Example AI Persona Generation Prompt

```
You are creating a realistic persona for a political empathy application.

Create a persona for someone living in Alameda County, California.

County Context:
- Median age: 38 years
- Median household income: $126,240
- Political leaning: Strongly Democratic (68% Democratic)
- Education: 42% Bachelor's degree or higher
- Race/Ethnicity: 33% White, 23% Asian, 23% Hispanic, 13% Other

Generate a realistic persona with:
1. Name (appropriate for demographics)
2. Age (between 28-48, near median)
3. Occupation (realistic for education/income level)
4. Household: size (1-4 people), income (within county range), type (renting/owning)
5. Top 3 priorities (based on local context - housing costs, climate, etc.)
6. Political alignment (Democratic-leaning, but with personal nuance)
7. Background story (1-2 sentences connecting them to the area)

Output as JSON matching this structure:
{
  "name": "string",
  "age": number,
  "occupation": "string",
  "householdInfo": {
    "size": number,
    "income": number,
    "type": "string"
  },
  "politicalAlignment": "democratic" | "republican" | "swing" | "strongly-democratic" | "strongly-republican",
  "topPriorities": [
    {
      "issue": "string",
      "importance": number (0-100),
      "description": "string"
    }
  ],
  "background": "string"
}
```

---

## Next Steps

1. **Choose AI provider** and get API key
2. **Implement Phase 1** (AI persona generation)
3. **Test with multiple counties** to ensure variety
4. **Add caching** to avoid regenerating same personas
5. **Iterate on prompts** for better realism

Then proceed to Phase 2 (policy data) and beyond.
