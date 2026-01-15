import { State, County, Persona, PoliticalLean } from '@/types';

export const mockStates: State[] = [
  {
    id: 'CA',
    name: 'California',
    abbreviation: 'CA',
    population: 39538223,
    politicalLean: 'strongly-democratic',
    topIssues: ['Climate Change', 'Housing Affordability'],
    coordinates: { lat: 36.7783, lng: -119.4179 }
  },
  {
    id: 'TX',
    name: 'Texas',
    abbreviation: 'TX',
    population: 29145505,
    politicalLean: 'republican',
    topIssues: ['Immigration', 'Energy'],
    coordinates: { lat: 31.9686, lng: -99.9018 }
  },
  {
    id: 'FL',
    name: 'Florida',
    abbreviation: 'FL',
    population: 21538187,
    politicalLean: 'republican',
    topIssues: ['Climate Change', 'Tourism'],
    coordinates: { lat: 27.7663, lng: -81.6868 }
  },
  {
    id: 'NY',
    name: 'New York',
    abbreviation: 'NY',
    population: 20201249,
    politicalLean: 'strongly-democratic',
    topIssues: ['Healthcare', 'Urban Development'],
    coordinates: { lat: 42.1657, lng: -74.9481 }
  },
  {
    id: 'PA',
    name: 'Pennsylvania',
    abbreviation: 'PA',
    population: 13002700,
    politicalLean: 'swing',
    topIssues: ['Manufacturing', 'Healthcare'],
    coordinates: { lat: 40.5908, lng: -77.2098 }
  },
  {
    id: 'OH',
    name: 'Ohio',
    abbreviation: 'OH',
    population: 11799448,
    politicalLean: 'swing',
    topIssues: ['Manufacturing', 'Education'],
    coordinates: { lat: 40.3888, lng: -82.7649 }
  },
  {
    id: 'GA',
    name: 'Georgia',
    abbreviation: 'GA',
    population: 10711908,
    politicalLean: 'swing',
    topIssues: ['Voting Rights', 'Economic Development'],
    coordinates: { lat: 33.0406, lng: -83.6431 }
  },
  {
    id: 'NC',
    name: 'North Carolina',
    abbreviation: 'NC',
    population: 10439388,
    politicalLean: 'swing',
    topIssues: ['Education', 'Healthcare'],
    coordinates: { lat: 35.5397, lng: -79.8431 }
  },
  {
    id: 'MI',
    name: 'Michigan',
    abbreviation: 'MI',
    population: 10037334,
    politicalLean: 'swing',
    topIssues: ['Automotive Industry', 'Water Quality'],
    coordinates: { lat: 43.3266, lng: -84.5361 }
  },
  {
    id: 'AZ',
    name: 'Arizona',
    abbreviation: 'AZ',
    population: 7151502,
    politicalLean: 'swing',
    topIssues: ['Water Resources', 'Immigration'],
    coordinates: { lat: 34.0489, lng: -111.0937 }
  }
];

export const mockCounties: County[] = [
  {
    id: 'CA-LA',
    name: 'Los Angeles County',
    stateId: 'CA',
    stateName: 'California',
    population: 10014009,
    politicalLean: 'strongly-democratic',
    medianIncome: 71000,
    demographics: {
      age: { median: 37, distribution: { '18-34': 28, '35-54': 28, '55+': 44 } },
      race: { 'White': 48, 'Hispanic': 49, 'Asian': 15, 'Black': 8, 'Other': 5 },
      education: { 'High School': 25, 'Some College': 20, 'Bachelor': 35, 'Graduate': 20 }
    },
    topIssues: ['Housing Affordability', 'Homelessness', 'Climate Change'],
    coordinates: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: 'TX-Harris',
    name: 'Harris County',
    stateId: 'TX',
    stateName: 'Texas',
    population: 4731145,
    politicalLean: 'democratic',
    medianIncome: 61000,
    demographics: {
      age: { median: 34, distribution: { '18-34': 32, '35-54': 28, '55+': 40 } },
      race: { 'White': 40, 'Hispanic': 42, 'Black': 19, 'Asian': 7, 'Other': 2 },
      education: { 'High School': 28, 'Some College': 22, 'Bachelor': 28, 'Graduate': 22 }
    },
    topIssues: ['Energy', 'Immigration', 'Healthcare'],
    coordinates: { lat: 29.7604, lng: -95.3698 }
  },
  {
    id: 'PA-Allegheny',
    name: 'Allegheny County',
    stateId: 'PA',
    stateName: 'Pennsylvania',
    population: 1223348,
    politicalLean: 'democratic',
    medianIncome: 58000,
    demographics: {
      age: { median: 41, distribution: { '18-34': 24, '35-54': 26, '55+': 50 } },
      race: { 'White': 81, 'Black': 13, 'Asian': 4, 'Other': 2 },
      education: { 'High School': 30, 'Some College': 20, 'Bachelor': 30, 'Graduate': 20 }
    },
    topIssues: ['Manufacturing', 'Healthcare', 'Education'],
    coordinates: { lat: 40.4406, lng: -79.9959 }
  },
  {
    id: 'OH-Cuyahoga',
    name: 'Cuyahoga County',
    stateId: 'OH',
    stateName: 'Ohio',
    population: 1248512,
    politicalLean: 'democratic',
    medianIncome: 52000,
    demographics: {
      age: { median: 40, distribution: { '18-34': 25, '35-54': 26, '55+': 49 } },
      race: { 'White': 63, 'Black': 30, 'Asian': 4, 'Other': 3 },
      education: { 'High School': 32, 'Some College': 22, 'Bachelor': 28, 'Graduate': 18 }
    },
    topIssues: ['Manufacturing', 'Healthcare', 'Education'],
    coordinates: { lat: 41.4993, lng: -81.6944 }
  },
  {
    id: 'TX-Montgomery',
    name: 'Montgomery County',
    stateId: 'TX',
    stateName: 'Texas',
    population: 620000,
    politicalLean: 'strongly-republican',
    medianIncome: 85000,
    demographics: {
      age: { median: 38, distribution: { '18-34': 28, '35-54': 30, '55+': 42 } },
      race: { 'White': 78, 'Hispanic': 15, 'Black': 4, 'Asian': 3, 'Other': 1 },
      education: { 'High School': 20, 'Some College': 18, 'Bachelor': 35, 'Graduate': 27 }
    },
    topIssues: ['Taxes', 'Energy', 'Property Rights'],
    coordinates: { lat: 30.3072, lng: -95.4920 }
  }
];

