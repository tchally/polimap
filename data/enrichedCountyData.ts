/**
 * Enriches county data with election results and Census demographics
 * Uses real county data from election results for all 50 states
 * Enriches with Census demographic data when available
 */

import { County } from '@/types';
import { getCountiesByState, getCountyById } from './mockData';
import { getElectionDataForCounty, getCountyPoliticalLean } from './electionData';
import { getCountyFips, normalizeCountyName } from './countyElectionMapper';
import { getCountiesByStateFromElections, getAllCountiesFromElections } from './countyDataFromElections';
import { enrichCountiesWithCensus } from './countyDemographicsFromCensus';

/**
 * Get counties for a state with election data and Census demographics
 * Uses real county data from election results for all states
 * Enriches with Census demographic data when available
 */
export async function getCountiesByStateWithElections(stateId: string): Promise<County[]> {
  let counties: County[] = [];
  
  try {
    // Try to get counties from real election data first
    console.log(`📥 Loading counties from election data for ${stateId}...`);
    const countiesFromElections = await getCountiesByStateFromElections(stateId);
    console.log(`📥 Loaded ${countiesFromElections.length} counties from election data`);
    
    if (countiesFromElections.length > 0) {
      // Use real data - counties already have political leanings calculated
      counties = countiesFromElections;
      // Check if FIPS is set
      const sampleWithFips = counties.find(c => c.fips);
      const sampleWithoutFips = counties.find(c => !c.fips);
      console.log(`📊 Sample county with FIPS: ${sampleWithFips?.name} (${sampleWithFips?.fips})`);
      if (sampleWithoutFips) {
        console.warn(`⚠️ Sample county without FIPS: ${sampleWithoutFips.name}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to load counties from election data for ${stateId}:`, error);
  }
  
  // If no counties from elections, fall back to mock data
  if (counties.length === 0) {
    counties = getCountiesByState(stateId);
    
    // Enrich mock counties with election data if available
    counties = await Promise.all(
      counties.map(async (county) => {
        // Try to get FIPS by county ID first
        let fips = getCountyFips(county.id);
        
        // If not found, try to match by county name and state
        if (!fips) {
          const normalizedName = normalizeCountyName(county.name);
          const { getElectionDataForState } = await import('./electionData');
          const stateElectionData = await getElectionDataForState(stateId);
          
          const matchingCounty = stateElectionData.find(electionData => {
            const electionCountyName = normalizeCountyName(electionData.countyName);
            return electionCountyName === normalizedName;
          });
          
          if (matchingCounty) {
            fips = matchingCounty.countyFips;
          }
        }
        
        if (!fips) {
          return county; // Return original if no FIPS mapping found
        }

        try {
          const politicalLean = await getCountyPoliticalLean(fips);
          
          return {
            ...county,
            politicalLean, // Update with calculated lean from election data
          };
        } catch (error) {
          console.warn(`Failed to load election data for county ${county.id}:`, error);
          return county; // Return original on error
        }
      })
    );
  }
  
  // Enrich all counties with Census demographics if available
  console.log(`🔍 About to enrich ${counties.length} counties for ${stateId} with Census data...`);
  try {
    const enrichedCounties = await enrichCountiesWithCensus(counties);
    console.log(`✅ Enrichment complete for ${stateId}. Returning ${enrichedCounties.length} counties.`);
    // Log a sample to verify income was updated
    const sample = enrichedCounties.find(c => c.name.includes('Alameda'));
    if (sample) {
      console.log(`📊 Sample: ${sample.name} - Income: $${sample.medianIncome.toLocaleString()}`);
    }
    return enrichedCounties;
  } catch (error) {
    console.error(`❌ Failed to enrich counties with Census data for ${stateId}:`, error);
    // Return counties without Census data if enrichment fails
    return counties;
  }
}

/**
 * Get a single county with election data and Census demographics enriched
 * Tries real data first, falls back to mock data
 */
export async function getCountyByIdWithElections(countyId: string): Promise<County | undefined> {
  let county: County | undefined;
  
  try {
    // Try to find in real election data first
    const allCounties = await getAllCountiesFromElections();
    const countyFromElections = allCounties.find(c => c.id === countyId);
    
    if (countyFromElections) {
      county = countyFromElections;
    }
  } catch (error) {
    console.warn(`Failed to load county from election data for ${countyId}:`, error);
  }
  
  // Fallback to mock data
  if (!county) {
    county = getCountyById(countyId);
    if (!county) return undefined;

    // Try to get FIPS by county ID first
    let fips = getCountyFips(countyId);
    
    // If not found, try to match by county name and state
    if (!fips) {
      const normalizedName = normalizeCountyName(county.name);
      const { getElectionDataForState } = await import('./electionData');
      const stateElectionData = await getElectionDataForState(county.stateId);
      
      const matchingCounty = stateElectionData.find(electionData => {
        const electionCountyName = normalizeCountyName(electionData.countyName);
        return electionCountyName === normalizedName;
      });
      
      if (matchingCounty) {
        fips = matchingCounty.countyFips;
      }
    }
    
    if (fips) {
      try {
        const politicalLean = await getCountyPoliticalLean(fips);
        
        county = {
          ...county,
          politicalLean, // Update with calculated lean from election data
        };
      } catch (error) {
        console.warn(`Failed to load election data for county ${countyId}:`, error);
      }
    }
  }
  
  // Enrich with Census demographics if available
  if (county) {
    try {
      const enrichedCounties = await enrichCountiesWithCensus([county]);
      return enrichedCounties[0];
    } catch (error) {
      console.warn(`Failed to enrich county with Census data for ${countyId}:`, error);
      return county; // Return county without Census data if enrichment fails
    }
  }
  
  return county;
}
