# Census Demographic Data

This directory contains county-level demographic data fetched from the US Census Bureau API.

## Data Source

Data is fetched from the **American Community Survey (ACS) 5-Year Estimates (2023)** via the Census Bureau API. This provides the most detailed demographic data available at the county level.

## Data Structure

Each JSON file contains an array of county demographic data with the following structure:

```typescript
{
  countyFips: string;        // 3-digit county FIPS code
  stateFips: string;         // 2-digit state FIPS code
  name: string;              // County name (e.g., "Los Angeles County, California")
  population: number;        // Total population
  medianAge: number;         // Median age
  race: {
    white: number;           // Percentage
    black: number;           // Percentage
    asian: number;           // Percentage
    nativeAmerican: number;  // Percentage
    pacificIslander: number; // Percentage
    other: number;          // Percentage
    twoOrMore: number;      // Percentage
    hispanic: number;       // Percentage (can overlap with other categories)
  };
  education: {
    lessThanHighSchool: number; // Percentage of population 25+
    highSchool: number;         // Percentage
    someCollege: number;        // Percentage
    associates: number;         // Percentage
    bachelors: number;          // Percentage
    graduate: number;           // Percentage
  };
  medianIncome: number;      // Median household income (2023 dollars)
  meanIncome: number;        // Mean household income (2023 dollars)
}
```

## Fetching Data

To fetch demographic data for counties, use the fetch script:

```bash
# Fetch data for specific states
npx tsx scripts/fetchCountyDemographics.ts CA TX FL

# Fetch data for all states (takes a while, may hit rate limits)
npx tsx scripts/fetchCountyDemographics.ts
```

The script will:
1. Fetch data from the Census API
2. Save it to JSON files in this directory
3. Show a summary of what was fetched

**Note:** The Census API has rate limits. If fetching all states, consider:
- Running the script in batches
- Adding delays between requests
- Running during off-peak hours

## Using the Data

The data can be used to enrich county objects in your application:

```typescript
import { enrichCountiesWithCensus } from '@/data/countyDemographicsFromCensus';
import { getAllCountiesFromElections } from '@/data/countyDataFromElections';

// Get counties from election data
const counties = await getAllCountiesFromElections();

// Enrich with Census demographics
const enrichedCounties = enrichCountiesWithCensus(counties);
```

## Available States

Currently fetched data for:
- ✅ California (58 counties)
- ✅ Texas (254 counties)
- ✅ Florida (67 counties)
- ✅ New York (62 counties)

To fetch more states, run:
```bash
npx tsx scripts/fetchCountyDemographics.ts [STATE_ABBR]
```

## API Variables Used

The following ACS variables are used:

**Population & Age:**
- `B01003_001E`: Total population
- `B01002_001E`: Median age

**Race:**
- `B02001_002E` through `B02001_008E`: Race categories
- `B03002_012E`: Hispanic or Latino

**Education:**
- `DP02_0059E` through `DP02_0066E`: Educational attainment (Profile tables)

**Income:**
- `DP03_0062E`: Median household income
- `DP03_0063E`: Mean household income

## Data Updates

Census data is updated annually. The 2023 ACS 5-year estimates represent data collected from 2019-2023.

To update data:
1. Wait for new ACS data release (typically in December)
2. Update the year in `utils/censusApi.ts` if needed
3. Re-run the fetch script

## Rate Limits

The Census API has rate limits:
- 500 requests per IP address per day (free tier)
- Consider caching responses
- Batch requests when possible

If you hit rate limits:
- Wait 24 hours
- Use a different IP address
- Contact Census Bureau for higher limits
