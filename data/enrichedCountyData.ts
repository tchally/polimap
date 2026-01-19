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
 * Uses real county data from election results and Census data only
 */
export async function getCountiesByStateWithElections(stateId: string): Promise<County[]> {
  try {
    // Get counties from real election data
    const counties = await getCountiesByStateFromElections(stateId);
    
    if (counties.length === 0) {
      console.warn(`No counties found in election data for ${stateId}`);
      return [];
    }
    
    // Enrich all counties with Census demographics if available
    try {
      const enrichedCounties = await enrichCountiesWithCensus(counties);
      return enrichedCounties;
    } catch (error) {
      console.warn(`Failed to enrich counties with Census data for ${stateId}:`, error);
      // Return counties without Census data if enrichment fails
      return counties;
    }
  } catch (error) {
    console.error(`Failed to load counties from election data for ${stateId}:`, error);
    return [];
  }
}

/**
 * Get a single county with election data and Census demographics enriched
 * Uses real election and Census data only
 */
export async function getCountyByIdWithElections(countyId: string): Promise<County | undefined> {
  try {
    // Find county in real election data
    // Use case-insensitive lookup since county IDs might have inconsistent casing
    console.log(`[getCountyByIdWithElections] Looking up: ${countyId}`);
    const allCounties = await getAllCountiesFromElections();
    console.log(`[getCountyByIdWithElections] Loaded ${allCounties.length} counties from election data`);
    
    if (allCounties.length === 0) {
      console.error(`[getCountyByIdWithElections] No counties loaded from election data! This suggests election data loading failed.`);
      return undefined;
    }
    
    // Try exact match first (case-insensitive)
    let county = allCounties.find(c => 
      c.id.toLowerCase() === countyId.toLowerCase() || c.id === countyId
    );
    
    // If not found, try matching by normalizing the county name part
    // e.g., "CA-HUMBOLDT" might match "CA-Humboldt"
    if (!county) {
      const [stateAbbr, ...countyParts] = countyId.split('-');
      const countyNamePart = countyParts.join('-');
      
      console.log(`[getCountyByIdWithElections] Trying normalized match for state: ${stateAbbr}, county part: ${countyNamePart}`);
      
      // Try to find by state and normalized county name
      county = allCounties.find(c => {
        if (c.stateId.toUpperCase() !== stateAbbr.toUpperCase()) return false;
        
        // Extract county name from ID (remove state prefix)
        const cCountyPart = c.id.split('-').slice(1).join('-');
        return cCountyPart.toLowerCase() === countyNamePart.toLowerCase();
      });
    }
    
    if (!county) {
      // Log some sample county IDs for debugging
      const stateMatch = countyId.match(/^([A-Z]{2})-/i);
      const stateId = stateMatch ? stateMatch[1].toUpperCase() : null;
      const sampleCounties = stateId
        ? allCounties
            .filter(c => c.stateId === stateId)
            .slice(0, 10)
            .map(c => c.id)
        : allCounties.slice(0, 10).map(c => c.id);
      console.warn(
        `County ${countyId} not found in election data. ` +
        `Total counties: ${allCounties.length}. ` +
        `Sample IDs for ${stateId || 'all states'}: ${sampleCounties.join(', ')}`
      );
      return undefined;
    }
    
    console.log(`[getCountyByIdWithElections] Found county: ${county.name} (${county.id})`);
    
    // Enrich with Census demographics if available
    try {
      const enrichedCounties = await enrichCountiesWithCensus([county]);
      return enrichedCounties[0];
    } catch (error) {
      console.warn(`Failed to enrich county with Census data for ${countyId}:`, error);
      // Return county without Census data if enrichment fails
      return county;
    }
  } catch (error) {
    console.error(`Failed to load county from election data for ${countyId}:`, error);
    return undefined;
  }
}
