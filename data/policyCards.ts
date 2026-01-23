/**
 * Policy Cards — Real-world inspired policies with framed arguments
 * Each policy includes arguments from different groups (not neutral pros/cons)
 */

import { PolicyCard, PressureCategory } from '@/types/gameV3';

export const POLICY_CARDS: PolicyCard[] = [
  {
    id: 'pol-minimum-wage',
    title: 'State Minimum Wage Increase',
    level: 'state',
    arguments: [
      {
        group: 'Workers',
        position: 'for',
        statement: 'This will help families make ends meet. Many of us work full-time and still struggle.',
      },
      {
        group: 'Small Business Owners',
        position: 'against',
        statement: 'We can\'t afford higher labor costs. This will force us to cut hours or close.',
      },
      {
        group: 'Labor Unions',
        position: 'for',
        statement: 'A living wage is a basic right. This lifts up the entire economy.',
      },
      {
        group: 'Chamber of Commerce',
        position: 'against',
        statement: 'This will drive jobs out of state and hurt our competitiveness.',
      },
    ],
    directImpact: {
      description: 'Directly affects all workers earning below the new minimum wage threshold.',
      groups: ['Low-wage workers', 'Service industry employees', 'Small business owners'],
      regions: ['Statewide'],
    },
    indirectImpact: {
      description: 'May affect consumer prices, business hiring decisions, and state tax revenue.',
      groups: ['Consumers', 'Businesses', 'State budget'],
      regions: ['Statewide', 'Border counties'],
    },
    immediateEffects: {
      pressureChanges: {
        economic: -10,
        housing: -5,
      },
      affectedConstituents: ['worker-1', 'worker-2', 'small-business-1'],
    },
    urgency: 'high',
    timeRemaining: 120, // 2 minutes
  },
  {
    id: 'pol-medicaid-expansion',
    title: 'Medicaid Expansion',
    level: 'state',
    arguments: [
      {
        group: 'Healthcare Advocates',
        position: 'for',
        statement: 'This will save lives and reduce emergency room costs. People need preventive care.',
      },
      {
        group: 'Budget Hawks',
        position: 'against',
        statement: 'We can\'t afford the long-term costs. This will strain the state budget.',
      },
      {
        group: 'Rural Hospitals',
        position: 'for',
        statement: 'We\'re closing because we can\'t cover uncompensated care. This keeps us open.',
      },
      {
        group: 'Taxpayers',
        position: 'against',
        statement: 'This means higher taxes. We already pay enough.',
      },
    ],
    directImpact: {
      description: 'Expands health coverage to low-income residents below 138% of poverty line.',
      groups: ['Low-income residents', 'Rural hospitals', 'State budget'],
      regions: ['Statewide', 'Rural areas'],
    },
    indirectImpact: {
      description: 'May affect insurance markets, healthcare provider capacity, and federal funding.',
      groups: ['Insurance companies', 'Healthcare providers', 'Federal government'],
      regions: ['Statewide'],
    },
    immediateEffects: {
      pressureChanges: {
        health: -15,
        economic: 8,
      },
      affectedConstituents: ['healthcare-worker-1', 'uninsured-1', 'taxpayer-1'],
    },
    uncertainEffects: {
      description: 'Long-term budget impact depends on federal funding and enrollment numbers.',
      probability: 0.6,
      possibleOutcomes: [
        'Federal funding covers most costs',
        'State budget strain increases over time',
        'Enrollment exceeds projections',
      ],
    },
    urgency: 'medium',
    timeRemaining: 180, // 3 minutes
    realWorldPolicy: {
      description: 'Medicaid expansion continues to be a key state-level policy decision, with ongoing debates about costs and benefits.',
      status: 'Active in multiple states',
      newsArticles: [
        {
          title: 'Medicaid Expansion: State-by-State Analysis',
          url: 'https://www.example.com/medicaid-expansion',
          source: 'Healthcare Policy Review',
        },
      ],
    },
  },
  {
    id: 'pol-housing-trust',
    title: 'Affordable Housing Trust Fund',
    level: 'state',
    arguments: [
      {
        group: 'Housing Advocates',
        position: 'for',
        statement: 'Families are being priced out. We need affordable housing now.',
      },
      {
        group: 'Developers',
        position: 'against',
        statement: 'This adds costs and regulations that will slow construction.',
      },
      {
        group: 'Renters',
        position: 'for',
        statement: 'We can\'t find anywhere to live. This is a crisis.',
      },
      {
        group: 'Property Owners',
        position: 'against',
        statement: 'This will reduce property values and hurt homeowners.',
      },
    ],
    directImpact: {
      description: 'Creates dedicated funding for affordable housing construction and rental assistance.',
      groups: ['Low-income renters', 'Housing developers', 'Property owners'],
      regions: ['Urban areas', 'High-cost counties'],
    },
    indirectImpact: {
      description: 'May affect property markets, construction industry, and local tax bases.',
      groups: ['Real estate market', 'Construction workers', 'Local governments'],
      regions: ['Statewide'],
    },
    immediateEffects: {
      pressureChanges: {
        housing: -12,
        economic: 5,
      },
      affectedConstituents: ['renter-1', 'renter-2', 'property-owner-1'],
    },
    delayedEffects: {
      description: 'Housing construction takes time. Real impact won\'t be felt for 2-3 years.',
      turnsUntilReveal: 3,
    },
    urgency: 'high',
    timeRemaining: 150, // 2.5 minutes
  },
  {
    id: 'pol-climate-bill',
    title: 'Renewable Energy Mandate',
    level: 'state',
    arguments: [
      {
        group: 'Environmentalists',
        position: 'for',
        statement: 'Climate change is urgent. We need to transition to clean energy now.',
      },
      {
        group: 'Energy Companies',
        position: 'against',
        statement: 'This will raise energy costs and hurt reliability. The grid isn\'t ready.',
      },
      {
        group: 'Green Jobs Advocates',
        position: 'for',
        statement: 'This creates jobs and positions our state as a leader.',
      },
      {
        group: 'Ratepayers',
        position: 'against',
        statement: 'Our bills are already high. This will make it worse.',
      },
    ],
    directImpact: {
      description: 'Requires utilities to source 50% renewable energy by 2030.',
      groups: ['Energy utilities', 'Ratepayers', 'Renewable energy companies'],
      regions: ['Statewide'],
    },
    indirectImpact: {
      description: 'May affect energy prices, grid stability, and job markets in energy sector.',
      groups: ['Energy workers', 'Manufacturing', 'Environmental health'],
      regions: ['Statewide', 'Energy-producing regions'],
    },
    immediateEffects: {
      pressureChanges: {
        environment: -15,
        economic: 8,
      },
      affectedConstituents: ['energy-worker-1', 'ratepayer-1', 'environmentalist-1'],
    },
    uncertainEffects: {
      description: 'Technology costs and grid integration challenges are uncertain.',
      probability: 0.7,
      possibleOutcomes: [
        'Renewable costs continue to drop',
        'Grid integration proves challenging',
        'Energy prices stabilize',
      ],
    },
    urgency: 'medium',
    timeRemaining: 200, // 3.3 minutes
  },
  {
    id: 'pol-education-funding',
    title: 'School Funding Referendum',
    level: 'state',
    arguments: [
      {
        group: 'Teachers',
        position: 'for',
        statement: 'Our schools are underfunded. Kids deserve better resources and smaller classes.',
      },
      {
        group: 'Taxpayers',
        position: 'against',
        statement: 'We already pay high property taxes. This is too much.',
      },
      {
        group: 'Parents',
        position: 'for',
        statement: 'Our children\'s future depends on quality education.',
      },
      {
        group: 'Seniors',
        position: 'against',
        statement: 'We\'re on fixed incomes. We can\'t afford more taxes.',
      },
    ],
    directImpact: {
      description: 'Increases property tax to fund teacher salaries and classroom resources.',
      groups: ['Teachers', 'Students', 'Property owners'],
      regions: ['Statewide', 'School districts'],
    },
    indirectImpact: {
      description: 'May affect property values, teacher retention, and educational outcomes.',
      groups: ['Property market', 'School districts', 'Future workforce'],
      regions: ['Statewide'],
    },
    immediateEffects: {
      pressureChanges: {
        education: -12,
        economic: 6,
      },
      affectedConstituents: ['teacher-1', 'parent-1', 'senior-1'],
    },
    urgency: 'high',
    timeRemaining: 120, // 2 minutes
  },
  {
    id: 'pol-immigration',
    title: 'Immigration Enforcement Bill',
    level: 'federal',
    arguments: [
      {
        group: 'Border Security Advocates',
        position: 'for',
        statement: 'We need to secure our borders and enforce existing laws. This protects our communities.',
      },
      {
        group: 'Immigrant Rights Groups',
        position: 'against',
        statement: 'This will separate families and harm communities that contribute to our economy.',
      },
      {
        group: 'Business Leaders',
        position: 'against',
        statement: 'This will hurt industries that rely on immigrant labor. We need workers.',
      },
      {
        group: 'Law Enforcement',
        position: 'for',
        statement: 'Clear enforcement helps us do our jobs and keeps communities safe.',
      },
    ],
    directImpact: {
      description: 'Increases border enforcement and changes immigration processing.',
      groups: ['Immigrant communities', 'Border regions', 'Law enforcement'],
      regions: ['Border states', 'Urban areas'],
    },
    indirectImpact: {
      description: 'May affect labor markets, community relations, and federal resources.',
      groups: ['Agriculture', 'Service industries', 'Local governments'],
      regions: ['Nationwide'],
    },
    immediateEffects: {
      pressureChanges: {
        rightsSafety: 15,
        economic: -5,
      },
      affectedConstituents: ['immigrant-1', 'farmer-1', 'border-community-1'],
    },
    uncertainEffects: {
      description: 'Long-term economic and social impacts are difficult to predict.',
      probability: 0.8,
      possibleOutcomes: [
        'Labor shortages in key industries',
        'Improved border security metrics',
        'Community trust issues',
      ],
    },
    urgency: 'high',
    timeRemaining: 150,
    realWorldPolicy: {
      description: 'Inspired by ongoing federal immigration enforcement debates and border security legislation.',
      status: 'Active in Congress',
      newsArticles: [
        {
          title: 'Immigration Enforcement: Current Policy Debates',
          url: 'https://www.example.com/immigration-enforcement',
          source: 'Policy Analysis',
        },
      ],
    },
  },
  {
    id: 'pol-infrastructure',
    title: 'Infrastructure Investment Package',
    level: 'federal',
    arguments: [
      {
        group: 'Construction Workers',
        position: 'for',
        statement: 'This creates jobs and fixes roads and bridges we use every day.',
      },
      {
        group: 'Fiscal Conservatives',
        position: 'against',
        statement: 'We can\'t afford this level of spending. It will increase the deficit.',
      },
      {
        group: 'Business Leaders',
        position: 'for',
        statement: 'Modern infrastructure makes our economy competitive. This is an investment.',
      },
      {
        group: 'Taxpayers',
        position: 'against',
        statement: 'This means higher taxes or more debt. We\'re already paying enough.',
      },
    ],
    directImpact: {
      description: 'Major federal investment in roads, bridges, broadband, and water systems.',
      groups: ['Construction industry', 'Rural communities', 'State governments'],
      regions: ['Nationwide', 'Rural areas'],
    },
    indirectImpact: {
      description: 'May affect economic growth, job markets, and long-term competitiveness.',
      groups: ['Manufacturing', 'Transportation', 'Future generations'],
      regions: ['Nationwide'],
    },
    immediateEffects: {
      pressureChanges: {
        economic: -8,
        housing: -3,
      },
      affectedConstituents: ['construction-worker-1', 'rural-resident-1', 'taxpayer-1'],
    },
    delayedEffects: {
      description: 'Infrastructure projects take years. Real benefits won\'t be visible for 3-5 years.',
      turnsUntilReveal: 4,
    },
    urgency: 'medium',
    timeRemaining: 240,
    realWorldPolicy: {
      description: 'Inspired by the Infrastructure Investment and Jobs Act and ongoing infrastructure funding debates.',
      status: 'Legislation passed, implementation ongoing',
      billNumber: 'H.R. 3684 (117th Congress)',
      congressGovUrl: 'https://www.congress.gov/bill/117th-congress/house-bill/3684',
      newsArticles: [
        {
          title: 'Infrastructure Investment: Impact Analysis',
          url: 'https://www.example.com/infrastructure-investment',
          source: 'Economic Policy Review',
        },
      ],
    },
  },
];

/** Draw policies for a game session */
export function drawPolicyCards(
  role: 'state-legislator' | 'senator' | 'governor',
  count: number = 5
): PolicyCard[] {
  // Filter by level based on role
  const filtered = POLICY_CARDS.filter((p) => {
    if (role === 'senator') return p.level === 'federal';
    if (role === 'state-legislator' || role === 'governor') return p.level === 'state';
    return true;
  });
  
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
