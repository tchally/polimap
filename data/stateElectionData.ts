/**
 * State-level election data aggregation and state data generation
 * Aggregates county election results to calculate state political leanings
 */

import { State, PoliticalLean } from '@/types';
import { loadElectionData, getElectionDataForState } from './electionData';
import { calculatePoliticalLean, ElectionResult } from '@/utils/electionDataParser';

// State coordinates (approximate geographic centers)
const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  'AL': { lat: 32.806671, lng: -86.791130 },
  'AK': { lat: 61.370716, lng: -152.404419 },
  'AZ': { lat: 33.729759, lng: -111.431221 },
  'AR': { lat: 34.969704, lng: -92.373123 },
  'CA': { lat: 36.116203, lng: -119.681564 },
  'CO': { lat: 39.059811, lng: -105.311104 },
  'CT': { lat: 41.597782, lng: -72.755371 },
  'DE': { lat: 39.318523, lng: -75.507141 },
  'DC': { lat: 38.907192, lng: -77.036873 },
  'FL': { lat: 27.766279, lng: -81.686783 },
  'GA': { lat: 33.040619, lng: -83.643074 },
  'HI': { lat: 21.094318, lng: -157.498337 },
  'ID': { lat: 44.240459, lng: -114.478828 },
  'IL': { lat: 40.349457, lng: -88.986137 },
  'IN': { lat: 39.849426, lng: -86.258278 },
  'IA': { lat: 42.011539, lng: -93.210526 },
  'KS': { lat: 38.526600, lng: -96.726486 },
  'KY': { lat: 37.668140, lng: -84.670067 },
  'LA': { lat: 31.169546, lng: -91.867805 },
  'ME': { lat: 44.323535, lng: -69.765261 },
  'MD': { lat: 39.063946, lng: -76.802101 },
  'MA': { lat: 42.230171, lng: -71.530106 },
  'MI': { lat: 43.326618, lng: -84.536095 },
  'MN': { lat: 45.694454, lng: -93.900192 },
  'MS': { lat: 32.741646, lng: -89.678696 },
  'MO': { lat: 38.572954, lng: -92.189283 },
  'MT': { lat: 46.921925, lng: -110.454353 },
  'NE': { lat: 41.125370, lng: -98.268082 },
  'NV': { lat: 38.313515, lng: -117.055374 },
  'NH': { lat: 43.452492, lng: -71.563896 },
  'NJ': { lat: 40.298904, lng: -74.521011 },
  'NM': { lat: 34.840515, lng: -106.248482 },
  'NY': { lat: 42.165726, lng: -74.948051 },
  'NC': { lat: 35.630066, lng: -79.806419 },
  'ND': { lat: 47.528912, lng: -99.784012 },
  'OH': { lat: 40.388783, lng: -82.764915 },
  'OK': { lat: 35.565342, lng: -96.928917 },
  'OR': { lat: 44.572021, lng: -122.070938 },
  'PA': { lat: 40.590752, lng: -77.209755 },
  'RI': { lat: 41.680893, lng: -71.51178 },
  'SC': { lat: 33.856892, lng: -80.945007 },
  'SD': { lat: 44.299782, lng: -99.438828 },
  'TN': { lat: 35.747845, lng: -86.692345 },
  'TX': { lat: 31.054487, lng: -97.563461 },
  'UT': { lat: 40.150032, lng: -111.862434 },
  'VT': { lat: 44.045876, lng: -72.710686 },
  'VA': { lat: 37.769337, lng: -78.169968 },
  'WA': { lat: 47.400902, lng: -121.490494 },
  'WV': { lat: 38.491226, lng: -80.954453 },
  'WI': { lat: 44.268543, lng: -89.616508 },
  'WY': { lat: 42.755966, lng: -107.302490 },
};

