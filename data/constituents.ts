/**
 * Constituents — Named, persistent characters
 * Each has a core concern and non-negotiable value
 */

import { Constituent } from '@/types/gameV3';

export function generateConstituents(
  jurisdiction: { state: string; counties: string[] },
  count: number = 6
): Constituent[] {
  const names = [
    'Maria Rodriguez', 'James Chen', 'Patricia Williams', 'Robert Johnson',
    'Linda Martinez', 'Michael Brown', 'Elizabeth Davis', 'David Wilson',
    'Jennifer Garcia', 'Christopher Miller', 'Susan Anderson', 'Daniel Taylor',
  ];
  
  const occupations = [
    'Teacher', 'Nurse', 'Construction Worker', 'Small Business Owner',
    'Retail Worker', 'Farmer', 'Factory Worker', 'Healthcare Worker',
    'Retired', 'Student', 'Service Worker', 'Truck Driver',
  ];
  
  const coreConcerns = [
    'Healthcare access and costs',
    'Housing affordability',
    'Job security and wages',
    'Education quality',
    'Retirement security',
    'Environmental protection',
    'Tax burden',
    'Public safety',
  ];
  
  const nonNegotiableValues = [
    'Family comes first',
    'Fairness and equality',
    'Fiscal responsibility',
    'Personal freedom',
    'Community safety',
    'Environmental protection',
    'Economic opportunity',
    'Religious values',
  ];
  
  const familyContexts = [
    'Single parent, 2 kids',
    'Married, 3 kids',
    'Empty nester',
    'Single, no kids',
    'Married, 1 child',
    'Living with elderly parent',
    'Newlywed',
    'Retired couple',
  ];
  
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  const backgrounds = [
    {
      personalHistory: 'Grew up in a working-class family, first in their family to attend college. Worked multiple jobs to pay for education.',
      economicSituation: 'Struggles with student loan debt and rising cost of living. Lives paycheck to paycheck despite full-time work.',
      communityInvolvement: 'Active in local community center, volunteers at food bank on weekends.',
      politicalViews: 'Believes government should help working families but is skeptical of large programs.',
      challenges: ['Student loan payments', 'Finding affordable childcare', 'Job security'],
      hopes: ['Pay off debt', 'Buy a home', 'Provide better opportunities for children'],
    },
    {
      personalHistory: 'Raised in a small business family. Took over the family business after parents retired.',
      economicSituation: 'Business is stable but margins are tight. Depends on local economy and regulations.',
      communityInvolvement: 'Chamber of Commerce member, sponsors local youth sports teams.',
      politicalViews: 'Values economic freedom and limited regulation. Believes in supporting local businesses.',
      challenges: ['Rising labor costs', 'Competition from large chains', 'Regulatory compliance'],
      hopes: ['Business growth', 'Passing business to next generation', 'Strong local economy'],
    },
    {
      personalHistory: 'Healthcare worker for 15 years. Moved to this area for better opportunities.',
      economicSituation: 'Stable income but concerned about healthcare costs and retirement savings.',
      communityInvolvement: 'Union member, advocates for healthcare worker rights.',
      politicalViews: 'Believes healthcare is a right and supports policies that expand access.',
      challenges: ['Healthcare costs for family', 'Work-life balance', 'Retirement planning'],
      hopes: ['Universal healthcare access', 'Better working conditions', 'Secure retirement'],
    },
    {
      personalHistory: 'Recently lost job due to factory closure. Looking for new opportunities.',
      economicSituation: 'Unemployed, relying on savings and family support. Worried about future.',
      communityInvolvement: 'Former union member, now focused on finding work.',
      politicalViews: 'Feels left behind by economic changes. Wants policies that protect workers.',
      challenges: ['Finding employment', 'Healthcare coverage', 'Supporting family'],
      hopes: ['New job opportunity', 'Retraining programs', 'Economic stability'],
    },
    {
      personalHistory: 'Retired teacher, now on fixed income. Lives in the community where they taught.',
      economicSituation: 'Relies on pension and Social Security. Concerned about rising costs.',
      communityInvolvement: 'Active in senior center, volunteers at local library.',
      politicalViews: 'Values education and public services. Concerned about tax burden.',
      challenges: ['Rising healthcare costs', 'Property taxes', 'Inflation'],
      hopes: ['Maintain independence', 'Affordable healthcare', 'Strong schools'],
    },
    {
      personalHistory: 'Young professional, moved to area for job opportunity. Renting, hoping to buy.',
      economicSituation: 'Good income but high rent and student loans make saving difficult.',
      communityInvolvement: 'New to area, getting involved in local politics and community groups.',
      politicalViews: 'Progressive on social issues, pragmatic on economic issues.',
      challenges: ['Housing affordability', 'Student debt', 'Work-life balance'],
      hopes: ['Buy a home', 'Start a family', 'Make a difference in community'],
    },
  ];

  return selected.map((name, i) => {
    const county = jurisdiction.counties[i % jurisdiction.counties.length];
    const inJurisdiction = Math.random() > 0.3; // 70% in jurisdiction
    
    // Create IDs that match policy card expectations
    const idMap: Record<number, string> = {
      0: 'worker-1',
      1: 'worker-2',
      2: 'small-business-1',
      3: 'healthcare-worker-1',
      4: 'uninsured-1',
      5: 'taxpayer-1',
      6: 'renter-1',
      7: 'renter-2',
      8: 'property-owner-1',
      9: 'energy-worker-1',
      10: 'ratepayer-1',
      11: 'environmentalist-1',
      12: 'teacher-1',
      13: 'parent-1',
      14: 'senior-1',
      15: 'immigrant-1',
      16: 'farmer-1',
      17: 'border-community-1',
      18: 'construction-worker-1',
      19: 'rural-resident-1',
    };
    
    const background = backgrounds[i % backgrounds.length];
    
    return {
      id: idMap[i] || `constituent-${i + 1}`,
      name,
      age: 25 + Math.floor(Math.random() * 50),
      occupation: occupations[i % occupations.length],
      location: {
        county,
        state: jurisdiction.state,
        inJurisdiction,
      },
      familyContext: familyContexts[i % familyContexts.length],
      coreConcern: coreConcerns[i % coreConcerns.length],
      nonNegotiableValue: nonNegotiableValues[i % nonNegotiableValues.length],
      background,
    };
  });
}
