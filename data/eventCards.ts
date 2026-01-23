/**
 * Event Cards — JSON-driven content
 * Drawn at session start (1–2) and between turns.
 * Modify pressure meters; real-world inspired.
 */

import { EventCard } from '@/types/gameV2';

export const EVENT_CARDS: EventCard[] = [
  {
    id: 'evt-federal-rates',
    title: 'Federal interest rate hike',
    description: 'The Fed raises rates again. Your mortgage and car loan payments go up. Savings earn more, but credit card debt hurts.',
    level: 'federal',
    pressureDelta: { economic: 15, housing: 10 },
    narrative: 'Your monthly budget just got tighter. You’re cutting back on small luxuries to keep up.',
    sourceHint: 'Federal Reserve policy',
  },
  {
    id: 'evt-state-housing',
    title: 'State housing reform passes',
    description: 'New state law limits rent increases and expands tenant protections. Landlords warn of fewer rentals; advocates say it prevents displacement.',
    level: 'state',
    pressureDelta: { housing: -12, economic: 5 },
    narrative: 'Your rent increase notice is smaller than last year. You’re relieved, but worried about finding a new place if you ever have to move.',
    sourceHint: 'State housing legislation',
  },
  {
    id: 'evt-factory-closure',
    title: 'Factory closure',
    description: 'A major employer in the county announces it’s shutting down. Hundreds of jobs are leaving. Local businesses already feel the pinch.',
    level: 'local',
    pressureDelta: { economic: 25, health: 5 },
    narrative: 'Your spouse’s hours got cut. You’re dipping into savings and watching every dollar.',
    sourceHint: 'Local economic event',
  },
  {
    id: 'evt-extreme-weather',
    title: 'Extreme weather event',
    description: 'Floods / wildfires / severe storms hit the region. Property damage, power outages, and insurance headaches. Recovery will take months.',
    level: 'local',
    pressureDelta: { housing: 15, environment: 20, economic: 10 },
    narrative: 'Your basement flooded. Repairs aren’t fully covered. You’re stressed and exhausted.',
    sourceHint: 'Climate-linked extreme weather',
  },
  {
    id: 'evt-medicaid-changes',
    title: 'State Medicaid changes',
    description: 'The state narrows Medicaid eligibility. Some lose coverage; others face longer wait times. Clinics are overloaded.',
    level: 'state',
    pressureDelta: { health: 20, economic: 8 },
    narrative: 'You’re not sure if you still qualify. You’ve put off a check-up because you’re afraid of the bill.',
    sourceHint: 'State healthcare policy',
  },
  {
    id: 'evt-school-funding',
    title: 'School funding referendum fails',
    description: 'Voters reject a tax increase for schools. Class sizes will grow; programs will be cut. Teachers are already leaving.',
    level: 'local',
    pressureDelta: { education: 22, economic: 5 },
    narrative: 'Your kid’s class is packed. You’re thinking about tutoring, but you can’t afford it.',
    sourceHint: 'Local school funding',
  },
  {
    id: 'evt-childcare-crisis',
    title: 'Childcare provider closes',
    description: 'A large local childcare center shuts down. Waitlists elsewhere are long. Prices are rising.',
    level: 'local',
    pressureDelta: { economic: 18, education: 10, health: 5 },
    narrative: 'You’re juggling work and kids. Something has to give, and you don’t know what.',
    sourceHint: 'Childcare market',
  },
  {
    id: 'evt-opioid-settlement',
    title: 'Opioid settlement funds arrive',
    description: 'County receives opioid settlement money. Plans for treatment, prevention, and harm reduction. Heated debate over how to spend it.',
    level: 'local',
    pressureDelta: { health: -10, rightsSafety: 5 },
    narrative: 'There’s finally more help for people struggling with addiction. Your family has been affected; you’re cautiously hopeful.',
    sourceHint: 'Opioid settlement',
  },
  {
    id: 'evt-broadband-expansion',
    title: 'Broadband expansion approved',
    description: 'State and federal funds bring high-speed internet to underserved areas. Work-from-home and telehealth become more viable.',
    level: 'state',
    pressureDelta: { economic: -8, education: -5, health: -5 },
    narrative: 'You can finally work from home when needed. The kids’ homework is easier. It feels like a small win.',
    sourceHint: 'Infrastructure investment',
  },
  {
    id: 'evt-voting-access',
    title: 'Voting law changes',
    description: 'New rules change mail voting, ID requirements, and early voting. Supporters say it secures elections; critics say it limits access.',
    level: 'state',
    pressureDelta: { rightsSafety: 18, economic: 3 },
    narrative: 'You’re not sure you can get time off to vote. You’ve always voted; now it feels harder.',
    sourceHint: 'State voting legislation',
  },
  {
    id: 'evt-minimum-wage',
    title: 'Minimum wage increase',
    description: 'State raises the minimum wage over several years. Low-wage workers see gains; small businesses worry about labor costs.',
    level: 'state',
    pressureDelta: { economic: -12, housing: -5 },
    narrative: 'Your pay went up. It’s not huge, but it helps. You’re less anxious about rent.',
    sourceHint: 'State labor policy',
  },
  {
    id: 'evt-drought-water',
    title: 'Drought and water restrictions',
    description: 'Extended drought leads to water rationing. Farms and residents face cuts. Water bills rise.',
    level: 'local',
    pressureDelta: { environment: 20, housing: 10, economic: 8 },
    narrative: 'You’re cutting water use everywhere. The garden’s gone. You worry about fire season.',
    sourceHint: 'Climate / water policy',
  },
];

/** Draw 1–2 random event cards without replacement within a turn */
export function drawEventCards(
  pool: EventCard[],
  count: number,
  excludeIds: string[] = []
): EventCard[] {
  const available = pool.filter((c) => !excludeIds.includes(c.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
