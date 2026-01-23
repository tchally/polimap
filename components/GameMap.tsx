'use client';

import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Jurisdiction, PolicyCard } from '@/types/gameV3';
import { State } from '@/types';

interface GameMapProps {
  jurisdiction: Jurisdiction;
  currentPolicy: PolicyCard | null;
  highlightRegions: string[];
}

const geoUrl = '/data/us-states.json';

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

export default function GameMap({ jurisdiction, currentPolicy, highlightRegions }: GameMapProps) {
  const playerStateAbbr = jurisdiction.state?.abbreviation || '';

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-stone-200 bg-white">
        <h2 className="font-bold text-stone-900">Your Jurisdiction</h2>
        <p className="text-sm text-stone-600">{jurisdiction.name}</p>
        {currentPolicy && (
          <div className="mt-2 text-xs">
            <p className="font-semibold text-stone-700">Current Policy:</p>
            <p className="text-stone-600">{currentPolicy.title}</p>
          </div>
        )}
      </div>
      <div className="flex-1 relative bg-stone-50">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000, center: [0, 0] }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateId = geo.id as string;
                const stateAbbr = stateAbbreviationMap[stateId] || '';
                const isPlayerState = stateAbbr === playerStateAbbr;
                const isHighlighted = highlightRegions.some((r) => 
                  r.toLowerCase().includes(stateAbbr.toLowerCase()) || 
                  r.toLowerCase().includes(stateAbbreviationMap[stateId]?.toLowerCase() || '')
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      isHighlighted
                        ? '#f59e0b' // Amber for highlighted
                        : isPlayerState
                        ? '#3b82f6' // Blue for player state
                        : '#e5e7eb' // Gray for others
                    }
                    stroke="#fff"
                    strokeWidth={isPlayerState ? 2 : 1}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', opacity: 0.8, cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    className={isHighlighted ? 'animate-pulse' : ''}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {highlightRegions.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-stone-200">
            <p className="text-xs font-semibold text-stone-700 mb-1">Policy Impact:</p>
            <p className="text-xs text-stone-600">{highlightRegions.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
