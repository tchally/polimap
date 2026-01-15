/**
 * Election data loader and accessor functions
 * Loads data from countypres_2000-2024.tab file
 */

import { parseElectionData, CountyElectionData, ElectionResult, calculatePoliticalLean } from '@/utils/electionDataParser';
import { PoliticalLean } from '@/types';

let electionDataCache: CountyElectionData[] | null = null;

/**
 * Load election data from the .tab file
 * This will be called once and cached
 */
export async function loadElectionData(): Promise<CountyElectionData[]> {
  if (electionDataCache) {
    return electionDataCache;
  }

  try {
    // Fetch from public directory
    const response = await fetch('/data/countypres_2000-2024.tab');
    if (!response.ok) {
      console.warn(`Failed to load election data: ${response.statusText}. Using empty data.`);
      return [];
    }
    
    const fileContent = await response.text();
    electionDataCache = await parseElectionData(fileContent);
    return electionDataCache;
  } catch (error) {
    console.error('Error loading election data:', error);
    // Return empty array if file can't be loaded
    return [];
  }
}

/**
 * Get election data for a specific county by FIPS code
 */
export async function getElectionDataForCounty(
  countyFips: string
): Promise<CountyElectionData | null> {
  const data = await loadElectionData();
  const countyFipsPadded = countyFips.padStart(5, '0');
  return data.find(d => d.countyFips === countyFipsPadded) || null;
}

/**
 * Get election data for a specific county and year
 */
export async function getElectionDataForCountyYear(
  countyFips: string,
  year: number
): Promise<ElectionResult | null> {
  const countyData = await getElectionDataForCounty(countyFips);
  if (!countyData) return null;
  
  return countyData.elections.find(e => e.year === year) || null;
}

/**
 * Get political lean for a county based on recent election results
 */
export async function getCountyPoliticalLean(
  countyFips: string
): Promise<PoliticalLean> {
  const countyData = await getElectionDataForCounty(countyFips);
  if (!countyData || countyData.elections.length === 0) {
    return 'swing';
  }
  
  return calculatePoliticalLean(countyData.elections);
}

/**
 * Get all counties in a state with their election data
 */
export async function getElectionDataForState(
  stateAbbr: string
): Promise<CountyElectionData[]> {
  const data = await loadElectionData();
  return data.filter(d => d.stateAbbr === stateAbbr.toUpperCase());
}

/**
 * Get most recent election year available
 */
export async function getMostRecentElectionYear(): Promise<number> {
  const data = await loadElectionData();
  let maxYear = 2000;
  
  for (const county of data) {
    for (const election of county.elections) {
      if (election.year > maxYear) {
        maxYear = election.year;
      }
    }
  }
  
  return maxYear;
}