// State names
const stateNames: Record<string, string> = {
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

// State population estimates (2023 data - approximate)
const statePopulations: Record<string, number> = {
  'AL': 5074296, 'AK': 733583, 'AZ': 7276316, 'AR': 3060151,
  'CA': 39029342, 'CO': 5839926, 'CT': 3605944, 'DE': 1018396,
  'DC': 671803, 'FL': 22244823, 'GA': 10912876, 'HI': 1440196,
  'ID': 1900920, 'IL': 12671469, 'IN': 6833037, 'IA': 3200517,
  'KS': 2937150, 'KY': 4512310, 'LA': 4657757, 'ME': 1385340,
  'MD': 6165129, 'MA': 6984723, 'MI': 10037261, 'MN': 5706494,
  'MS': 2940057, 'MO': 6168189, 'MT': 1122867, 'NE': 1967923,
  'NV': 3177776, 'NH': 1395231, 'NJ': 9261699, 'NM': 2117522,
  'NY': 19835913, 'NC': 10698973, 'ND': 779094, 'OH': 11780017,
  'OK': 4019800, 'OR': 4240137, 'PA': 13002700, 'RI': 1095610,
  'SC': 5282634, 'SD': 909824, 'TN': 7051339, 'TX': 30029572,
  'UT': 3380800, 'VT': 647064, 'VA': 8683619, 'WA': 7785786,
  'WV': 1782959, 'WI': 5895908, 'WY': 581381,
};

/**
 * Calculate state political lean from aggregated county election results
 */
function calculateStateLean(stateElections: ElectionResult[]): PoliticalLean {
  if (stateElections.length === 0) return 'swing';

  let totalDemocraticVotes = 0;
  let totalRepublicanVotes = 0;
  let totalVotes = 0;

  // Aggregate votes from all counties in the state
  for (const election of stateElections) {
    for (const candidate of election.candidates) {
      const party = candidate.party.toUpperCase();
      if (party.includes('DEMOCRAT') || party === 'DEMOCRATIC') {
        totalDemocraticVotes += candidate.votes;
        totalVotes += candidate.votes;
      } else if (party.includes('REPUBLICAN')) {
        totalRepublicanVotes += candidate.votes;
        totalVotes += candidate.votes;
      }
    }
  }

  if (totalVotes === 0) return 'swing';

  const democraticPercentage = totalDemocraticVotes / totalVotes;
  const republicanPercentage = totalRepublicanVotes / totalVotes;
  const margin = Math.abs(democraticPercentage - republicanPercentage);

  // Determine political lean based on vote percentages
  if (democraticPercentage > 0.6) return 'strongly-democratic';
  if (democraticPercentage > 0.55) return 'democratic';
  if (republicanPercentage > 0.6) return 'strongly-republican';
  if (republicanPercentage > 0.55) return 'republican';
  if (margin < 0.05) return 'swing';

  return democraticPercentage > republicanPercentage ? 'democratic' : 'republican';
}

/**
 * Get political lean for a state based on most recent elections (weighted average)
 */
async function getStatePoliticalLean(stateAbbr: string): Promise<PoliticalLean> {
  const countyData = await getElectionDataForState(stateAbbr);
  if (countyData.length === 0) return 'swing';

  // Get most recent election years (use last 3 elections for better accuracy)
  const electionYears = new Set<number>();
  for (const county of countyData) {
    for (const election of county.elections) {
      electionYears.add(election.year);
    }
  }

  const sortedYears = Array.from(electionYears).sort((a, b) => b - a);
  const recentYears = sortedYears.slice(0, 3); // Last 3 elections

  if (recentYears.length === 0) return 'swing';

  // Aggregate all county results for recent elections
  const stateElections: ElectionResult[] = [];
  for (const year of recentYears) {
    for (const county of countyData) {
      const election = county.elections.find(e => e.year === year);
      if (election) {
        stateElections.push(election);
      }
    }
  }

  return calculateStateLean(stateElections);
}

/**
 * Generate all 50 states with real election-based political leanings
 */
export async function getAllStatesWithElections(): Promise<State[]> {
  const states: State[] = [];

  // Generate all states
  for (const [abbr, name] of Object.entries(stateNames)) {
    const politicalLean = await getStatePoliticalLean(abbr);

    states.push({
      id: abbr,
      name,
      abbreviation: abbr,
      population: statePopulations[abbr] || 0,
      politicalLean,
      topIssues: [], // Will be populated later with demographic/issue data
      coordinates: stateCoordinates[abbr] || { lat: 0, lng: 0 },
    });
  }

  return states;
}

/**
 * Get a single state with election data
 */
export async function getStateWithElections(stateAbbr: string): Promise<State | null> {
  const allStates = await getAllStatesWithElections();
  return allStates.find(s => s.abbreviation === stateAbbr.toUpperCase()) || null;
}
