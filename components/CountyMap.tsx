'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getPoliticalColor } from '@/data/mockData';
import { getCountiesByStateWithElections } from '@/data/enrichedCountyData';
import { County } from '@/types';
import { ArrowLeft, Info } from 'lucide-react';

const geoUrl = '/data/us-counties.json';

// State FIPS to abbreviation mapping
const stateFipsToAbbr: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY'
};

export default function CountyMap() {
  console.log('🚀 CountyMap component rendered');
  const { selectedState, goToStateMap, goToPersona } = useApp();
  const [hoveredCounty, setHoveredCounty] = useState<County | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🚀 CountyMap - selectedState:', selectedState?.name);

  if (!selectedState) {
    console.log('🚀 CountyMap - No selected state, redirecting');
    goToStateMap();
    return null;
  }

  // Load counties with election data
  useEffect(() => {
    if (!selectedState) return;
    
    const stateId = selectedState.id; // Capture to avoid null check issues
    
    async function loadCounties() {
      setLoading(true);
      console.log(`🗺️ Loading counties for state: ${stateId}`);
      try {
        const enrichedCounties = await getCountiesByStateWithElections(stateId);
        console.log(`✅ Loaded ${enrichedCounties.length} counties for ${stateId}`);
        // Check a sample county income
        const sample = enrichedCounties.find(c => c.name.includes('Alameda'));
        if (sample) {
          console.log(`💰 Sample county income check: ${sample.name} = $${sample.medianIncome.toLocaleString()}`);
        }
        setCounties(enrichedCounties);
      } catch (error) {
        console.error('❌ Error loading counties:', error);
        // Fallback to mock data
        const { getCountiesByState } = await import('@/data/mockData');
        setCounties(getCountiesByState(stateId));
      } finally {
        setLoading(false);
      }
    }
    loadCounties();
  }, [selectedState]);

  // Create a map of counties by name and FIPS for quick lookup
  const countiesByName = useMemo(() => {
    const map: Record<string, County> = {};
    counties.forEach(county => {
      // Normalize county name for matching (remove "County", "Parish", etc.)
      const normalizedName = county.name
        .toLowerCase()
        .replace(/\s(county|parish|borough|census area)$/i, '')
        .trim();
      map[normalizedName] = county;
      // Also add with full name
      map[county.name.toLowerCase()] = county;
      // Add variations (e.g., "Los Angeles" and "LosAngeles")
      map[normalizedName.replace(/\s+/g, '')] = county;
    });
    return map;
  }, [counties]);

  const handleCountyClick = (countyId: string | null) => {
    if (!countyId) return;
    const county = counties.find(c => c.id === countyId);
    if (county) {
      goToPersona(county);
    }
  };

  const handleMouseMove = (e: React.MouseEvent, countyId: string | null) => {
    if (!countyId) {
      setHoveredCounty(null);
      return;
    }
    const county = counties.find(c => c.id === countyId);
    if (county) {
      setHoveredCounty(county);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    }
    return `${(pop / 1000).toFixed(0)}K`;
  };

  // Get state FIPS code for filtering
  const stateFips = Object.entries(stateFipsToAbbr).find(([_, abbr]) => abbr === selectedState.abbreviation)?.[0];

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={goToStateMap}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to States</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{selectedState.name} Counties</h1>
          <p className="text-gray-600 mt-1">Click on a county to meet a representative persona</p>
        </div>
      </div>

      <div className="pt-32 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600">Loading county data...</p>
            </div>
          ) : counties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600">No county data available for {selectedState.name} yet.</p>
              <button
                onClick={goToStateMap}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to State Map
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">County Information</h2>
                </div>
                <p className="text-gray-700">
                  Explore counties in {selectedState.name}. Each county represents different communities with unique priorities and perspectives.
                </p>
              </div>

              {/* County Map */}
              {stateFips && (
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                  <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: '600px' }}>
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{
                        scale: selectedState.abbreviation === 'CA' ? 2400 : 
                               selectedState.abbreviation === 'TX' ? 2200 :
                               selectedState.abbreviation === 'FL' ? 3200 :
                               selectedState.abbreviation === 'NY' ? 3500 :
                               selectedState.abbreviation === 'RI' ? 6000 :
                               selectedState.abbreviation === 'CT' ? 4500 :
                               selectedState.abbreviation === 'NJ' ? 4200 :
                               selectedState.abbreviation === 'MA' ? 3800 :
                               selectedState.abbreviation === 'PA' ? 2200 :
                               selectedState.abbreviation === 'OH' ? 2200 :
                               selectedState.abbreviation === 'GA' ? 2200 :
                               selectedState.abbreviation === 'NC' ? 2200 :
                               selectedState.abbreviation === 'MI' ? 2000 : 2400,
                        center: selectedState.coordinates ? [selectedState.coordinates.lng, selectedState.coordinates.lat] : [0, 0]
                      }}
                      style={{ width: '100%', height: '600px' }}
                    >
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies
                            .filter((geo) => {
                              const geoId = geo.id as string;
                              if (!geoId || geoId.length < 5) return false;
                              const geoStateFips = geoId.toString().substring(0, 2);
                              return geoStateFips === stateFips;
                            })
                            .map((geo) => {
                              const properties = geo.properties as any;
                              const countyName = (properties?.name || '').toString();
                              const normalizedName = countyName
                                .toLowerCase()
                                .replace(/\s(county|parish|borough|census area)$/i, '')
                                .trim();
                              
                              const county = countiesByName[normalizedName] || countiesByName[countyName.toLowerCase()];
                              
                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={county ? getPoliticalColor(county.politicalLean) : '#e5e7eb'}
                                  stroke="#fff"
                                  strokeWidth={0.5}
                                  style={{
                                    default: { outline: 'none' },
                                    hover: { outline: 'none', opacity: 0.8, cursor: 'pointer' },
                                    pressed: { outline: 'none' }
                                  }}
                                  onClick={() => county && handleCountyClick(county.id)}
                                  onMouseMove={(e) => {
                                    if (county) {
                                      const event = e as any;
                                      setHoveredCounty(county);
                                      setTooltipPosition({ x: event.clientX || 0, y: event.clientY || 0 });
                                    }
                                  }}
                                  onMouseLeave={() => setHoveredCounty(null)}
                                />
                              );
                            })
                        }
                      </Geographies>
                    </ComposableMap>
                  </div>
                </div>
              )}

              {/* Grid view for better UX on smaller screens and as fallback */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {counties.map((county) => (
                  <button
                    key={county.id}
                    onClick={() => handleCountyClick(county.id)}
                    onMouseMove={(e) => handleMouseMove(e, county.id)}
                    onMouseLeave={() => setHoveredCounty(null)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl border-2 border-gray-200 hover:border-indigo-500 p-6 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {county.name}
                      </h3>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getPoliticalColor(county.politicalLean) }}
                      ></div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold text-gray-900">Population:</span>{' '}
                        {formatPopulation(county.population)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Median Income:</span>{' '}
                        {formatCurrency(county.medianIncome)}
                      </p>
                      {county.demographics?.age?.median && (
                        <p>
                          <span className="font-semibold text-gray-900">Median Age:</span>{' '}
                          {county.demographics.age.median.toFixed(1)} years
                        </p>
                      )}
                      {county.demographics?.race && Object.keys(county.demographics.race).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Demographics:</p>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {Object.entries(county.demographics.race)
                              .filter(([_, value]) => value > 5) // Only show if > 5%
                              .sort(([_, a], [__, b]) => b - a)
                              .slice(0, 2)
                              .map(([race, percentage]) => (
                                <span key={race} className="inline-block mr-2">
                                  {race}: {percentage.toFixed(0)}%
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      {county.topIssues && county.topIssues.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold text-gray-900 mb-1">Top Issues:</p>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {county.topIssues.slice(0, 2).map((issue, idx) => (
                              <li key={idx}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-indigo-600 font-medium group-hover:text-indigo-700">
                        Click to meet a persona →
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {hoveredCounty && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
            maxWidth: '400px'
          }}
        >
          <h3 className="font-bold text-lg text-gray-900 mb-3">{hoveredCounty.name}</h3>
          
          {/* Basic Stats */}
          <div className="space-y-1 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
            <p>
              <span className="font-semibold text-gray-900">Population:</span> {hoveredCounty.population.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Median Income:</span> {formatCurrency(hoveredCounty.medianIncome)}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Median Age:</span> {hoveredCounty.demographics.age.median.toFixed(1)} years
            </p>
          </div>

          {/* Demographics */}
          {hoveredCounty.demographics && (
            <>
              {/* Race/Ethnicity */}
              {hoveredCounty.demographics.race && Object.keys(hoveredCounty.demographics.race).length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Race & Ethnicity:</p>
                  <div className="space-y-1">
                    {Object.entries(hoveredCounty.demographics.race)
                      .filter(([_, value]) => value > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .slice(0, 4)
                      .map(([race, percentage]) => (
                        <div key={race} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{race}:</span>
                          <span className="font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {hoveredCounty.demographics.education && Object.keys(hoveredCounty.demographics.education).length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Education (25+):</p>
                  <div className="space-y-1">
                    {Object.entries(hoveredCounty.demographics.education)
                      .filter(([_, value]) => value > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .slice(0, 3)
                      .map(([level, percentage]) => (
                        <div key={level} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{level}:</span>
                          <span className="font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Top Issues */}
          {hoveredCounty.topIssues && hoveredCounty.topIssues.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Top Issues:</p>
              <ul className="text-xs text-gray-600">
                {hoveredCounty.topIssues.slice(0, 3).map((issue, idx) => (
                  <li key={idx}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
