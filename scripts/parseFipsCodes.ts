/**
 * Script to parse FIPS codes from Excel file and generate county mappings
 * Run with: npx tsx scripts/parseFipsCodes.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface FipsRow {
  [key: string]: string | number;
}

function parseFipsExcel() {
  const filePath = path.join(__dirname, '../data/FIPS codes.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(filePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows: FipsRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${rows.length} rows`);
  console.log('Sample row:', rows[0]);
  
  // Try to identify column names
  const firstRow = rows[0];
  const columns = Object.keys(firstRow);
  console.log('Columns found:', columns);
  
  // Common column name variations
  const fipsColumn = columns.find(col => 
    col.toLowerCase().includes('fips') || 
    col.toLowerCase().includes('code')
  );
  const countyColumn = columns.find(col => 
    col.toLowerCase().includes('county') || 
    col.toLowerCase().includes('name')
  );
  const stateColumn = columns.find(col => 
    col.toLowerCase().includes('state') && 
    !col.toLowerCase().includes('fips')
  );
  const stateAbbrColumn = columns.find(col => 
    col.toLowerCase().includes('abbr') || 
    col.toLowerCase().includes('state_po') ||
    col.toLowerCase().includes('state code')
  );
  
  console.log('Detected columns:');
  console.log('  FIPS:', fipsColumn);
  console.log('  County:', countyColumn);
  console.log('  State:', stateColumn);
  console.log('  State Abbr:', stateAbbrColumn);
  
  if (!fipsColumn || !countyColumn) {
    console.error('Could not identify required columns (FIPS and County)');
    console.error('Please check the column names in your Excel file');
    process.exit(1);
  }
  
  // Generate mappings
  const mappings: Record<string, string> = {};
  
  for (const row of rows) {
    const fips = String(row[fipsColumn] || '').trim();
    const countyName = String(row[countyColumn] || '').trim();
    const stateName = stateColumn ? String(row[stateColumn] || '').trim() : '';
    const stateAbbr = stateAbbrColumn ? String(row[stateAbbrColumn] || '').trim().toUpperCase() : '';
    
    if (!fips || !countyName) continue;
    
    // Normalize FIPS to 5 digits
    const fipsPadded = fips.padStart(5, '0');
    
    // Create county ID: STATE-CountyName (normalized)
    const normalizedCountyName = countyName
      .replace(/\s(county|parish|borough|census area)$/i, '')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    if (stateAbbr) {
      const countyId = `${stateAbbr}-${normalizedCountyName}`;
      mappings[countyId] = fipsPadded;
    } else if (stateName) {
      // Try to get state abbreviation from state name
      // This is a fallback - you might need to add state name to abbreviation mapping
      console.warn(`No state abbreviation for ${stateName}, skipping ${countyName}`);
    }
  }
  
  console.log(`\nGenerated ${Object.keys(mappings).length} mappings`);
  
  // Generate TypeScript code
  const tsCode = `/**
 * County FIPS code mappings
 * Auto-generated from FIPS codes.xlsx
 * Last updated: ${new Date().toISOString()}
 */

export const countyFipsMap: Record<string, string> = {
${Object.entries(mappings)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([countyId, fips]) => `  '${countyId}': '${fips}',`)
  .join('\n')}
};

/**
 * Get FIPS code for a county ID
 */
export function getCountyFips(countyId: string): string | null {
  return countyFipsMap[countyId] || null;
}

/**
 * Get county ID from FIPS code (reverse lookup)
 */
export function getCountyIdFromFips(fips: string): string | null {
  const fipsPadded = fips.padStart(5, '0');
  for (const [countyId, fipsCode] of Object.entries(countyFipsMap)) {
    if (fipsCode === fipsPadded) {
      return countyId;
    }
  }
  return null;
}

/**
 * Normalize county name for matching
 */
export function normalizeCountyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\\s(county|parish|borough|census area)$/i, '')
    .trim();
}
`;
  
  // Write to file
  const outputPath = path.join(__dirname, '../data/countyElectionMapper.ts');
  fs.writeFileSync(outputPath, tsCode, 'utf-8');
  
  console.log(`\n✅ Generated ${outputPath}`);
  console.log(`   Total mappings: ${Object.keys(mappings).length}`);
}

parseFipsExcel();
