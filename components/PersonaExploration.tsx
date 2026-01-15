'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Persona } from '@/types';
import { ArrowLeft, Lightbulb, TrendingDown, TrendingUp, Sliders } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  description: string;
  policy: string;
  impact: 'positive' | 'negative' | 'mixed';
  affectedAreas: string[];
  outcomes: {
    scenario: string;
    result: string;
  }[];
}

const mockScenarios: Scenario[] = [
  {
    id: '1',
    title: 'Housing Affordability Policy',
    description: 'A new state law limits rent increases to 5% annually.',
    policy: 'State Rent Control Act',
    impact: 'positive',
    affectedAreas: ['Housing Costs', 'Savings Ability', 'Stability'],
    outcomes: [
      {
        scenario: 'If passed',
        result: 'Rent stabilized, more money for savings and other priorities. Can plan for long-term housing goals.'
      },
      {
        scenario: 'If rejected',
        result: 'Rent continues rising faster than income. May need to relocate or take on additional work.'
      }
    ]
  },
  {
    id: '2',
    title: 'Healthcare Expansion',
    description: 'Federal program expands mental health coverage and reduces copays.',
    policy: 'Mental Health Access Act',
    impact: 'positive',
    affectedAreas: ['Healthcare Costs', 'Well-being', 'Financial Security'],
    outcomes: [
      {
        scenario: 'If passed',
        result: 'Better access to mental health services without financial strain. Improved overall well-being.'
      },
      {
        scenario: 'If rejected',
        result: 'Continues paying high out-of-pocket costs or goes without needed care.'
      }
    ]
  },
  {
    id: '3',
    title: 'Climate Action Plan',
    description: 'Local initiative increases renewable energy requirements, affecting energy costs.',
    policy: 'County Renewable Energy Mandate',
    impact: 'mixed',
    affectedAreas: ['Energy Costs', 'Environmental Impact', 'Job Market'],
    outcomes: [
      {
        scenario: 'If passed',
        result: 'Slightly higher energy costs short-term, but improved air quality and long-term environmental benefits.'
      },
      {
        scenario: 'If rejected',
        result: 'Lower immediate costs but continued environmental concerns and potential long-term health impacts.'
      }
    ]
  }
];

export default function PersonaExploration() {
  const { selectedPersona, selectedCounty, selectedState, goToCountyMap, setCurrentView } = useApp();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [priorityWeights, setPriorityWeights] = useState<Record<string, number>>({});

  if (!selectedPersona || !selectedCounty) {
    if (selectedState) {
      goToCountyMap(selectedState);
    } else {
      setCurrentView('state-map');
    }
    return null;
  }

  const persona = selectedPersona;

  // Initialize priority weights
  React.useEffect(() => {
    const weights: Record<string, number> = {};
    persona.topPriorities.forEach((p) => {
      weights[p.issue] = p.importance;
    });
    setPriorityWeights(weights);
  }, [persona]);

  const handleWeightChange = (issue: string, value: number) => {
    setPriorityWeights((prev) => ({ ...prev, [issue]: value }));
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Sliders className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => setCurrentView('persona')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Persona</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Exploring as {persona.name}</h1>
        </div>
      </div>

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Priority Sliders */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Explore Priority Weights</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Adjust how important each issue is to see how different priorities affect policy perspectives.
            </p>
            <div className="space-y-6">
              {persona.topPriorities.map((priority) => (
                <div key={priority.issue} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{priority.issue}</h3>
                    <span className="text-lg font-bold text-indigo-600">
                      {priorityWeights[priority.issue] || priority.importance}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={priorityWeights[priority.issue] || priority.importance}
                    onChange={(e) => handleWeightChange(priority.issue, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-sm text-gray-600 mt-2">{priority.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Cards */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Policy Scenarios</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Explore how different policies and decisions affect {persona.name}'s life and priorities.
            </p>
            <div className="space-y-6">
              {mockScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedScenario === scenario.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedScenario(selectedScenario === scenario.id ? null : scenario.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getImpactIcon(scenario.impact)}
                        <h3 className="text-xl font-semibold text-gray-900">{scenario.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-2">{scenario.description}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Policy:</span> {scenario.policy}
                      </p>
                    </div>
                  </div>

                  {selectedScenario === scenario.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Affected Areas:</p>
                        <div className="flex flex-wrap gap-2">
                          {scenario.affectedAreas.map((area, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {scenario.outcomes.map((outcome, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-semibold text-gray-900 mb-1">{outcome.scenario}</p>
                            <p className="text-sm text-gray-700">{outcome.result}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reflection Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reflection</h2>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <p className="text-gray-800 font-semibold mb-2">What surprised you about {persona.name}'s priorities?</p>
              <textarea
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Share your thoughts..."
              ></textarea>
              <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Save Reflection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
