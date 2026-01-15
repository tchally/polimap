/**
 * Load and merge Census demographic data with county data
 * This module enriches county data with real Census demographics
 * Works in both server and client environments
 */

import { County } from '@/types';
import { CensusCountyData } from '@/utils/censusApi';
import { enrichCountiesWithCensusData } from '@/utils/censusDataEnricher';

let censusDataCache: Map<string, Map<string, CensusCountyData>> | null = null;
let loadingPromise: Promise<Map<string, Map<string, CensusCountyData>>> | null = null;

/**
 * Load Census data from JSON files in public directory
 * Works in browser by fetching from /data/census/ directory
 */
async function loadCensusDataFromFiles(): Promise<Map<string, Map<string, CensusCountyData>>> {
  if (censusDataCache) {
    return censusDataCache;
  }
  
  // If already loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }
  
  loadingPromise = (async () => {
    const cache = new Map<string, Map<string, CensusCountyData>>();
    
    // List of state FIPS codes we have data for
    // Update this list as you fetch more states using fetchCountyDemographics.ts
    // The script automatically saves to both data/census and public/data/census
    const stateFipsList = ['06', '12', '36', '48']; // CA, FL, NY, TX
    
    try {
      // Fetch data for each state via API route to avoid CORB issues
      const fetchPromises = stateFipsList.map(async (stateFips) => {
        try {
          console.log(`📡 Fetching Census data for state FIPS ${stateFips} from /api/census...`);
          const response = await fetch(`/api/census?stateFips=${stateFips}`);
          console.log(`📡 Response status for ${stateFips}: ${response.status}`);
          if (!response.ok) {
            // File doesn't exist for this state, skip it
            console.warn(`⚠️ Census data not found for state FIPS ${stateFips} (status: ${response.status})`);
            return null;
          }
          
          const data: CensusCountyData[] = await response.json();
          console.log(`✅ Loaded ${data.length} counties for state FIPS ${stateFips}`);
          
          const countyMap = new Map<string, CensusCountyData>();
          for (const county of data) {
            const fullFips = `${county.stateFips}${county.countyFips.padStart(3, '0')}`;
            countyMap.set(fullFips, county);
          }
          
          console.log(`📊 Created county map for ${stateFips} with ${countyMap.size} entries. Sample FIPS: ${Array.from(countyMap.keys()).slice(0, 3).join(', ')}`);
          return { stateFips, countyMap };
        } catch (error) {
          console.error(`❌ Failed to load Census data for state FIPS ${stateFips}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(fetchPromises);
      
      for (const result of results) {
        if (result) {
          cache.set(result.stateFips, result.countyMap);
        }
      }
      
      if (cache.size > 0) {
        console.log(`✅ Loaded Census data for ${cache.size} state(s)`);
        // Log sample FIPS codes for debugging
        for (const [stateFips, countyMap] of cache.entries()) {
          const sampleFips = Array.from(countyMap.keys()).slice(0, 3);
          console.log(`  State ${stateFips}: ${countyMap.size} counties, sample FIPS: ${sampleFips.join(', ')}`);
        }
      } else {
        console.warn('⚠️ No Census data loaded! Check that files exist in /public/data/census/');
      }
    } catch (error) {
      console.error('Error loading Census data:', error);
    }
    
    censusDataCache = cache;
    loadingPromise = null;
    return cache;
  })();
  
  return loadingPromise;
}

/**
 * Synchronous version that returns cached data or empty map
 * Use this when you need immediate access and can handle async loading separately
 */
function getCensusDataCache(): Map<string, Map<string, CensusCountyData>> {
  return censusDataCache || new Map();
}

/**
 * Get Census data for a specific state
 */
async function getCensusDataForState(stateFips: string): Promise<Map<string, CensusCountyData>> {
  const allData = await loadCensusDataFromFiles();
  return allData.get(stateFips) || new Map();
}

/**
 * Enrich counties with Census data
 * This function takes existing county data and enriches it with Census demographics
 * Now async to support browser-based data loading
 */
export async function enrichCountiesWithCensus(counties: County[]): Promise<County[]> {
  console.log(`🔄 Starting Census enrichment for ${counties.length} counties...`);
  const censusData = await loadCensusDataFromFiles();
  
  if (censusData.size === 0) {
    console.warn('⚠️ No Census data available. Make sure Census data files are in public/data/census/');
    return counties;
  }
  
  console.log(`📊 Census data loaded: ${censusData.size} states available`);
  
  // Group counties by state
  const countiesByState = new Map<string, County[]>();
  for (const county of counties) {
    // Need to convert state abbreviation to FIPS
    const stateFips = getStateFipsFromAbbr(county.stateId);
    if (!stateFips) continue;
    
    if (!countiesByState.has(stateFips)) {
      countiesByState.set(stateFips, []);
    }
    countiesByState.get(stateFips)!.push(county);
  }
  
  // Enrich each state's counties
  const enrichedCounties: County[] = [];
  
  for (const [stateFips, stateCounties] of countiesByState.entries()) {
    const censusDataForState = await getCensusDataForState(stateFips);
    
    if (censusDataForState.size > 0) {
      const enriched = enrichCountiesWithCensusData(stateCounties, censusDataForState);
      enrichedCounties.push(...enriched);
    } else {
      // No Census data for this state, use original counties
      enrichedCounties.push(...stateCounties);
    }
  }
  
  // Add counties from states not in Census data
  const enrichedStateIds = new Set(enrichedCounties.map(c => c.stateId));
  for (const county of counties) {
    if (!enrichedStateIds.has(county.stateId)) {
      enrichedCounties.push(county);
    }
  }
  
  return enrichedCounties;
}

/**
 * Get state FIPS from state abbreviation
 */
function getStateFipsFromAbbr(stateAbbr: string): string | null {
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
  
  return STATE_FIPS[stateAbbr.toUpperCase()] || null;
}

/**
 * Get enriched counties for a specific state
 */
export async function getEnrichedCountiesForState(stateAbbr: string, allCounties: County[]): Promise<County[]> {
  const stateCounties = allCounties.filter(c => c.stateId === stateAbbr.toUpperCase());
  return await enrichCountiesWithCensus(stateCounties);
}

/**
 * Check if Census data is available for a state
 */
export async function hasCensusDataForState(stateAbbr: string): Promise<boolean> {
  const stateFips = getStateFipsFromAbbr(stateAbbr);
  if (!stateFips) return false;
  
  const censusData = await loadCensusDataFromFiles();
  return censusData.has(stateFips) && (censusData.get(stateFips)?.size || 0) > 0;
}

/**
 * Get list of states with available Census data
 */
export async function getStatesWithCensusData(): Promise<string[]> {
  const censusData = await loadCensusDataFromFiles();
  const STATE_ABBR: Record<string, string> = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR',
    '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
    '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID',
    '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS',
    '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
    '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
    '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV',
    '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY',
    '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK',
    '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC',
    '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV',
    '55': 'WI', '56': 'WY', '11': 'DC',
  };
  
  const states: string[] = [];
  for (const [stateFips, countyMap] of censusData.entries()) {
    if (countyMap.size > 0) {
      const abbr = STATE_ABBR[stateFips];
      if (abbr) states.push(abbr);
    }
  }
  
  return states;
}
