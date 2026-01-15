/**
 * Script to fetch county-level demographics from Census API
 * Run with: npx tsx scripts/fetchCountyDemographics.ts [state1] [state2] ...
 * If no states provided, fetches for all states
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fetchCountyDemographics, STATE_FIPS } from '../utils/censusApi';
import { CensusCountyData } from '../utils/censusApi';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Save Census data to JSON file
 * Saves to both data/census (for scripts) and public/data/census (for browser)
 */
function saveCensusData(stateFips: string, data: Map<string, CensusCountyData>): void {
  const dataArray = Array.from(data.values());
  const jsonData = JSON.stringify(dataArray, null, 2);
  
  // Save to data/census for scripts
  const dataDir = path.join(process.cwd(), 'data', 'census');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dataPath = path.join(dataDir, `county-demographics-${stateFips}.json`);
  fs.writeFileSync(dataPath, jsonData);
  
  // Save to public/data/census for browser access
  const publicDir = path.join(process.cwd(), 'public', 'data', 'census');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, `county-demographics-${stateFips}.json`);
  fs.writeFileSync(publicPath, jsonData);
  
  console.log(`✓ Saved data for ${dataArray.length} counties to ${publicPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Get states to fetch
  let statesToFetch: string[] = [];
  
  if (args.length > 0) {
    // Fetch specific states
    statesToFetch = args.map(state => state.toUpperCase());
  } else {
    // Fetch all states
    statesToFetch = Object.keys(STATE_FIPS);
  }
  
  console.log(`Fetching Census demographics for ${statesToFetch.length} state(s)...\n`);
  
  const results: Array<{ state: string; stateFips: string; countyCount: number; success: boolean }> = [];
  
  for (const stateAbbr of statesToFetch) {
    const stateFips = STATE_FIPS[stateAbbr];
    
    if (!stateFips) {
      console.error(`❌ Invalid state abbreviation: ${stateAbbr}`);
      results.push({ state: stateAbbr, stateFips: '', countyCount: 0, success: false });
      continue;
    }
    
    try {
      console.log(`\n📊 Fetching data for ${stateAbbr} (FIPS: ${stateFips})...`);
      const data = await fetchCountyDemographics(stateFips);
      
      if (data.size > 0) {
        saveCensusData(stateFips, data);
        results.push({ state: stateAbbr, stateFips, countyCount: data.size, success: true });
      } else {
        console.warn(`⚠️  No data returned for ${stateAbbr}`);
        results.push({ state: stateAbbr, stateFips, countyCount: 0, success: false });
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error fetching data for ${stateAbbr}:`, error);
      results.push({ state: stateAbbr, stateFips, countyCount: 0, success: false });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length} state(s)`);
  successful.forEach(r => {
    console.log(`   ${r.state}: ${r.countyCount} counties`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} state(s)`);
    failed.forEach(r => {
      console.log(`   ${r.state}`);
    });
  }
  
  const totalCounties = successful.reduce((sum, r) => sum + r.countyCount, 0);
  console.log(`\n📈 Total counties fetched: ${totalCounties}`);
}

// Run the script
main()
  .then(() => {
    console.log('\n✓ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
