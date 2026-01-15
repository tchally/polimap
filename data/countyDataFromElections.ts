/**
 * Generate all counties from election data
 * Creates County objects for all counties in all 50 states from real election data
 */

import { County, PoliticalLean } from '@/types';
import { loadElectionData, getElectionDataForState, getCountyPoliticalLean } from './electionData';
import { ElectionResult } from '@/utils/electionDataParser';

let allCountiesCache: County[] | null = null;

// State name mapping
const stateNameMap: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

/**
 * Estimate county population from election data (approximate)
 * Uses turnout rate estimates and voting-eligible population
 */
function estimateCountyPopulation(totalVotes: number, year: number): number {
  // Rough estimates: turnout rates vary but we can use average ~60% for presidential elections
  // This is a very rough estimate - will be replaced with real census data later
  const estimatedTurnout = 0.60;
  const population = Math.round(totalVotes / estimatedTurnout);
  return Math.max(population, 1000); // Minimum population
}

/**
 * Estimate median income from county name/state (placeholder until real data)
 * This is a rough estimate based on typical patterns
 */
function estimateMedianIncome(stateAbbr: string, countyName: string): number {
  // Very rough estimates - will be replaced with real census data
  // Large urban counties tend to have higher incomes
  const largeUrbanIndicators = ['Los Angeles', 'New York', 'Cook', 'Harris', 'Maricopa', 'Dallas'];
  const isLargeUrban = largeUrbanIndicators.some(indicator => 
    countyName.toLowerCase().includes(indicator.toLowerCase())
  );
  
  // Rough state-level averages (in thousands)
  const stateAverages: Record<string, number> = {
    'CA': 80, 'NY': 72, 'NJ': 85, 'MA': 85, 'CT': 80,
    'TX': 65, 'FL': 60, 'PA': 62, 'OH': 58, 'GA': 61,
    'NC': 57, 'MI': 59, 'AZ': 62, 'WA': 82, 'CO': 75,
    'VA': 76, 'MD': 87, 'OR': 67, 'MN': 74, 'WI': 66,
  };
  
  const baseIncome = stateAverages[stateAbbr] || 60;
  return isLargeUrban ? baseIncome + 10 : baseIncome;
}

/**
 * Generate County object from election data
 */
async function generateCountyFromElectionData(
  electionData: { countyFips: string; countyName: string; stateAbbr: string; elections: ElectionResult[] }
): Promise<County> {
  const { countyFips, countyName, stateAbbr, elections } = electionData;
  
  if (elections.length === 0) {
    throw new Error(`No election data for county ${countyName}`);
  }

  // Get most recent election for population estimate
  const mostRecentElection = elections[0];
  const estimatedPopulation = estimateCountyPopulation(
    mostRecentElection.totalVotes,
    mostRecentElection.year
  );

  // Calculate political lean from election data
  const politicalLean = await getCountyPoliticalLean(countyFips);

  // Generate county ID: STATE-CountyName (normalized)
  const normalizedCountyName = countyName
    .replace(/\s(county|parish|borough|census area)$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  const countyId = `${stateAbbr}-${normalizedCountyName}`;

  // Estimate demographics (placeholder until real census data)
  const estimatedMedianIncome = estimateMedianIncome(stateAbbr, countyName);

  // Get state FIPS code for full FIPS
  const STATE_FIPS: Record<string, string> = {
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
  
  // countyFips from election data is already 5 digits (state + county) from the parser
  // So we can use it directly
  const fullFips = countyFips.padStart(5, '0');
  
  // Debug: Log first few counties to verify FIPS is set
  if (countyName.includes('Alameda') || countyName.includes('Los Angeles')) {
    console.log(`🏷️ Creating county: ${countyName}, FIPS: ${fullFips}, State: ${stateAbbr}`);
  }

  return {
    id: countyId,
    name: countyName.includes('County') || countyName.includes('Parish') || countyName.includes('Borough')
      ? countyName
      : `${countyName} County`,
    stateId: stateAbbr,
    stateName: stateNameMap[stateAbbr] || stateAbbr,
    population: estimatedPopulation,
    politicalLean,
    medianIncome: estimatedMedianIncome * 1000, // Convert to actual dollars
    demographics: {
      age: {
        median: 38, // Placeholder - will be replaced with real data
        distribution: { '18-34': 28, '35-54': 28, '55+': 44 } // Placeholder
      },
      race: {
        'White': 75, // Placeholder
        'Hispanic': 15,
        'Black': 10,
        'Asian': 5,
        'Other': 5
      },
      education: {
        'High School': 30,
        'Some College': 20,
        'Bachelor': 30,
        'Graduate': 20
      }
    },
    topIssues: [], // Will be populated later with demographic/issue data
    fips: fullFips, // Store full 5-digit FIPS for Census matching
  };
}

/**
 * Generate all counties from election data
 */
export async function getAllCountiesFromElections(): Promise<County[]> {
  if (allCountiesCache) {
    return allCountiesCache;
  }

  try {
    const electionData = await loadElectionData();
    const counties: County[] = [];

    for (const countyElectionData of electionData) {
      try {
        const county = await generateCountyFromElectionData(countyElectionData);
        counties.push(county);
      } catch (error) {
        console.warn(`Failed to generate county for ${countyElectionData.countyName}:`, error);
        // Skip counties with errors
      }
    }

    allCountiesCache = counties;
    return counties;
  } catch (error) {
    console.error('Error generating counties from election data:', error);
    return [];
  }
}

/**
 * Get all counties for a specific state from election data
 */
export async function getCountiesByStateFromElections(stateId: string): Promise<County[]> {
  const allCounties = await getAllCountiesFromElections();
  return allCounties.filter(c => c.stateId === stateId.toUpperCase());
}

/**
 * Get a single county by FIPS code
 */
export async function getCountyByFips(fips: string): Promise<County | null> {
  const allCounties = await getAllCountiesFromElections();
  // Counties are generated with IDs based on normalized names, so we need to search by state/county name
  // For now, we'll need to match through the election data
  const { loadElectionData, getElectionDataForCounty } = await import('./electionData');
  const electionData = await loadElectionData();
  const countyElectionData = await getElectionDataForCounty(fips);
  
  if (!countyElectionData) return null;
  
  const normalizedName = countyElectionData.countyName
    .replace(/\s(county|parish|borough|census area)$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  const countyId = `${countyElectionData.stateAbbr}-${normalizedName}`;
  
  return allCounties.find(c => c.id === countyId) || null;
}
