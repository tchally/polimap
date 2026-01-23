# Policy Data Sources

This document describes the real policy data sources integrated into the persona game system.

## Current Implementation

### 1. News API ✅ (Integrated)

**Status**: Fully integrated and working

**Usage**: 
- Fetches current policy-related news articles
- Searches by region, state, and county issues
- Categorizes articles by level (federal/state/local)
- Extracts policy topics from articles

**Configuration**:
- API Key: Set `NEWS_API_KEY` in your `.env` file
- Get your free API key at: https://newsapi.org/

**Features**:
- Real-time policy discussions
- Regional relevance based on county/state
- Topic extraction (Housing, Healthcare, Education, etc.)
- Automatic categorization by policy level

### 2. Congress.gov API ⚠️ (Placeholder)

**Status**: Placeholder implemented, requires API key setup

**Usage**:
- Would fetch federal bills and legislation
- Track bill status and latest actions
- Filter by relevance to county/state

**Next Steps**:
1. Sign up for Congress.gov API access
2. Get API key from: https://api.congress.gov/
3. Update `fetchCongressionalBills()` in `services/policyDataService.ts`

**Note**: The Congress.gov API requires:
- Free tier available for development
- Rate limits apply
- Requires proper endpoint configuration

### 3. State Legislative APIs 📋 (Future)

**Status**: Framework ready, needs state-specific implementation

**Potential Sources**:
- **Open States API**: Provides unified access to state legislative data
  - Website: https://openstates.org/
  - API docs: https://docs.openstates.org/
  
- **Individual State APIs**: Many states have their own APIs
  - Examples: California Legislative API, New York Senate API
  - Implementation varies by state

**Implementation Notes**:
- Each state has different API structures
- Would need to implement per-state or use Open States
- Consider rate limits and data freshness

## How It Works

1. **Scenario Generation Flow**:
   ```
   User clicks "Play" 
   → API fetches real policy data (News API)
   → AI generates scenarios based on real policies
   → Scenarios include actual policy names, sources, and details
   → User makes decisions on real policies
   ```

2. **Data Integration**:
   - `services/policyDataService.ts`: Fetches policy data
   - `app/api/persona/scenarios/route.ts`: Uses data in AI prompt
   - AI generates scenarios that reference real policies

3. **Fallback Behavior**:
   - If News API key is missing: Uses AI-generated realistic policies
   - If API fails: Falls back to rule-based scenarios
   - Always provides playable scenarios

## Adding New Sources

To add a new policy data source:

1. **Add fetch function** in `services/policyDataService.ts`:
   ```typescript
   export async function fetchNewSource(
     county: County,
     apiKey: string
   ): Promise<PolicyArticle[]> {
     // Implementation
   }
   ```

2. **Update `getAllPolicyData()`** to include new source:
   ```typescript
   const newData = await fetchNewSource(county, apiKey);
   ```

3. **Update scenario prompt** in `app/api/persona/scenarios/route.ts`:
   - Include new data in `buildScenarioPrompt()`
   - Format for AI context

## Rate Limits & Best Practices

### News API
- Free tier: 100 requests/day
- Production: Consider caching results
- Cache policy: 1 hour (set in API route)

### Congress.gov
- Varies by plan
- Implement request throttling
- Cache bill data (bills don't change frequently)

### Recommendations
1. Cache policy data for 1-6 hours
2. Fetch in background when persona is generated
3. Use fallbacks gracefully
4. Log API usage for monitoring

## Example Usage

```typescript
import { getAllPolicyData } from '@/services/policyDataService';

const policyData = await getAllPolicyData(county, process.env.NEWS_API_KEY);

// policyData contains:
// - articles: PolicyArticle[] (from News API)
// - federalBills: CongressionalBill[] (from Congress.gov - when implemented)
// - stateBills: CongressionalBill[] (from state APIs - when implemented)
```
