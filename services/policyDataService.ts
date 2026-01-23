/**
 * Policy Data Service
 * Fetches real policy data from multiple sources:
 * - NewsAPI: Current policy news and discussions
 * - Congress.gov API: Federal bills and legislation
 * - State/Local sources: State legislative APIs (future)
 */

import { County } from '@/types';

export interface PolicyArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  level: 'federal' | 'state' | 'local';
  topics: string[];
}

export interface CongressionalBill {
  number: string;
  title: string;
  summary: string;
  introducedDate: string;
  latestAction: string;
  status: string;
  url: string;
  subjects: string[];
}

/**
 * Fetch policy-related news from NewsAPI
 */
export async function fetchPolicyNews(
  county: County,
  apiKey: string,
  limit: number = 10
): Promise<PolicyArticle[]> {
  if (!apiKey) {
    console.warn('News API key not provided');
    return [];
  }

  try {
    // Build multiple targeted searches for better variety
    const searches = [
      // General policy search
      `(${county.stateName} OR ${county.name}) AND (legislation OR bill OR policy)`,
      // Top issues
      ...county.topIssues.slice(0, 3).map(issue => 
        `(${county.stateName} OR ${county.name}) AND "${issue}" AND (policy OR legislation)`
      ),
      // Federal level
      `congress AND legislation AND 2026`,
      // State level  
      `${county.stateName} state legislature AND bill`,
    ];

    const allArticles: PolicyArticle[] = [];

    // Fetch from multiple searches to get variety
    for (const searchQuery of searches.slice(0, 3)) { // Limit to 3 searches to avoid rate limits
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`NewsAPI search failed for "${searchQuery}": ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        
        if (data.status !== 'ok') {
          console.warn(`NewsAPI error for "${searchQuery}": ${data.message || 'Unknown error'}`);
          continue;
        }

        const articles = (data.articles || []).map((article: any) => ({
          title: article.title || '',
          description: article.description || article.content?.substring(0, 200) || '',
          url: article.url || '',
          source: article.source?.name || 'Unknown',
          publishedAt: article.publishedAt || '',
          level: determinePolicyLevel(article.title, article.description, county),
          topics: extractTopics(article.title, article.description),
        }));

        allArticles.push(...articles);
        
        // Avoid duplicates
        const uniqueArticles = Array.from(
          new Map(allArticles.map(a => [a.title, a])).values()
        );
        allArticles.length = 0;
        allArticles.push(...uniqueArticles);
        
      } catch (searchError) {
        console.warn(`Error in NewsAPI search "${searchQuery}":`, searchError);
        continue;
      }
    }

    // Return up to limit articles, sorted by relevance
    return allArticles.slice(0, limit);
  } catch (error) {
    console.error('Error fetching policy news:', error);
    return [];
  }
}

/**
 * Fetch bills from Congress.gov API
 * 
 * Congress.gov API Documentation: https://api.congress.gov/
 * 
 * To enable:
 * 1. Sign up at https://api.congress.gov/
 * 2. Get your API key
 * 3. Add CONGRESS_API_KEY to .env
 * 4. Uncomment and configure the implementation below
 */
export async function fetchCongressionalBills(
  county: County,
  limit: number = 10
): Promise<CongressionalBill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  
  if (!apiKey) {
    // No API key - return empty array
    // The system will work with News API and AI-generated scenarios
    return [];
  }

  try {
    // Congress.gov API v3 endpoint
    // Example: https://api.congress.gov/v3/bill?api_key=YOUR_KEY
    // This requires proper API key setup and endpoint configuration
    
    // TODO: Implement Congress.gov API integration
    // const response = await fetch(
    //   `https://api.congress.gov/v3/bill?format=json&limit=${limit}&apiKey=${apiKey}`
    // );
    // const data = await response.json();
    // ... parse and return bills
    
    console.warn('Congress.gov API integration not yet implemented');
    return [];
  } catch (error) {
    console.error('Error fetching congressional bills:', error);
    return [];
  }
}

/**
 * Fetch state-level bills (placeholder for future implementation)
 */
export async function fetchStateBills(
  stateAbbr: string,
  limit: number = 10
): Promise<CongressionalBill[]> {
  // State legislative APIs vary by state
  // Examples: Open States API, individual state APIs
  // This would need to be implemented per state
  return [];
}

/**
 * Determine policy level based on content
 */
function determinePolicyLevel(
  title: string,
  description: string,
  county: County
): 'federal' | 'state' | 'local' {
  const text = `${title} ${description}`.toLowerCase();
  
  // Federal indicators
  if (text.includes('congress') || text.includes('federal') || 
      text.includes('house of representatives') || text.includes('senate') ||
      text.includes('president') || text.includes('white house')) {
    return 'federal';
  }
  
  // Local indicators
  if (text.includes('city council') || text.includes('county') ||
      text.includes(county.name.toLowerCase()) || text.includes('municipal')) {
    return 'local';
  }
  
  // Default to state
  return 'state';
}

/**
 * Extract policy topics from text
 */
function extractTopics(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const topics: string[] = [];
  
  const topicKeywords: Record<string, string> = {
    'housing': 'Housing',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'tax': 'Taxes',
    'economy': 'Economy',
    'employment': 'Employment',
    'climate': 'Climate',
    'environment': 'Environment',
    'immigration': 'Immigration',
    'infrastructure': 'Infrastructure',
    'social security': 'Social Security',
    'medicare': 'Healthcare',
    'medicaid': 'Healthcare',
    'gun': 'Gun Control',
    'abortion': 'Reproductive Rights',
    'voting': 'Voting Rights',
  };
  
  for (const [keyword, topic] of Object.entries(topicKeywords)) {
    if (text.includes(keyword) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }
  
  return topics.slice(0, 5); // Limit to 5 topics
}

/**
 * Get all policy data for a county
 */
export async function getAllPolicyData(
  county: County,
  newsApiKey?: string
): Promise<{
  articles: PolicyArticle[];
  federalBills: CongressionalBill[];
  stateBills: CongressionalBill[];
}> {
  const [articles, federalBills, stateBills] = await Promise.all([
    newsApiKey ? fetchPolicyNews(county, newsApiKey, 15) : Promise.resolve([]),
    fetchCongressionalBills(county, 10),
    fetchStateBills(county.stateId, 10),
  ]);

  return {
    articles,
    federalBills,
    stateBills,
  };
}
