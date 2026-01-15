export type PoliticalLean = 'strongly-democratic' | 'democratic' | 'swing' | 'republican' | 'strongly-republican';

export interface State {
  id: string;
  name: string;
  abbreviation: string;
  population: number;
  politicalLean: PoliticalLean;
  topIssues: string[];
  coordinates?: { lat: number; lng: number };
}

export interface County {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  population: number;
  politicalLean: PoliticalLean;
  medianIncome: number;
  demographics: {
    age: { median: number; distribution: Record<string, number> };
    race: Record<string, number>;
    education: Record<string, number>;
  };
  topIssues: string[];
  coordinates?: { lat: number; lng: number };
  fips?: string; // 5-digit FIPS code (state + county) for matching with Census data
}

export interface Persona {
  id: string;
  countyId: string;
  name: string;
  age: number;
  occupation: string;
  householdInfo: {
    size: number;
    income: number;
    type: string;
  };
  politicalAlignment: PoliticalLean;
  topPriorities: {
    issue: string;
    importance: number;
    description: string;
  }[];
  background: string;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  level: 'federal' | 'state' | 'local';
  impact: {
    personaId: string;
    effect: string;
    affectedAreas: string[];
  }[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  policy: Policy;
  personaId: string;
  outcomes: {
    scenario: string;
    impact: string;
    affectedPriorities: string[];
  }[];
}

export type View = 'state-map' | 'county-map' | 'persona' | 'exploration' | 'compare';
