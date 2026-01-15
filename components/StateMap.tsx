'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getPoliticalColor } from '@/data/mockData';
import { getAllStatesWithElections } from '@/data/stateElectionData';
import { State } from '@/types';
import { Info } from 'lucide-react';

const geoUrl = '/data/us-states.json';

// State abbreviation mapping - us-atlas uses state IDs that need to match our data
const stateAbbreviationMap: Record<string, string> = {
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

export default function StateMap() {
  const { goToCountyMap } = useApp();
  const [hoveredState, setHoveredState] = useState<State | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

  // Load states with real election data
  useEffect(() => {
    async function loadStates() {
      setLoading(true);
      try {
        const statesWithElections = await getAllStatesWithElections();
        setStates(statesWithElections);
      } catch (error) {
        console.error('Error loading states:', error);
        // Fallback to mock data
        const { mockStates } = await import('@/data/mockData');
        setStates(mockStates);
      } finally {
        setLoading(false);
      }
    }
    loadStates();
  }, []);

  // Create a map of states by abbreviation for quick lookup
  const statesByAbbr = useMemo(() => {
    const map: Record<string, State> = {};
    states.forEach(state => {
      map[state.abbreviation] = state;
    });
    return map;
  }, [states]);

  const handleStateClick = (stateAbbr: string) => {
    const state = statesByAbbr[stateAbbr];
    if (state) {
      goToCountyMap(state);
    }
  };

  const handleMouseMove = (e: React.MouseEvent, stateAbbr: string) => {
    const state = statesByAbbr[stateAbbr];
    if (state) {
      setHoveredState(state);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M`;
    }
    return `${(pop / 1000).toFixed(0)}K`;
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">U.S. Political Empathy Map</h1>
          <p className="text-gray-600 mt-1">Click on a state to explore county-level perspectives</p>
        </div>
      </div>

      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">How to Use</h2>
            </div>
            <p className="text-gray-700">
              Hover over states to see key information. Click on any state to explore county-level data and meet representative personas from different regions.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Political Lean Legend</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: getPoliticalColor('strongly-democratic') }}></div>
                  <span className="text-sm text-gray-700">Strongly Democratic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: getPoliticalColor('democratic') }}></div>
                  <span className="text-sm text-gray-700">Democratic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: getPoliticalColor('swing') }}></div>
                  <span className="text-sm text-gray-700">Swing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: getPoliticalColor('republican') }}></div>
                  <span className="text-sm text-gray-700">Republican</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: getPoliticalColor('strongly-republican') }}></div>
                  <span className="text-sm text-gray-700">Strongly Republican</span>
                </div>
              </div>
            </div>

            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: '600px' }}>
              <ComposableMap
                projection="geoAlbersUsa"
                projectionConfig={{
                  scale: 1000,
                  center: [0, 0]
                }}
                style={{ width: '100%', height: '600px' }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      // Try to get state abbreviation from different possible property names
                      const stateId = geo.id as string;
                      const properties = geo.properties as any;
                      const stateAbbr = stateAbbreviationMap[stateId] || properties?.name || properties?.abbreviation || properties?.NAME || '';
                      const state = statesByAbbr[stateAbbr];
                      
                      if (!state) {
                        // Default color for states without data
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#e5e7eb"
                            stroke="#fff"
                            strokeWidth={1}
                            style={{
                              default: { outline: 'none' },
                              hover: { outline: 'none', fill: '#d1d5db' },
                              pressed: { outline: 'none' }
                            }}
                          />
                        );
                      }

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getPoliticalColor(state.politicalLean)}
                          stroke="#fff"
                          strokeWidth={1}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: getPoliticalColor(state.politicalLean), opacity: 0.8, cursor: 'pointer' },
                            pressed: { outline: 'none' }
                          }}
                          onClick={() => handleStateClick(stateAbbr)}
                          onMouseMove={(e) => handleMouseMove(e.nativeEvent as any, stateAbbr)}
                          onMouseLeave={() => setHoveredState(null)}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>

            {/* Grid view for better UX on smaller screens */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {states.map((state) => (
                <button
                  key={state.id}
                  onClick={() => goToCountyMap(state)}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{state.name}</h3>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPoliticalColor(state.politicalLean) }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">Pop: {formatPopulation(state.population)}</p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Top Issues:</p>
                    <ul className="text-xs text-gray-700 mt-1">
                      {state.topIssues.slice(0, 2).map((issue, idx) => (
                        <li key={idx}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hoveredState && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
            maxWidth: '300px'
          }}
        >
          <h3 className="font-bold text-lg text-gray-900 mb-2">{hoveredState.name}</h3>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">Population:</span> {hoveredState.population.toLocaleString()}
          </p>
          <div className="mt-2">
            <p className="text-xs font-semibold text-gray-700 mb-1">Top Issues:</p>
            <ul className="text-xs text-gray-600">
              {hoveredState.topIssues.map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-indigo-600 mt-2 font-medium">Click to explore counties →</p>
        </div>
      )}
    </div>
  );
}