export const mockPersonas: Persona[] = [
  {
    id: 'persona-1',
    countyId: 'CA-LA',
    name: 'Alex Martinez',
    age: 32,
    occupation: 'Social Media Manager',
    householdInfo: {
      size: 2,
      income: 65000,
      type: 'Renting apartment with partner'
    },
    politicalAlignment: 'democratic',
    topPriorities: [
      {
        issue: 'Housing Affordability',
        importance: 95,
        description: 'Rent takes up 60% of income. Struggling to save for a down payment despite working full-time.'
      },
      {
        issue: 'Climate Change',
        importance: 85,
        description: 'Worried about wildfires and air quality. Supports renewable energy transition.'
      },
      {
        issue: 'Healthcare Access',
        importance: 75,
        description: 'Employer insurance is expensive. Needs better mental health coverage.'
      }
    ],
    background: 'Alex moved to LA five years ago for work opportunities. Enjoys the diversity and culture but struggles with the high cost of living. Active in local community organizing around housing issues.'
  },
  {
    id: 'persona-2',
    countyId: 'TX-Harris',
    name: 'Alex Johnson',
    age: 45,
    occupation: 'Oil & Gas Operations Manager',
    householdInfo: {
      size: 4,
      income: 95000,
      type: 'Owns home, two children'
    },
    politicalAlignment: 'republican',
    topPriorities: [
      {
        issue: 'Energy Industry',
        importance: 90,
        description: 'Job security depends on energy sector. Concerned about regulations affecting the industry.'
      },
      {
        issue: 'Taxes',
        importance: 80,
        description: 'Wants lower taxes to support family savings and children\'s education fund.'
      },
      {
        issue: 'Immigration',
        importance: 70,
        description: 'Supports legal immigration but concerned about border security and job competition.'
      }
    ],
    background: 'Alex has worked in the energy industry for 20 years. Lives in a suburban neighborhood, values family stability and economic opportunity. Active in local church and community sports.'
  },
  {
    id: 'persona-3',
    countyId: 'PA-Allegheny',
    name: 'Alex Chen',
    age: 38,
    occupation: 'Manufacturing Technician',
    householdInfo: {
      size: 3,
      income: 55000,
      type: 'Owns home, one child'
    },
    politicalAlignment: 'swing',
    topPriorities: [
      {
        issue: 'Manufacturing Jobs',
        importance: 92,
        description: 'Worried about factory closures and automation. Needs job training programs.'
      },
      {
        issue: 'Healthcare',
        importance: 88,
        description: 'Family has pre-existing conditions. Needs affordable, comprehensive coverage.'
      },
      {
        issue: 'Education',
        importance: 75,
        description: 'Wants better public schools and affordable college options for child.'
      }
    ],
    background: 'Alex\'s family has lived in the Pittsburgh area for three generations. Worked in manufacturing since high school. Values hard work and community but feels left behind by economic changes.'
  },
  {
    id: 'persona-4',
    countyId: 'TX-Montgomery',
    name: 'Alex Thompson',
    age: 52,
    occupation: 'Small Business Owner (Construction)',
    householdInfo: {
      size: 2,
      income: 110000,
      type: 'Owns home, empty nesters'
    },
    politicalAlignment: 'strongly-republican',
    topPriorities: [
      {
        issue: 'Property Rights',
        importance: 95,
        description: 'Concerned about regulations affecting business operations and property values.'
      },
      {
        issue: 'Taxes',
        importance: 90,
        description: 'Wants lower business taxes and fewer regulations to grow the business.'
      },
      {
        issue: 'Energy',
        importance: 75,
        description: 'Supports local energy industry and lower energy costs for business.'
      }
    ],
    background: 'Alex started a construction business 25 years ago. Values independence, hard work, and limited government intervention. Active in local business associations and conservative political groups.'
  }
];

export function getStateById(id: string): State | undefined {
  return mockStates.find(s => s.id === id);
}

// Re-export state election functions for backward compatibility
export { getAllStatesWithElections, getStateWithElections } from './stateElectionData';

export function getCountiesByState(stateId: string): County[] {
  return mockCounties.filter(c => c.stateId === stateId);
}

export function getCountyById(id: string): County | undefined {
  return mockCounties.find(c => c.id === id);
}

export function getPersonaByCounty(countyId: string): Persona | undefined {
  return mockPersonas.find(p => p.countyId === countyId);
}

export function getPersonaById(id: string): Persona | undefined {
  return mockPersonas.find(p => p.id === id);
}

export function getPoliticalColor(lean: PoliticalLean): string {
  const colors: Record<PoliticalLean, string> = {
    'strongly-democratic': '#1e40af',
    'democratic': '#3b82f6',
    'swing': '#8b5cf6',
    'republican': '#dc2626',
    'strongly-republican': '#991b1b'
  };
  return colors[lean];
}
