/**
 * Census API Client
 * Fetches demographic data from the US Census Bureau API
 * Uses ACS 5-year estimates for detailed county-level data
 */

// ACS 5-Year API Base URL
const CENSUS_API_BASE = 'https://api.census.gov/data/2023/acs/acs5';
const CENSUS_API_PROFILE = 'https://api.census.gov/data/2023/acs/acs5/profile';

// Get API key from environment
function getApiKey(): string {
  const apiKey = process.env.CENSUS_API_KEY || process.env.NEXT_PUBLIC_CENSUS_API_KEY;
  if (!apiKey) {
    throw new Error('CENSUS_API_KEY or NEXT_PUBLIC_CENSUS_API_KEY not found in environment variables');
  }
  return apiKey;
}

/**
 * ACS Variable Codes Reference:
 * 
 * Population:
 * - B01003_001E: Total population
 * 
 * Age:
 * - B01002_001E: Median age by sex (total)
 * - B01001_003E to B01001_025E: Male age groups
 * - B01001_027E to B01001_049E: Female age groups
 * 
 * Race (B02001):
 * - B02001_001E: Total population for race
 * - B02001_002E: White alone
 * - B02001_003E: Black or African American alone
 * - B02001_004E: American Indian and Alaska Native alone
 * - B02001_005E: Asian alone
 * - B02001_006E: Native Hawaiian and Other Pacific Islander alone
 * - B02001_007E: Some other race alone
 * - B02001_008E: Two or more races
 * 
 * Hispanic/Latino (B03002):
 * - B03002_001E: Total population
 * - B03002_002E: Not Hispanic or Latino
 * - B03002_003E: Not Hispanic or Latino - White alone
 * - B03002_012E: Hispanic or Latino
 * 
 * Education (DP02 - Profile):
 * - DP02_0059E: Population 25 years and over
 * - DP02_0060E: Less than 9th grade
 * - DP02_0061E: 9th to 12th grade, no diploma
 * - DP02_0062E: High school graduate (includes equivalency)
 * - DP02_0063E: Some college, no degree
 * - DP02_0064E: Associate's degree
 * - DP02_0065E: Bachelor's degree
 * - DP02_0066E: Graduate or professional degree
 * 
 * Income (DP03 - Profile):
 * - DP03_0062E: Median household income (in 2023 inflation-adjusted dollars)
 * - DP03_0063E: Mean household income
 * - DP03_0077E to DP03_0086E: Income brackets
 */

export interface CensusCountyData {
  countyFips: string;
  stateFips: string;
  name: string;
  population: number;
  medianAge: number;
  race: {
    white: number;
    black: number;
    asian: number;
    nativeAmerican: number;
    pacificIslander: number;
    other: number;
    twoOrMore: number;
    hispanic: number;
  };
  education: {
    lessThanHighSchool: number;
    highSchool: number;
    someCollege: number;
    associates: number;
    bachelors: number;
    graduate: number;
  };
  medianIncome: number;
  meanIncome: number;
}

/**
 * Fetch raw data from Census API
 */
