/**
 * Test script to verify Census API key is working
 * Run with: npx tsx scripts/testCensusApi.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env files
// Try .env.local first (Next.js convention), then .env
const envFiles = ['.env.local', '.env'];
let envLoaded = false;

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✓ Loaded environment from ${envFile}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('❌ No .env or .env.local file found!');
  process.exit(1);
}

// Get the API key from environment
const apiKey = process.env.CENSUS_API_KEY || process.env.NEXT_PUBLIC_CENSUS_API_KEY;

if (!apiKey) {
  console.error('❌ CENSUS_API_KEY or NEXT_PUBLIC_CENSUS_API_KEY not found in environment variables!');
  console.log('\nMake sure your .env file contains:');
  console.log('  CENSUS_API_KEY=your_key_here');
  console.log('  or');
  console.log('  NEXT_PUBLIC_CENSUS_API_KEY=your_key_here');
  process.exit(1);
}

console.log(`✓ Found API key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

  // Test the Census API with a simple query
  // Using the ACS endpoint that the user confirmed works in browser
async function testCensusApi() {
  console.log('\n🧪 Testing Census API...\n');

  // Test 0: Use the exact endpoint that works in browser (ACS 2023)
  console.log('Test 0: Testing with ACS 2023 endpoint (same as browser test)...');
  const testUrl0 = `https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=state:*&key=${apiKey}`;
  
  try {
    console.log(`   URL: ${testUrl0.replace(apiKey, '***HIDDEN***')}`);
    const response0 = await fetch(testUrl0);
    const responseText0 = await response0.text();
    
    if (response0.ok && !responseText0.trim().startsWith('<')) {
      const data0 = JSON.parse(responseText0);
      console.log('✅ ACS 2023 endpoint test successful!');
      console.log(`   Found ${data0.length - 1} states`);
      console.log(`   Sample data (first 3 states):`);
      data0.slice(1, 4).forEach((row: string[]) => {
        console.log(`     - ${row[0]}: Population ${row[1]}`);
      });
    } else {
      console.error(`❌ ACS 2023 endpoint test failed`);
      console.error(`   Status: ${response0.status}`);
      console.error(`   Response (first 500 chars): ${responseText0.substring(0, 500)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ACS 2023 endpoint error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }

  // Test 1: State-level query for California
  console.log('\nTest 1: Fetching California population data (ACS 2023)...');
  const testUrl1 = `https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=state:06&key=${apiKey}`;
  
  try {
    console.log(`   URL: ${testUrl1.replace(apiKey, '***HIDDEN***')}`);
    const response1 = await fetch(testUrl1);
    
    const responseText = await response1.text();
    
    if (!response1.ok) {
      console.error(`❌ API request failed with status ${response1.status}`);
      console.error(`Response (first 500 chars): ${responseText.substring(0, 500)}`);
      
      if (response1.status === 403 || response1.status === 401) {
        console.error('\n⚠️  This usually means:');
        console.error('   - Invalid API key');
        console.error('   - API key not activated yet');
        console.error('   - API key has been revoked');
      }
      
      return false;
    }
    
    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<')) {
      if (responseText.includes('Invalid Key')) {
        console.error('❌ INVALID API KEY');
        console.error('\nThe Census API returned an "Invalid Key" error.');
        console.error('\nPossible reasons:');
        console.error('  1. The API key is incorrect or has typos');
        console.error('  2. The API key has not been activated yet');
        console.error('  3. The API key has been revoked or expired');
        console.error('\nTo fix this:');
        console.error('  1. Verify your API key at: https://api.census.gov/data/key_signup.html');
        console.error('  2. Make sure the key in your .env file matches exactly');
        console.error('  3. Check that there are no extra spaces or quotes around the key');
        console.error(`\nCurrent key (first/last 4 chars): ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      } else {
        console.error('❌ API returned HTML instead of JSON (likely an error page)');
        console.error(`Response (first 500 chars): ${responseText.substring(0, 500)}`);
      }
      return false;
    }
    
    const data1 = JSON.parse(responseText);
    console.log('✓ California query successful!');
    if (data1.length > 1) {
      console.log(`  State: ${data1[1][0]}`);
      console.log(`  Population: ${parseInt(data1[1][1]).toLocaleString()}`);
    }
    
    // Test 2: County-level data for Los Angeles County, CA
    console.log('\nTest 2: Fetching county-level data (Los Angeles County, CA)...');
    const testUrl2 = `https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=county:037&in=state:06&key=${apiKey}`;
    
    const response2 = await fetch(testUrl2);
    const responseText2 = await response2.text();
    if (response2.ok && !responseText2.trim().startsWith('<')) {
      const data2 = JSON.parse(responseText2);
      console.log('✓ County-level query successful!');
      if (data2.length > 1) {
        console.log(`  County: ${data2[1][0]}`);
        console.log(`  Population: ${parseInt(data2[1][1]).toLocaleString()}`);
      }
    } else {
      console.error(`⚠️  County query failed: ${responseText2.substring(0, 500)}`);
    }
    
    // Test 3: Multiple states query
    console.log('\nTest 3: Testing multi-state query...');
    const testUrl3 = `https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=state:06,12,36&key=${apiKey}`;
    
    const response3 = await fetch(testUrl3);
    const responseText3 = await response3.text();
    if (response3.ok && !responseText3.trim().startsWith('<')) {
      const data3 = JSON.parse(responseText3);
      console.log('✓ Multi-state query successful!');
      console.log(`  Retrieved data for ${data3.length - 1} states`);
    } else {
      console.error(`⚠️  Multi-state query failed: ${responseText3.substring(0, 500)}`);
    }
    
    console.log('\n✅ All tests passed! Your Census API key is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    return false;
  }
}

// Run the test
testCensusApi()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
