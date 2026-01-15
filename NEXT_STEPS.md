# Next Steps: Real Map & Data Integration

## Phase 1: Real US Map Implementation

### 1.1 Choose Mapping Library

**Option A: react-simple-maps** (Recommended)
- ✅ Lightweight and React-friendly
- ✅ SVG-based (scales well, good for web)
- ✅ Works with GeoJSON/TopoJSON
- ✅ Simple API, easy to customize
- 📦 Packages: `react-simple-maps`, `topojson-client`

**Option B: Leaflet with react-leaflet**
- ✅ Full-featured mapping library
- ✅ Good for complex interactions
- ⚠️ Requires map tiles (external dependencies)
- ⚠️ Slightly heavier bundle size

**Option C: D3 with d3-geo**
- ✅ Maximum control and customization
- ⚠️ More complex to implement
- ⚠️ Lower-level API

**Recommendation: Use react-simple-maps** - Best balance of simplicity and functionality for this use case.

### 1.2 Get GeoJSON/TopoJSON Data

**State Boundaries:**
- Source: US Census Bureau TIGER/Line Shapefiles
- Format: TopoJSON (smaller file size)
- Files needed:
  - `us-states.json` or `us-states-topo.json` (All 50 states + DC)
  - Can get from: https://github.com/topojson/us-atlas or Census Bureau directly

**County Boundaries:**
- Source: US Census Bureau TIGER/Line Shapefiles  
- Format: TopoJSON per state
- Files needed:
  - `counties/{state-abbrev}-counties-topo.json` (One file per state)
  - Can get from: https://github.com/topojson/us-atlas

**Alternative:** Use a CDN-hosted version or fetch from a data service

### 1.3 Implementation Steps

1. Install required packages:
   ```bash
   npm install react-simple-maps topojson-client d3-geo
   ```

2. Download/obtain GeoJSON files for states and counties
3. Store map data in `public/data/` or `data/` directory
4. Update `StateMap.tsx` to use react-simple-maps
5. Update `CountyMap.tsx` to render county boundaries
6. Ensure click handlers and tooltips still work with real map

---

## Phase 2: Real Data Integration

### 2.1 Data Collection Priority Order

**STEP 1: County-Level Election Results Data (PRIORITY)**

Get county-level election result data for both **local and federal elections** in every two-year span:
- 2024 (Presidential, House, Senate, State/Local)
- 2022 (House, Senate, State/Local, Midterms)
- 2020 (Presidential, House, Senate, State/Local)
- 2018 (House, Senate, State/Local, Midterms)
- 2016 (Presidential, House, Senate, State/Local)
- 2014 (House, Senate, State/Local, Midterms)
- 2012 (Presidential, House, Senate, State/Local)
- 2010 (House, Senate, State/Local, Midterms)
- 2008 (Presidential, House, Senate, State/Local)
- 2006 (House, Senate, State/Local, Midterms)
- 2004 (Presidential, House, Senate, State/Local)
- 2002 (House, Senate, State/Local, Midterms)
- 2000 (Presidential, House, Senate, State/Local)

**Data needed per election:**
- Federal: Presidential, House of Representatives, Senate
- Local: Governor, State Legislature, County-level offices (may vary by state)
- Results: Vote counts by candidate/party, total votes, margins
- Geography: County FIPS codes for matching

**STEP 2: Demographic Data**

After election data is collected, get:
- Population counts and estimates
- Age distributions (median age, age groups)
- Race/ethnicity breakdowns
- Education levels
- Income (median household income, income distribution)
- Employment/unemployment
- Housing data

**STEP 3: Additional Data (Future)**

- Economic indicators
- Local issues/priorities
- Public opinion surveys

### 2.2 Data Sources Research

**Election Data Sources:**

- **MIT Election Data Science Lab** - Comprehensive election results by county
  - URL: https://electionlab.mit.edu/data
  - Format: CSV, JSON available
  - Data: Presidential, Senate, House results by county (federal elections)
  - Coverage: Historical data available
  
- **Harvard Dataverse** - Detailed election datasets
  - URL: https://dataverse.harvard.edu/
  - Additional datasets for verification
  
- **Dave Leip's Atlas of U.S. Presidential Elections**
  - URL: https://uselectionatlas.org/
  - Good for historical presidential context
  
- **State Election Offices** - For local/state election data
  - Many states provide county-level data on official websites
  - Format and availability varies by state
  - May need to aggregate from multiple sources

