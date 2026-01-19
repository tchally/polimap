# Next Steps: Persona System Implementation

## ✅ What's Been Set Up

1. **AI Persona Generation API Route** (`app/api/persona/generate/route.ts`)
   - Supports OpenAI, Anthropic, or Google AI
   - Falls back to rule-based generation if no AI key is configured
   - Generates personas based on county demographics and politics

## 🚧 Immediate Next Steps

### Step 1: Choose and Configure AI Provider

**Option A: OpenAI (Recommended for quality)**
```bash
npm install openai
```
Add to `.env`:
```
OPENAI_API_KEY=your_key_here
```

**Option B: Anthropic Claude (Good alternative)**
```bash
npm install @anthropic-ai/sdk
```
Add to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

**Option C: Google Gemini (Cost-effective)**
```bash
npm install @google/generative-ai
```
Add to `.env`:
```
GOOGLE_AI_API_KEY=your_key_here
```

**Option D: No AI (Use fallback)**
- The API already has a rule-based fallback
- Personas will be simpler but functional

### Step 2: Update PersonaScreen Component

Update `components/PersonaScreen.tsx` to:
1. Add "Generate Persona" button when no persona exists
2. Call `/api/persona/generate` when button is clicked
3. Show loading state during generation
4. Display the generated persona
5. Cache generated personas (localStorage or API cache)

**Example integration:**
```typescript
const [generatingPersona, setGeneratingPersona] = useState(false);

const handleGeneratePersona = async () => {
  setGeneratingPersona(true);
  try {
    const response = await fetch('/api/persona/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countyId: selectedCounty.id }),
    });
    const generatedPersona = await response.json();
    setSelectedPersona(generatedPersona);
  } catch (error) {
    console.error('Failed to generate persona:', error);
  } finally {
    setGeneratingPersona(false);
  }
};
```

### Step 3: Test Persona Generation

1. Start dev server: `npm run dev`
2. Navigate to a county (e.g., California > Alameda County)
3. Click "Generate Persona" button
4. Verify persona is generated with realistic data
5. Test with different counties to ensure variety

---

## 🎯 Future Enhancements

### Phase 2: Policy Data Integration

**Goal**: Get real policy discussions for each county/state

**Options**:
1. **NewsAPI** (https://newsapi.org) - Free tier: 100 requests/day
   - Fetch recent news for county/state
   - Extract policy discussions
   - Categorize by issue type

2. **Congress.gov API** - Federal bills and resolutions
   - Track active legislation
   - Filter by state/county impact

3. **State Legislative APIs** - Varies by state
   - Track state-level bills
   - Local ballot measures

**Implementation**:
- Create `utils/newsApi.ts` or `utils/policyFetcher.ts`
- Fetch and cache policy discussions
- Match policies to persona priorities
- Update `PersonaExploration` to show real policies

### Phase 3: Policy Impact Analysis

**Goal**: Use AI to analyze how policies affect specific personas

**Implementation**:
- Create `app/api/policy/impact/route.ts`
- Accept: policy description + persona data
- Use AI to analyze:
  - Direct impacts (income, housing, healthcare)
  - Indirect impacts (community, economy)
  - Alignment with persona priorities
- Return structured impact assessment

**Example Prompt**:
```
Analyze how this policy affects {personaName}, a {age}-year-old {occupation} 
in {countyName}, {stateName}.

Persona:
- Income: {income}
- Priorities: {priorities}
- Political views: {alignment}

Policy: {policyDescription}

Provide:
1. Direct impacts (financial, practical)
2. Indirect impacts (community, long-term)
3. Priority alignment
4. Positive outcomes if passed
5. Negative outcomes if passed
```

### Phase 4: Game-Like Decision System

**Goal**: Make it feel like a game where users make choices as the persona

**Features**:
1. **Life Events**: Random or triggered events
   - Job change
   - Housing issue
   - Policy vote
   - Economic change

2. **Choices**: User decides how persona responds
   - Vote on policy
   - Make financial decision
   - Choose priorities

3. **Consequences**: Show immediate and long-term impacts
   - Income changes
   - Priority shifts
   - Community effects

4. **Progress Tracking**: Visualize persona's situation over time
   - Timeline of events
   - Income/priority changes
   - Compare different paths

**Implementation**:
- Enhance `PersonaExploration` component
- Add state management for game state
- Create event system
- Add visualizations for progress

---

## 📋 Quick Start Checklist

- [ ] Choose AI provider (OpenAI, Anthropic, or Google)
- [ ] Install AI SDK package
- [ ] Add API key to `.env`
- [ ] Update `PersonaScreen` to support generation
- [ ] Test persona generation with different counties
- [ ] Iterate on AI prompts for better realism
- [ ] Add persona caching (optional)
- [ ] Set up policy data sources (Phase 2)
- [ ] Implement policy impact analysis (Phase 3)
- [ ] Build game-like decision system (Phase 4)

---

## 🔑 API Keys Needed

1. **AI Provider** (choose one):
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/
   - Google AI: https://aistudio.google.com/app/apikey

2. **News API** (optional, for Phase 2):
   - NewsAPI: https://newsapi.org/register

---

## 📝 Notes

- The API route supports multiple AI providers with automatic fallback
- Personas are generated on-demand (not pre-generated)
- Consider caching generated personas to reduce API costs
- Test with diverse counties to ensure variety in generated personas
- Iterate on prompts to improve realism and relevance
