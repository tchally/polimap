'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { getPersonaByCounty, getPoliticalColor } from '@/data/mockData';
import { Persona } from '@/types';
import { ArrowLeft, Play, TrendingUp, Users, Home, Heart } from 'lucide-react';

export default function PersonaScreen() {
  const { selectedCounty, selectedState, goToCountyMap, setCurrentView, setSelectedPersona } = useApp();
  const [activePriority, setActivePriority] = useState<number | null>(null);

  if (!selectedCounty) {
    if (selectedState) {
      goToCountyMap(selectedState);
    } else {
      setCurrentView('state-map');
    }
    return null;
  }

  const persona = getPersonaByCounty(selectedCounty.id);

  if (!persona) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No persona data available for {selectedCounty.name} yet.</p>
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

  const handlePlayAsPersona = () => {
    setSelectedPersona(persona);
    setCurrentView('exploration');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
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
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Persona Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Meet {persona.name}</h1>
                <p className="text-lg text-gray-600">{selectedCounty.name}, {selectedCounty.stateName}</p>
              </div>
              <div
                className="px-4 py-2 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: getPoliticalColor(persona.politicalAlignment) }}
              >
                {persona.politicalAlignment.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="text-lg font-semibold text-gray-900">{persona.age} years old</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Occupation</p>
                  <p className="text-lg font-semibold text-gray-900">{persona.occupation}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Home className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Household</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {persona.householdInfo.type} • {formatCurrency(persona.householdInfo.income)}/year
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Background</h3>
              <p className="text-gray-700 leading-relaxed">{persona.background}</p>
            </div>
          </div>

          {/* County Demographics */}
          {selectedCounty.demographics && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">County Demographics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Race & Ethnicity */}
                {selectedCounty.demographics.race && Object.keys(selectedCounty.demographics.race).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Race & Ethnicity</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedCounty.demographics.race)
                        .filter(([_, value]) => value > 0)
                        .sort(([_, a], [__, b]) => b - a)
                        .map(([race, percentage]) => (
                          <div key={race}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{race}</span>
                              <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {selectedCounty.demographics.education && Object.keys(selectedCounty.demographics.education).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Education (Population 25+)</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedCounty.demographics.education)
                        .filter(([_, value]) => value > 0)
                        .sort(([_, a], [__, b]) => b - a)
                        .map(([level, percentage]) => (
                          <div key={level}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{level}</span>
                              <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600 transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Age Distribution */}
              {selectedCounty.demographics.age && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(selectedCounty.demographics.age.distribution || {}).map(([ageGroup, percentage]) => (
                      <div key={ageGroup} className="text-center">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">{percentage}%</div>
                        <div className="text-sm text-gray-600">{ageGroup}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Priorities */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Top 3 Priorities</h2>
            </div>
            <div className="space-y-4">
              {persona.topPriorities.map((priority, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    activePriority === idx
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setActivePriority(activePriority === idx ? null : idx)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{priority.issue}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all"
                          style={{ width: `${priority.importance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{priority.importance}%</span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{priority.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why This Matters Cards */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why This Matters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Local Policies</h3>
                <p className="text-sm text-gray-600">
                  {persona.topPriorities[0]?.issue} affects daily life in {selectedCounty.name} through local zoning,
                  taxes, and services.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Federal Impact</h3>
                <p className="text-sm text-gray-600">
                  National policies on {persona.topPriorities[1]?.issue} directly impact {persona.name}'s community and
                  livelihood.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">Community Context</h3>
                <p className="text-sm text-gray-600">
                  Understanding these priorities helps explain why people in {selectedCounty.name} vote the way they do.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Explore?</h2>
              <p className="text-gray-600 mb-6">
                Experience how policies and decisions affect {persona.name}'s daily life and priorities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handlePlayAsPersona}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  <Play className="w-6 h-6" />
                  Play as {persona.name}
                </button>
                <button
                  onClick={() => setCurrentView('compare')}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  <Users className="w-6 h-6" />
                  Compare Perspectives
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
