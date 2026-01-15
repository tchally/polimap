'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { getPersonaByCounty, getCountiesByState, getPoliticalColor } from '@/data/mockData';
import { Persona, County } from '@/types';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';

export default function ComparePerspectives() {
  const { selectedCounty, selectedState, goToCountyMap, setCurrentView } = useApp();
  const [selectedPersona2, setSelectedPersona2] = useState<Persona | null>(null);

  if (!selectedCounty || !selectedState) {
    if (selectedState) {
      goToCountyMap(selectedState);
    } else {
      setCurrentView('state-map');
    }
    return null;
  }

  const persona1 = getPersonaByCounty(selectedCounty.id);
  const counties = getCountiesByState(selectedState.id);
  const otherCounties = counties.filter((c) => c.id !== selectedCounty.id);

  if (!persona1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No persona data available for comparison.</p>
          <button
            onClick={() => selectedState && goToCountyMap(selectedState)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Counties
          </button>
        </div>
      </div>
    );
  }

  const handleSelectPersona2 = (county: County) => {
    const persona = getPersonaByCounty(county.id);
    if (persona) {
      setSelectedPersona2(persona);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => selectedState && goToCountyMap(selectedState)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Counties</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Compare Perspectives</h1>
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {!selectedPersona2 ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Select Another Persona to Compare</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Compare {persona1.name} from {selectedCounty.name} with someone from another county in{' '}
                {selectedState.name}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherCounties.map((county) => {
                  const persona = getPersonaByCounty(county.id);
                  if (!persona) return null;
                  return (
                    <button
                      key={county.id}
                      onClick={() => handleSelectPersona2(county)}
                      className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{persona.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{county.name}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPoliticalColor(persona.politicalAlignment) }}
                        ></div>
                        <span className="text-xs text-gray-600">
                          {persona.politicalAlignment.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Persona 1 */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{persona1.name}</h2>
                  <div
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: getPoliticalColor(persona1.politicalAlignment) }}
                  >
                    {persona1.politicalAlignment.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{selectedCounty.name}</p>
                <div className="space-y-2 text-sm mb-6">
                  <p>
                    <span className="font-semibold">Age:</span> {persona1.age}
                  </p>
                  <p>
                    <span className="font-semibold">Occupation:</span> {persona1.occupation}
                  </p>
                  <p>
                    <span className="font-semibold">Household:</span> {persona1.householdInfo.type}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Top Priorities
                  </h3>
                  <div className="space-y-3">
                    {persona1.topPriorities.map((priority, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{priority.issue}</h4>
                          <span className="text-sm font-semibold text-indigo-600">{priority.importance}%</span>
                        </div>
                        <p className="text-sm text-gray-600">{priority.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Persona 2 */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPersona2.name}</h2>
                  <div
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: getPoliticalColor(selectedPersona2.politicalAlignment) }}
                  >
                    {selectedPersona2.politicalAlignment.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {otherCounties.find((c) => getPersonaByCounty(c.id)?.id === selectedPersona2.id)?.name}
                </p>
                <div className="space-y-2 text-sm mb-6">
                  <p>
                    <span className="font-semibold">Age:</span> {selectedPersona2.age}
                  </p>
                  <p>
                    <span className="font-semibold">Occupation:</span> {selectedPersona2.occupation}
                  </p>
                  <p>
                    <span className="font-semibold">Household:</span> {selectedPersona2.householdInfo.type}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Top Priorities
                  </h3>
                  <div className="space-y-3">
                    {selectedPersona2.topPriorities.map((priority, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{priority.issue}</h4>
                          <span className="text-sm font-semibold text-indigo-600">{priority.importance}%</span>
                        </div>
                        <p className="text-sm text-gray-600">{priority.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