async function fetchCensusData(
  endpoint: string,
  variables: string[],
  geography: { for: string; in?: string }
): Promise<any[]> {
  const apiKey = getApiKey();
  const vars = ['NAME', ...variables].join(',');
  const geoParam = geography.in 
    ? `for=${geography.for}&in=${geography.in}`
    : `for=${geography.for}`;
  
  const url = `${endpoint}?get=${vars}&${geoParam}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    if (!response.ok || text.trim().startsWith('<')) {
      throw new Error(`Census API error: ${response.status} - ${text.substring(0, 200)}`);
    }
    
    const data = JSON.parse(text);
    // First row is headers, return data rows
    return data.slice(1);
  } catch (error) {
    console.error(`Error fetching Census data from ${url}:`, error);
    throw error;
  }
}

/**
 * Parse numeric value from Census API response
 */
function parseValue(value: string | null | undefined): number {
  if (!value || value === 'null' || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate percentage from count and total
 */
function calculatePercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Fetch basic population and age data for counties
 */
async function fetchPopulationAndAge(
  stateFips: string,
  countyFips?: string
): Promise<Map<string, { population: number; medianAge: number; name: string }>> {
  const geography = countyFips
    ? { for: `county:${countyFips}`, in: `state:${stateFips}` }
    : { for: `county:*`, in: `state:${stateFips}` };
  
  const variables = ['B01003_001E', 'B01002_001E'];
  const data = await fetchCensusData(CENSUS_API_BASE, variables, geography);
  
  const result = new Map<string, { population: number; medianAge: number; name: string }>();
  
  for (const row of data) {
    const [name, population, medianAge, state, county] = row;
    const fips = `${state}${county}`;
    result.set(fips, {
      population: parseValue(population),
      medianAge: parseValue(medianAge),
      name: name as string,
    });
  }
  
  return result;
}

/**
 * Fetch race and ethnicity data for counties
 */
async function fetchRaceData(
  stateFips: string,
  countyFips?: string
): Promise<Map<string, CensusCountyData['race']>> {
  const geography = countyFips
    ? { for: `county:${countyFips}`, in: `state:${stateFips}` }
    : { for: `county:*`, in: `state:${stateFips}` };
  
  const variables = [
    'B02001_001E', // Total
    'B02001_002E', // White alone
    'B02001_003E', // Black alone
    'B02001_004E', // Native American alone
    'B02001_005E', // Asian alone
    'B02001_006E', // Pacific Islander alone
    'B02001_007E', // Other race alone
    'B02001_008E', // Two or more races
    'B03002_012E', // Hispanic or Latino
  ];
  
  const data = await fetchCensusData(CENSUS_API_BASE, variables, geography);
  const result = new Map<string, CensusCountyData['race']>();
  
  for (const row of data) {
    const [, total, white, black, native, asian, pacific, other, twoOrMore, hispanic, state, county] = row;
    const fips = `${state}${county}`;
    const totalPop = parseValue(total);
    
    result.set(fips, {
      white: calculatePercentage(parseValue(white), totalPop),
      black: calculatePercentage(parseValue(black), totalPop),
      asian: calculatePercentage(parseValue(asian), totalPop),
      nativeAmerican: calculatePercentage(parseValue(native), totalPop),
      pacificIslander: calculatePercentage(parseValue(pacific), totalPop),
      other: calculatePercentage(parseValue(other), totalPop),
      twoOrMore: calculatePercentage(parseValue(twoOrMore), totalPop),
      hispanic: calculatePercentage(parseValue(hispanic), totalPop),
    });
  }
  
  return result;
}

/**
 * Fetch education data for counties
 */
async function fetchEducationData(
  stateFips: string,
  countyFips?: string
): Promise<Map<string, CensusCountyData['education']>> {
  const geography = countyFips
    ? { for: `county:${countyFips}`, in: `state:${stateFips}` }
    : { for: `county:*`, in: `state:${stateFips}` };
  
  const variables = [
    'DP02_0059E', // Population 25+
    'DP02_0060E', // Less than 9th grade
    'DP02_0061E', // 9th to 12th grade, no diploma
    'DP02_0062E', // High school graduate
    'DP02_0063E', // Some college, no degree
    'DP02_0064E', // Associate's degree
    'DP02_0065E', // Bachelor's degree
    'DP02_0066E', // Graduate or professional degree
  ];
  
  const data = await fetchCensusData(CENSUS_API_PROFILE, variables, geography);
  const result = new Map<string, CensusCountyData['education']>();
  
  for (const row of data) {
    const [, pop25Plus, lessThan9, noDiploma, highSchool, someCollege, associates, bachelors, graduate, state, county] = row;
    const fips = `${state}${county}`;
    const total = parseValue(pop25Plus);
    
    if (total === 0) {
      result.set(fips, {
        lessThanHighSchool: 0,
        highSchool: 0,
        someCollege: 0,
        associates: 0,
        bachelors: 0,
        graduate: 0,
      });
      continue;
    }
    
    const lessThanHighSchool = parseValue(lessThan9) + parseValue(noDiploma);
    
    result.set(fips, {
      lessThanHighSchool: calculatePercentage(lessThanHighSchool, total),
      highSchool: calculatePercentage(parseValue(highSchool), total),
      someCollege: calculatePercentage(parseValue(someCollege), total),
      associates: calculatePercentage(parseValue(associates), total),
      bachelors: calculatePercentage(parseValue(bachelors), total),
      graduate: calculatePercentage(parseValue(graduate), total),
    });
  }
  
  return result;
}

/**
 * Fetch income data for counties
 */
async function fetchIncomeData(
  stateFips: string,
  countyFips?: string
): Promise<Map<string, { medianIncome: number; meanIncome: number }>> {
  const geography = countyFips
    ? { for: `county:${countyFips}`, in: `state:${stateFips}` }
    : { for: `county:*`, in: `state:${stateFips}` };
  
  const variables = ['DP03_0062E', 'DP03_0063E']; // Median and mean income
  
  const data = await fetchCensusData(CENSUS_API_PROFILE, variables, geography);
  const result = new Map<string, { medianIncome: number; meanIncome: number }>();
  
  for (const row of data) {
    const [, medianIncome, meanIncome, state, county] = row;
    const fips = `${state}${county}`;
    
    result.set(fips, {
      medianIncome: parseValue(medianIncome),
      meanIncome: parseValue(meanIncome),
    });
  }
  
  return result;
}

/**
 * Fetch complete demographic data for all counties in a state
 */
export async function fetchCountyDemographics(
  stateFips: string
): Promise<Map<string, CensusCountyData>> {
  console.log(`Fetching demographics for all counties in state FIPS: ${stateFips}`);
  
  // Fetch all data in parallel
  const [populationData, raceData, educationData, incomeData] = await Promise.all([
    fetchPopulationAndAge(stateFips),
    fetchRaceData(stateFips),
    fetchEducationData(stateFips),
    fetchIncomeData(stateFips),
  ]);
  
  // Combine all data
  const result = new Map<string, CensusCountyData>();
  const allFips = new Set([
    ...populationData.keys(),
    ...raceData.keys(),
    ...educationData.keys(),
    ...incomeData.keys(),
  ]);
  
  for (const fips of allFips) {
    const pop = populationData.get(fips);
    const race = raceData.get(fips);
    const education = educationData.get(fips);
    const income = incomeData.get(fips);
    
    if (!pop) {
      console.warn(`Missing population data for county FIPS: ${fips}`);
      continue;
    }
    
    result.set(fips, {
      countyFips: fips.substring(2), // Remove state FIPS prefix
      stateFips: stateFips,
      name: pop.name,
      population: pop.population,
      medianAge: pop.medianAge,
      race: race || {
        white: 0,
        black: 0,
        asian: 0,
        nativeAmerican: 0,
        pacificIslander: 0,
        other: 0,
        twoOrMore: 0,
        hispanic: 0,
      },
      education: education || {
        lessThanHighSchool: 0,
        highSchool: 0,
        someCollege: 0,
        associates: 0,
        bachelors: 0,
        graduate: 0,
      },
      medianIncome: income?.medianIncome || 0,
      meanIncome: income?.meanIncome || 0,
    });
  }
  
  console.log(`Successfully fetched data for ${result.size} counties`);
  return result;
}

/**
 * Fetch demographic data for a single county
 */
export async function fetchSingleCountyDemographics(
  stateFips: string,
  countyFips: string
): Promise<CensusCountyData | null> {
  const [populationData, raceData, educationData, incomeData] = await Promise.all([
    fetchPopulationAndAge(stateFips, countyFips),
    fetchRaceData(stateFips, countyFips),
    fetchEducationData(stateFips, countyFips),
    fetchIncomeData(stateFips, countyFips),
  ]);
  
  const fullFips = `${stateFips}${countyFips}`;
  const pop = populationData.get(fullFips);
  
  if (!pop) {
    return null;
  }
  
  return {
    countyFips: countyFips,
    stateFips: stateFips,
    name: pop.name,
    population: pop.population,
    medianAge: pop.medianAge,
    race: raceData.get(fullFips) || {
      white: 0,
      black: 0,
      asian: 0,
      nativeAmerican: 0,
      pacificIslander: 0,
      other: 0,
      twoOrMore: 0,
      hispanic: 0,
    },
    education: educationData.get(fullFips) || {
      lessThanHighSchool: 0,
      highSchool: 0,
      someCollege: 0,
      associates: 0,
      bachelors: 0,
      graduate: 0,
    },
    medianIncome: incomeData.get(fullFips)?.medianIncome || 0,
    meanIncome: incomeData.get(fullFips)?.meanIncome || 0,
  };
}

/**
 * State FIPS code mapping
 */
export const STATE_FIPS: Record<string, string> = {
  'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05',
  'CA': '06', 'CO': '08', 'CT': '09', 'DE': '10',
  'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16',
  'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20',
  'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
  'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28',
  'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32',
  'NH': '33', 'NJ': '34', 'NM': '35', 'NY': '36',
  'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40',
  'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
  'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49',
  'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54',
  'WI': '55', 'WY': '56', 'DC': '11',
};
