/**
 * Parser for MIT Election Lab presidential election data
 * File format: countypres_2000-2024.tab
 */

export interface RawElectionRow {
  year: string;
  state: string;
  state_po: string;
  county_name: string;
  county_fips: string;
  office: string;
  candidate: string;
  party: string;
  candidatevotes: string;
  totalvotes: string;
  version: string;
  mode: string;
}

export interface ElectionResult {
  year: number;
  countyFips: string;
  countyName: string;
  stateAbbr: string;
  stateName: string;
  candidates: Array<{
    name: string;
    party: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
}

export interface CountyElectionData {
  countyFips: string;
  countyName: string;
  stateAbbr: string;
  stateName: string;
  elections: ElectionResult[];
}

/**
 * Parse tab-separated election data file
 */
export async function parseElectionData(fileContent: string): Promise<CountyElectionData[]> {
  const lines = fileContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split('\t');
  
  // Find column indices
  const yearIdx = headers.indexOf('year');
  const stateIdx = headers.indexOf('state');
  const statePoIdx = headers.indexOf('state_po');
  const countyNameIdx = headers.indexOf('county_name');
  const countyFipsIdx = headers.indexOf('county_fips');
  const candidateIdx = headers.indexOf('candidate');
  const partyIdx = headers.indexOf('party');
  const votesIdx = headers.indexOf('candidatevotes');
  const totalVotesIdx = headers.indexOf('totalvotes');

  // Group by county and year
  const countyYearMap = new Map<string, Map<number, RawElectionRow[]>>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length < headers.length) continue;

    const year = parseInt(cols[yearIdx]);
    const countyFips = cols[countyFipsIdx].padStart(5, '0'); // Ensure 5-digit FIPS
    const key = `${countyFips}-${year}`;

    if (!countyYearMap.has(countyFips)) {
      countyYearMap.set(countyFips, new Map());
    }

    const yearMap = countyYearMap.get(countyFips)!;
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }

    yearMap.get(year)!.push({
      year: cols[yearIdx],
      state: cols[stateIdx],
      state_po: cols[statePoIdx],
      county_name: cols[countyNameIdx],
      county_fips: countyFips,
      office: 'US PRESIDENT',
      candidate: cols[candidateIdx],
      party: cols[partyIdx],
      candidatevotes: cols[votesIdx],
      totalvotes: cols[totalVotesIdx],
      version: '',
      mode: '',
    });
  }

  // Convert to structured format
  const result: CountyElectionData[] = [];

  for (const [countyFips, yearMap] of countyYearMap.entries()) {
    const elections: ElectionResult[] = [];

    for (const [year, rows] of yearMap.entries()) {
      if (rows.length === 0) continue;

      const totalVotes = parseInt(rows[0].totalvotes) || 0;
      const candidates = rows
        .filter(row => row.candidate !== 'OTHER' && row.party !== 'OTHER')
        .map(row => ({
          name: row.candidate,
          party: row.party,
          votes: parseInt(row.candidatevotes) || 0,
          percentage: totalVotes > 0 ? (parseInt(row.candidatevotes) || 0) / totalVotes : 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      if (candidates.length > 0) {
        elections.push({
          year,
          countyFips,
          countyName: rows[0].county_name,
          stateAbbr: rows[0].state_po,
          stateName: rows[0].state,
          candidates,
          totalVotes,
        });
      }
    }

    if (elections.length > 0) {
      result.push({
        countyFips,
        countyName: elections[0].countyName,
        stateAbbr: elections[0].stateAbbr,
        stateName: elections[0].stateName,
        elections: elections.sort((a, b) => b.year - a.year), // Most recent first
      });
    }
  }

  return result;
}

/**
 * Calculate political lean from election results
 */
export function calculatePoliticalLean(
  elections: ElectionResult[],
  recentYears: number = 3
): 'strongly-democratic' | 'democratic' | 'swing' | 'republican' | 'strongly-republican' {
  if (elections.length === 0) return 'swing';

  // Get most recent elections
  const recent = elections.slice(0, recentYears);
  let democraticVotes = 0;
  let republicanVotes = 0;
  let totalVotes = 0;

  for (const election of recent) {
    for (const candidate of election.candidates) {
      const party = candidate.party.toUpperCase();
      if (party.includes('DEMOCRAT')) {
        democraticVotes += candidate.votes;
        totalVotes += candidate.votes;
      } else if (party.includes('REPUBLICAN')) {
        republicanVotes += candidate.votes;
        totalVotes += candidate.votes;
      }
    }
  }

  if (totalVotes === 0) return 'swing';

  const democraticPercentage = democraticVotes / totalVotes;
  const republicanPercentage = republicanVotes / totalVotes;
  const margin = Math.abs(democraticPercentage - republicanPercentage);

  if (democraticPercentage > 0.6) return 'strongly-democratic';
  if (democraticPercentage > 0.55) return 'democratic';
  if (republicanPercentage > 0.6) return 'strongly-republican';
  if (republicanPercentage > 0.55) return 'republican';
  if (margin < 0.05) return 'swing';
  
  return democraticPercentage > republicanPercentage ? 'democratic' : 'republican';
}

/**
 * Get election data for a specific county
 */
export function getElectionDataForCounty(
  countyFips: string,
  electionData: CountyElectionData[]
): CountyElectionData | undefined {
  return electionData.find(data => data.countyFips === countyFips);
}

/**
 * Get election data for a specific year
 */
export function getElectionDataForYear(
  year: number,
  electionData: CountyElectionData[]
): ElectionResult[] {
  const results: ElectionResult[] = [];
  for (const county of electionData) {
    const election = county.elections.find(e => e.year === year);
    if (election) {
      results.push(election);
    }
  }
  return results;
}
