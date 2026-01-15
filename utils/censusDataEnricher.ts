/**
 * Utility to enrich County data with Census demographics
 * Converts Census API data to match the County interface
 */

import { County } from '@/types';
import { CensusCountyData, fetchCountyDemographics, STATE_FIPS } from './censusApi';

/**
 * Convert Census race data to County interface format
 */
function convertRaceData(censusRace: CensusCountyData['race']): Record<string, number> {
  return {
    'White': censusRace.white,
    'Black or African American': censusRace.black,
    'Asian': censusRace.asian,
    'American Indian and Alaska Native': censusRace.nativeAmerican,
    'Native Hawaiian and Other Pacific Islander': censusRace.pacificIslander,
    'Hispanic or Latino': censusRace.hispanic,
    'Other': censusRace.other + censusRace.twoOrMore, // Combine other and two or more
  };
}

/**
 * Convert Census education data to County interface format
 */
function convertEducationData(censusEducation: CensusCountyData['education']): Record<string, number> {
  return {
    'Less than High School': censusEducation.lessThanHighSchool,
    'High School': censusEducation.highSchool,
    'Some College': censusEducation.someCollege,
    'Associate\'s Degree': censusEducation.associates,
    'Bachelor\'s Degree': censusEducation.bachelors,
    'Graduate Degree': censusEducation.graduate,
  };
}

/**
 * Create age distribution from median age
 * This is a simplified distribution - could be enhanced with actual age group data
 */
function createAgeDistribution(medianAge: number): Record<string, number> {
  // Simplified distribution based on median age
  // In a real implementation, we'd fetch actual age group data (B01001 variables)
  if (medianAge < 35) {
    return { '18-34': 35, '35-54': 30, '55+': 35 };
  } else if (medianAge < 45) {
    return { '18-34': 25, '35-54': 35, '55+': 40 };
  } else {
    return { '18-34': 20, '35-54': 30, '55+': 50 };
  }
}

/**
 * Enrich a County object with Census demographic data
 */
export function enrichCountyWithCensusData(
  county: County,
  censusData: CensusCountyData
): County {
  return {
    ...county,
    population: censusData.population,
    medianIncome: censusData.medianIncome,
    demographics: {
      age: {
        median: censusData.medianAge,
        distribution: createAgeDistribution(censusData.medianAge),
      },
      race: convertRaceData(censusData.race),
      education: convertEducationData(censusData.education),
    },
  };
}

/**
 * Normalize county name for matching
 */
function normalizeCountyNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s(county|parish|borough|census area)$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Enrich multiple counties with Census data
 */
export function enrichCountiesWithCensusData(
  counties: County[],
  censusDataMap: Map<string, CensusCountyData>
): County[] {
  // Create a lookup map by normalized county name
  const censusByName = new Map<string, CensusCountyData>();
  for (const [fips, data] of censusDataMap.entries()) {
    const normalizedName = normalizeCountyNameForMatching(data.name);
    censusByName.set(normalizedName, data);
    // Also try matching with the full name
    const fullNormalized = normalizeCountyNameForMatching(data.name);
    censusByName.set(fullNormalized, data);
  }
  
  let matchedCount = 0;
  let unmatchedCount = 0;
  
  console.log(`🔍 Starting enrichment. Census map has ${censusDataMap.size} entries. Counties to enrich: ${counties.length}`);
  if (counties.length > 0) {
    console.log(`🔍 Sample county FIPS: ${counties[0].fips || 'MISSING'} for ${counties[0].name}`);
  }
  
  const enriched = counties.map(county => {
    // First, try to match by FIPS code (most reliable)
    let censusData: CensusCountyData | undefined;
    
    if (county.fips) {
      // Use the stored FIPS code directly
      censusData = censusDataMap.get(county.fips);
      if (censusData) {
        matchedCount++;
        if (matchedCount <= 3) {
          console.log(`✅ Matched ${county.name} (FIPS: ${county.fips}) - Income: $${censusData.medianIncome.toLocaleString()}`);
        }
      } else {
        unmatchedCount++;
        // Log first 5 mismatches to debug
        if (unmatchedCount <= 5) {
          const sampleFips = Array.from(censusDataMap.keys()).slice(0, 3);
          console.warn(`⚠️ FIPS mismatch for ${county.name}: Looking for "${county.fips}", samples in map: ${sampleFips.join(', ')}`);
        }
      }
    } else {
      unmatchedCount++;
      if (unmatchedCount <= 5) {
        console.warn(`⚠️ County ${county.name} (${county.stateId}) has no FIPS code stored`);
      }
    }
    
    // If not found by FIPS, try matching by normalized county name
    if (!censusData) {
      const normalizedCountyName = normalizeCountyNameForMatching(county.name);
      censusData = censusByName.get(normalizedCountyName);
    }
    
    // If still not found, try extracting FIPS from county ID
    if (!censusData) {
      const countyFips = extractCountyFips(county.id, county.stateId);
      if (countyFips) {
        const stateFips = STATE_FIPS[county.stateId] || '';
        const fullFips = `${stateFips}${countyFips.padStart(3, '0')}`;
        censusData = censusDataMap.get(fullFips);
      }
    }
    
    if (censusData) {
      return enrichCountyWithCensusData(county, censusData);
    }
    
    // If no Census data found, return original county (silently - not all counties may have data)
    return county;
  });
  
  console.log(`✅ Census enrichment complete: ${matchedCount} matched, ${unmatchedCount} unmatched`);
  return enriched;
}

/**
 * Extract county FIPS from county ID
 * Handles formats like "CA-037", "037", or full FIPS "06037"
 * Also handles normalized names like "CA-LosAngeles"
 */
function extractCountyFips(countyId: string, stateId: string): string {
  // If it's already a full FIPS (5 digits), extract last 3
  if (/^\d{5}$/.test(countyId)) {
    return countyId.substring(2);
  }
  
  // If it's in format "state-countyFips" where countyFips is numeric
  if (countyId.includes('-')) {
    const parts = countyId.split('-');
    const lastPart = parts[parts.length - 1];
    // If the last part is numeric (FIPS code), use it
    if (/^\d+$/.test(lastPart)) {
      return lastPart;
    }
  }
  
  // If it's just the county FIPS (3 digits)
  if (/^\d{3}$/.test(countyId)) {
    return countyId;
  }
  
  // Try to extract FIPS from election data if available
  // This is a fallback - we'll need to match by name if FIPS isn't in the ID
  return '';
}

/**
 * Fetch and enrich counties for a specific state
 */
export async function fetchAndEnrichStateCounties(
  stateAbbr: string,
  existingCounties: County[]
): Promise<County[]> {
  const stateFips = STATE_FIPS[stateAbbr.toUpperCase()];
  
  if (!stateFips) {
    throw new Error(`Invalid state abbreviation: ${stateAbbr}`);
  }
  
  // Filter counties for this state
  const stateCounties = existingCounties.filter(c => c.stateId === stateAbbr.toUpperCase());
  
  if (stateCounties.length === 0) {
    console.warn(`No counties found for state: ${stateAbbr}`);
    return existingCounties;
  }
  
  console.log(`Fetching Census data for ${stateCounties.length} counties in ${stateAbbr}...`);
  
  // Fetch Census data
  const censusDataMap = await fetchCountyDemographics(stateFips);
  
  // Enrich counties
  const enrichedCounties = enrichCountiesWithCensusData(stateCounties, censusDataMap);
  
  // Replace original counties with enriched ones
  const otherCounties = existingCounties.filter(c => c.stateId !== stateAbbr.toUpperCase());
  return [...otherCounties, ...enrichedCounties];
}
