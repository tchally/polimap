import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * API route to serve Census demographic data
 * GET /api/census?stateFips=06
 */
export async function GET(request: Request) {
  console.log('🌐 API route /api/census called');
  const { searchParams } = new URL(request.url);
  const stateFips = searchParams.get('stateFips');
  console.log('🌐 Requested stateFips:', stateFips);

  if (!stateFips) {
    return NextResponse.json(
      { error: 'stateFips parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log('🌐 Looking for Census data file...');
    // Try public directory first (for browser access)
    const publicPath = path.join(process.cwd(), 'public', 'data', 'census', `county-demographics-${stateFips}.json`);
    
    // Fallback to data directory (for server-side)
    const dataPath = path.join(process.cwd(), 'data', 'census', `county-demographics-${stateFips}.json`);
    
    let filePath: string;
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else if (fs.existsSync(dataPath)) {
      filePath = dataPath;
    } else {
      return NextResponse.json(
        { error: `Census data not found for state FIPS ${stateFips}` },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    console.log(`🌐 Successfully loaded ${data.length} counties for state FIPS ${stateFips}`);

    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error loading Census data:', error);
    return NextResponse.json(
      { error: 'Failed to load Census data' },
      { status: 500 }
    );
  }
}
