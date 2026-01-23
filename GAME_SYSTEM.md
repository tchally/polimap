# Persona Game System Documentation

## Overview

The persona game system allows users to play as a generated persona and make decisions about real policy scenarios, seeing how those decisions impact the persona's life.

## Architecture

### 1. Game State Management

**File**: `types/game.ts`

Defines the core game types:
- `PersonaGameState` - Tracks the persona's current situation (income, priorities, metrics)
- `PolicyScenario` - A policy decision the persona encounters
- `PolicyDecision` - User's choice (accept/reject) with before/after state
- `ScenarioImpact` - Detailed impacts of a decision

### 2. Policy Scenario Generation

**File**: `app/api/persona/scenarios/route.ts`

**Endpoint**: `POST /api/persona/scenarios`

**Purpose**: Generates 5-7 policy scenarios using AI based on:
- County demographics and politics
- Regional context
- Real policies being discussed in 2026
- Persona's priorities and income level

**Process**:
1. Receives `personaId` and `countyId`
2. Uses Claude AI to generate realistic policy scenarios
3. Each scenario includes:
   - Policy details (name, summary, status, proposer)
   - Accept/reject impacts (financial, priority changes, quality of life)
   - Regional context explaining why it matters
   - Timeline position

### 3. Game Initialization

**File**: `app/api/persona/initialize-game/route.ts`

**Endpoint**: `POST /api/persona/initialize-game`

**Purpose**: Creates initial game state for a persona

**Returns**: `PersonaGameState` with:
- Starting income from persona
- Initial priorities
- Metrics set to neutral (50/100)

### 4. Game Interface

**File**: `components/PersonaGame.tsx`

**Features**:
- **Game Stats Dashboard**: Shows financial security, quality of life, timeline progress
- **Policy Decision Cards**: Side-by-side accept/reject options
- **Impact Visualization**: Shows financial changes, priority shifts
- **Decision History**: Tracks all decisions made

**User Flow**:
1. User sees first policy scenario
2. Chooses to accept or reject
3. Game state updates (income, priorities, metrics)
4. Next scenario appears
5. Process repeats until all scenarios completed

## Decision Impacts

When a user makes a decision, the following are updated:

1. **Financial**:
   - `currentIncome` - Modified by `incomeChange`
   - Tax burden changes
   - Cost of living adjustments

2. **Priorities**:
   - Each priority's importance score shifts based on the decision
   - Reflects how the persona's concerns evolve

3. **Metrics**:
   - Financial Security (0-100)
   - Quality of Life (0-100)
   - Community Engagement (0-100)

## Policy Scenario Requirements

Scenarios generated should:
1. Be based on **real policies** discussed in 2026
2. Mix federal (30%), state (40%), and local (30%) policies
3. Be relevant to the region and persona's income level
4. Have clear, meaningful impacts
5. Be interesting and relatable

## Future Enhancements

### Phase 1: Real Policy Data Integration
- Integrate NewsAPI to fetch current policy discussions
- Use Congress.gov API for federal bills
- State legislative APIs for state bills
- Local government sources for local ordinances

### Phase 2: Dynamic Scenario Generation
- Scenarios adapt based on previous decisions
- Trigger new scenarios based on choice consequences
- Life events occur between policy decisions (job change, housing, etc.)

### Phase 3: Multi-Persona Comparison
- Play the same scenarios as different personas
- Compare how different people are affected by the same policies
- Show how demographics affect policy impacts

### Phase 4: Real-Time Policy Updates
- Scenarios update as real policies progress (proposed → debated → voting)
- Show actual voting results and outcomes
- Connect game decisions to real-world policy tracking

## Example Scenario Structure

```typescript
{
  id: "scenario-housing-1",
  title: "Affordable Housing Trust Fund",
  description: "City council proposes creating a dedicated fund for affordable housing...",
  policyType: "local",
  urgency: "high",
  affectedAreas: ["Housing", "Cost of Living"],
  policy: {
    name: "Affordable Housing Trust Fund Act",
    summary: "Allocates 2% of property taxes to affordable housing",
    details: "...",
    status: "voting",
    proposer: "City Council"
  },
  regionalContext: "Housing costs are a major concern...",
  impacts: {
    ifAccepted: {
      financial: { incomeChange: 0, taxChange: -200, costOfLivingChange: -5 },
      priorityChanges: { "Housing Affordability": -10 },
      qualityOfLife: { description: "...", affectedAreas: [...] },
      longTerm: { description: "...", nextScenarioTriggers: [] }
    },
    ifRejected: { /* ... */ }
  },
  timelinePosition: 0
}
```

## Testing

To test the game system:
1. Generate a persona for a county
2. Click "Play as [Persona Name]"
3. Make decisions on policy scenarios
4. Watch how metrics and income change
5. See decision history accumulate