- **Federal Election Commission (FEC)**
  - URL: https://www.fec.gov/data/elections/
  - Federal election data

**Demographic Data Sources:**

- **US Census Bureau API** - Official demographic data
  - URL: https://www.census.gov/data/developers/data-sets.html
  - API: https://api.census.gov/
  - Data: Population, age, race, income, education, housing
  - Requires API key (free registration)
  
- **American Community Survey (ACS)** - Detailed demographics
  - URL: https://www.census.gov/programs-surveys/acs
  - 5-year estimates for counties
  - Most detailed demographic data available

### 2.2 Data Structure Planning

**State Data Schema:**
```typescript
interface StateData {
  id: string;                    // FIPS code or abbreviation
  name: string;
  abbreviation: string;
  population: number;            // From Census
  politicalLean: PoliticalLean;  // Calculated from election results
  electionResults: {
    year: number;
    presidential: {
      democratic: number;
      republican: number;
      margin: number;
    };
    // ... other races
  };
  demographics: {
    medianAge: number;
    race: Record<string, number>;
    education: Record<string, number>;
    medianIncome: number;
  };
  topIssues: string[];          // From surveys/analysis
}
```

**County Data Schema:**
```typescript
interface CountyData {
  id: string;                    // FIPS code
  name: string;
  stateId: string;
  stateName: string;
  population: number;
  politicalLean: PoliticalLean;
  electionResults: {
    // Similar to state
  };
  demographics: {
    // Detailed county demographics
  };
  medianIncome: number;
  unemploymentRate: number;
  topIssues: string[];
  // ... other economic indicators
}
```

### 2.3 Data Integration Strategy

**Option A: Static Data Files (Good for MVP)**
- Download and process data files
- Store as JSON in `data/` directory
- Update periodically (monthly/quarterly)

**Option B: API Integration (Better for production)**
- Set up API clients for Census, MIT Election Lab
- Cache responses
- Update dynamically

**Option C: Hybrid Approach (Recommended)**
- Use static files for map geometries (rarely change)
- Use APIs for demographic/election data (frequently updated)
- Cache API responses

### 2.3 Data Structure Planning

**Election Results Data Structure:**
```typescript
interface ElectionResults {
  year: number;
  federal: {
    presidential?: {
      candidates: Array<{
        name: string;
        party: string;
        votes: number;
        percentage: number;
      }>;
      totalVotes: number;
    };
    senate?: Array<{
      seat: string; // State or class
      candidates: Array<{ name: string; party: string; votes: number }>;
      totalVotes: number;
    }>;
    house?: Array<{
      district: number;
      candidates: Array<{ name: string; party: string; votes: number }>;
      totalVotes: number;
    }>;
  };
  state: {
    governor?: Array<{ /* similar structure */ }>;
    stateLegislature?: Array<{ /* similar structure */ }>;
  };
  local?: {
    countyOffices?: Array<{ /* similar structure */ }>;
  };
}

interface CountyElectionData {
  countyFips: string;
  countyName: string;
  stateFips: string;
  stateName: string;
  elections: ElectionResults[]; // Array for each year (2024, 2022, 2020, etc.)
}
```

**Demographic Data Structure:**
```typescript
interface CountyDemographics {
  countyFips: string;
  year: number; // Census year or estimate year
  population: number;
  age: {
    median: number;
    distribution: Record<string, number>; // age groups
  };
  race: Record<string, number>; // race/ethnicity percentages
  education: Record<string, number>; // education levels
  income: {
    median: number;
    distribution: Record<string, number>;
  };
  employment: {
    unemploymentRate: number;
    laborForce: number;
  };
  housing: {
    medianHomeValue: number;
    homeownershipRate: number;
  };
}
```

### 2.4 Implementation Steps

**Phase 2.1: Election Data Collection (Current Priority)**

1. **Set up data directory structure**
   - Create `data/elections/` directory
   - Organize by year: `data/elections/2024/`, `data/elections/2022/`, etc.
   - Subdirectories: `federal/`, `state/`, `local/`

2. **Download/collect county-level election results**
   - Start with MIT Election Lab data for federal elections
   - Download data for years: 2024, 2022, 2020, 2018, 2016, 2014, 2012, 2010, 2008, 2006, 2004, 2002, 2000
   - Process and normalize to consistent format
   - Match counties by FIPS codes
   - Store in `data/elections/` directory

3. **Collect state/local election data**
   - Identify sources for each state
   - Download or scrape state-level data
   - Process and normalize format
   - Match with county FIPS codes

4. **Create data processing utilities**
   - `utils/electionDataProcessor.ts` - Process and normalize election data
   - `utils/dataValidation.ts` - Validate data integrity
   - `utils/fipsMatching.ts` - Match data by FIPS codes

5. **Update data types** (`types/index.ts`)
   - Add election results interfaces
   - Update State and County interfaces to include election data

**Phase 2.2: Demographic Data Collection (After Election Data)**

6. **Set up Census API client**
   - Create `utils/censusApi.ts` for API calls
   - Register for Census API key
   - Set up caching layer

7. **Fetch county demographic data**
   - Use Census API for population, age, race, income
   - Use ACS 5-year estimates for detailed demographics
   - Store in `data/demographics/` directory

8. **Process and integrate demographic data**
   - Match with county FIPS codes
   - Normalize formats
   - Update data structures

**Phase 2.3: Data Integration**

9. **Create data service layer**
   - `services/stateData.ts`
   - `services/countyData.ts`
   - `services/electionData.ts`
   - `services/demographicData.ts`

10. **Replace mock data** (`data/mockData.ts`)
    - Update to use real data sources
    - Keep mock data as fallback for development
    - Calculate political leanings from election data

---

## Phase 3: Persona Data Generation

Since personas are synthetic but data-informed, we'll need:

1. **Statistical profiles** based on county demographics
2. **Priorities algorithm** based on:
   - Local economic indicators
   - Regional surveys
   - County-level polling data
3. **Background generation** from:
   - Typical occupations in the area
   - Average household characteristics
   - Common concerns (from local news analysis)

---

## Recommended Order of Implementation

### Phase 1: Maps (COMPLETED ✅)

1. ✅ **Install mapping library** (react-simple-maps)
2. ✅ **Get state GeoJSON data**
3. ✅ **Replace StateMap with real map**
4. ✅ **Get county GeoJSON data**
5. ✅ **Replace CountyMap with real map**

### Phase 2: Data Integration (IN PROGRESS)

**Step 1: Election Data (CURRENT PRIORITY)**
- ⏳ **Collect county-level election results** (2024, 2022, 2020, 2018, 2016, 2014, 2012, 2010, 2008, 2006, 2004, 2002, 2000)
  - Federal elections (Presidential, House, Senate)
  - State/local elections (Governor, State Legislature, County offices)
- ⏳ **Process and normalize election data**
- ⏳ **Store in data/elections/ directory**
- ⏳ **Create election data service layer**

**Step 2: Demographic Data (NEXT)**
- ⬜ **Set up Census API client**
- ⬜ **Fetch county demographic data**
- ⬜ **Process and integrate demographic data**
- ⬜ **Create demographic data service layer**

**Step 3: Integration**
- ⬜ **Calculate political leanings from election data**
- ⬜ **Replace mock data with real data**
- ⬜ **Update data types and interfaces**

### Phase 3: Persona Generation (FUTURE)

- ⬜ **Update personas to be data-driven**
- ⬜ **Create persona generation algorithms**

---

## Resources & Links

### Map Data:
- https://github.com/topojson/us-atlas - Pre-processed TopoJSON files
- https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html - Official Census shapefiles

### Election Data:
- https://electionlab.mit.edu/data - MIT Election Data Science Lab (primary source for federal elections)
- https://dataverse.harvard.edu/ - Harvard Dataverse (additional datasets)
- https://uselectionatlas.org/ - Dave Leip's Atlas (presidential election data)
- https://www.fec.gov/data/elections/ - Federal Election Commission data
- State election office websites (for state/local data)

### Demographic Data:
- https://api.census.gov/ - US Census Bureau API (requires API key)
- https://www.census.gov/data/developers/data-sets/acs-5year.html - ACS 5-year data
- https://www.census.gov/programs-surveys/acs - American Community Survey

### Tools:
- https://mapshaper.org/ - Convert shapefiles to TopoJSON
- https://observablehq.com/@topojson/us-atlas - Explore US atlas data

### Data Storage Structure:
```
data/
  elections/
    2024/
      federal/
      state/
      local/
    2022/
      federal/
      state/
      local/
    ... (2020, 2018, 2016, 2014, 2012, 2010, 2008, 2006, 2004, 2002, 2000)
  demographics/
    counties/
    states/
```
