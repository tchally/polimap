'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { Persona, County } from '@/types';
import { PersonaGameState, PolicyScenario, PolicyDecision } from '@/types/game';
import { ArrowLeft, Check, X, TrendingUp, TrendingDown, DollarSign, Heart, AlertCircle, Calendar } from 'lucide-react';

interface PersonaGameProps {
  persona: Persona;
  county: County;
}

export default function PersonaGame({ persona, county }: PersonaGameProps) {
  const { setCurrentView } = useApp();
  const [gameState, setGameState] = useState<PersonaGameState | null>(null);
  const [scenarios, setScenarios] = useState<PolicyScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<PolicyScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [makingDecision, setMakingDecision] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [impactNarrative, setImpactNarrative] = useState<string>('');

  // Initialize game state
  useEffect(() => {
    async function initializeGame() {
      try {
        // Initialize game state
        const gameResponse = await fetch('/api/persona/initialize-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona }),
        });

        if (gameResponse.ok) {
          const initialState = await gameResponse.json();
          setGameState(initialState);
        }

        // Load scenarios
        const scenariosResponse = await fetch('/api/persona/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: persona.id, countyId: county.id }),
        });

        if (scenariosResponse.ok) {
          const loadedScenarios = await scenariosResponse.json();
          setScenarios(loadedScenarios);
          
          // Show first scenario
          if (loadedScenarios.length > 0) {
            setCurrentScenario(loadedScenarios[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing game:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeGame();
  }, [persona.id, county.id]);

  const handleDecision = async (choice: 'accepted' | 'rejected') => {
    if (!currentScenario || !gameState || makingDecision) return;

    setMakingDecision(true);

    try {
      // Calculate new game state
      const impact = choice === 'accepted' 
        ? currentScenario.impacts.ifAccepted 
        : currentScenario.impacts.ifRejected;

      // Apply impacts
      const newIncome = gameState.currentIncome + (impact.financial.incomeChange || 0);
      
      const newPriorities = gameState.currentPriorities.map(priority => {
        const change = impact.priorityChanges[priority.issue] || 0;
        return {
          ...priority,
          importance: Math.max(0, Math.min(100, priority.importance + change)),
        };
      });

      const financialChange = impact.financial.incomeChange || 0;
      const financialSecurityChange = financialChange > 0 ? 5 : financialChange < 0 ? -5 : 0;
      const qualityOfLifeChange = impact.financial.costOfLivingChange 
        ? (impact.financial.costOfLivingChange < 0 ? 3 : -3)
        : 0;

      // Create the new decision record
      const newDecisionRecord: PolicyDecision = {
        scenarioId: currentScenario.id,
        choice,
        timestamp: Date.now(),
        personaStateBefore: { ...gameState },
        personaStateAfter: {} as PersonaGameState, // Will be set below
      };

      // Create updated game state
      const updatedState: PersonaGameState = {
        ...gameState,
        currentIncome: newIncome,
        currentPriorities: newPriorities,
        decisions: [...gameState.decisions, newDecisionRecord],
        timelinePosition: gameState.timelinePosition + 1,
        metrics: {
          financialSecurity: Math.max(0, Math.min(100, gameState.metrics.financialSecurity + financialSecurityChange)),
          qualityOfLife: Math.max(0, Math.min(100, gameState.metrics.qualityOfLife + qualityOfLifeChange)),
          communityEngagement: gameState.metrics.communityEngagement,
        },
      };

      // Update the decision's after state
      newDecisionRecord.personaStateAfter = updatedState;

      // Update game state immediately
      setGameState(updatedState);

      // Show impact narrative
      const narrative = choice === 'accepted' 
        ? currentScenario.impactNarratives?.ifAccepted || currentScenario.impacts.ifAccepted.longTerm.description
        : currentScenario.impactNarratives?.ifRejected || currentScenario.impacts.ifRejected.longTerm.description;
      
      setImpactNarrative(narrative);
      setShowImpact(true);

      // Move to next scenario after showing impact
      // Store the next scenario index to avoid closure issues
      const currentIndex = scenarios.findIndex(s => s.id === currentScenario.id);
      const nextScenarioIndex = currentIndex + 1;
      const hasNextScenario = nextScenarioIndex < scenarios.length;
      const nextScenario = hasNextScenario ? scenarios[nextScenarioIndex] : null;

      // Show impact for 4 seconds, then move to next
      setTimeout(() => {
        setShowImpact(false);
        setImpactNarrative('');
        if (hasNextScenario && nextScenario) {
          setCurrentScenario(nextScenario);
        }
        setMakingDecision(false);
      }, 4000);
    } catch (error) {
      console.error('Error making decision:', error);
      setMakingDecision(false);
    }
  };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journey as {persona.name}...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatChange = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${formatCurrency(amount)}`;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Playing as {persona.name}</h1>
              <p className="text-sm text-gray-600">{county.name}, {county.stateName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Current Income</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(gameState.currentIncome)}/year</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-32 px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Financial Security</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-500"
                  style={{ width: `${gameState.metrics.financialSecurity}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{gameState.metrics.financialSecurity}/100</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Quality of Life</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${gameState.metrics.qualityOfLife}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{gameState.metrics.qualityOfLife}/100</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Timeline</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{gameState.timelinePosition}</p>
              <p className="text-xs text-gray-500">Decisions Made</p>
            </div>
          </div>

          {/* Impact Narrative Overlay */}
          {showImpact && impactNarrative && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                    <Heart className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Impact on {persona.name}'s Life</h2>
                  <p className="text-sm text-gray-500">Months after your decision...</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 mb-6">
                  <p className="text-lg text-gray-800 leading-relaxed italic">
                    "{impactNarrative}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Financial Security</p>
                    <p className="text-2xl font-bold text-gray-900">{gameState.metrics.financialSecurity}/100</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-green-600 transition-all duration-500"
                        style={{ width: `${gameState.metrics.financialSecurity}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Quality of Life</p>
                    <p className="text-2xl font-bold text-gray-900">{gameState.metrics.qualityOfLife}/100</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-red-600 transition-all duration-500"
                        style={{ width: `${gameState.metrics.qualityOfLife}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <p className="text-sm text-gray-500">Continuing to next decision...</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Scenario */}
          {currentScenario && !showImpact ? (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {currentScenario.urgency === 'high' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      currentScenario.policyType === 'federal' ? 'bg-blue-100 text-blue-700' :
                      currentScenario.policyType === 'state' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {currentScenario.policyType.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      currentScenario.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      currentScenario.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {currentScenario.urgency.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentScenario.title}</h2>
                  <p className="text-lg text-gray-700 mb-4">{currentScenario.description}</p>
                </div>
              </div>

              {/* Policy Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentScenario.policy.name}</h3>
                <p className="text-gray-700 mb-3">{currentScenario.policy.summary}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span><strong>Status:</strong> {currentScenario.policy.status}</span>
                  <span><strong>Proposed by:</strong> {currentScenario.policy.proposer}</span>
                </div>
              </div>

              {/* Regional Context */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-900">
                  <strong>Why this matters in {county.name}:</strong> {currentScenario.regionalContext}
                </p>
              </div>

              {/* Decision Options */}
              <div className="grid grid-cols-2 gap-6">
                {/* Accept Option */}
                <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-900">Accept Policy</h3>
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {currentScenario.impacts.ifAccepted.financial.incomeChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Income: <strong className={currentScenario.impacts.ifAccepted.financial.incomeChange > 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatChange(currentScenario.impacts.ifAccepted.financial.incomeChange)}/year
                          </strong>
                        </span>
                      </div>
                    )}
                    {currentScenario.impacts.ifAccepted.financial.taxChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Taxes: <strong className={currentScenario.impacts.ifAccepted.financial.taxChange < 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatChange(currentScenario.impacts.ifAccepted.financial.taxChange)}/year
                          </strong>
                        </span>
                      </div>
                    )}
                    {currentScenario.impacts.ifAccepted.financial.costOfLivingChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Cost of Living: <strong className={currentScenario.impacts.ifAccepted.financial.costOfLivingChange < 0 ? 'text-green-700' : 'text-red-700'}>
                            {currentScenario.impacts.ifAccepted.financial.costOfLivingChange > 0 ? '+' : ''}
                            {currentScenario.impacts.ifAccepted.financial.costOfLivingChange}%
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {currentScenario.impacts.ifAccepted.qualityOfLife.description}
                  </p>

                  <button
                    onClick={() => handleDecision('accepted')}
                    disabled={makingDecision}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {makingDecision ? 'Processing...' : 'Accept Policy'}
                  </button>
                </div>

                {/* Reject Option */}
                <div className="border-2 border-red-500 rounded-lg p-6 bg-red-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-red-900">Reject Policy</h3>
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {currentScenario.impacts.ifRejected.financial.incomeChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Income: <strong className={currentScenario.impacts.ifRejected.financial.incomeChange > 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatChange(currentScenario.impacts.ifRejected.financial.incomeChange)}/year
                          </strong>
                        </span>
                      </div>
                    )}
                    {currentScenario.impacts.ifRejected.financial.taxChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Taxes: <strong className={currentScenario.impacts.ifRejected.financial.taxChange < 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatChange(currentScenario.impacts.ifRejected.financial.taxChange)}/year
                          </strong>
                        </span>
                      </div>
                    )}
                    {currentScenario.impacts.ifRejected.financial.costOfLivingChange !== 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          Cost of Living: <strong className={currentScenario.impacts.ifRejected.financial.costOfLivingChange < 0 ? 'text-green-700' : 'text-red-700'}>
                            {currentScenario.impacts.ifRejected.financial.costOfLivingChange > 0 ? '+' : ''}
                            {currentScenario.impacts.ifRejected.financial.costOfLivingChange}%
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {currentScenario.impacts.ifRejected.qualityOfLife.description}
                  </p>

                  <button
                    onClick={() => handleDecision('rejected')}
                    disabled={makingDecision}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {makingDecision ? 'Processing...' : 'Reject Policy'}
                  </button>
                </div>
              </div>

              {/* Affected Areas */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Affected Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {currentScenario.affectedAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : showImpact ? null : (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600">No more scenarios available. You've completed the journey!</p>
            </div>
          )}

          {/* Decision History */}
          {gameState.decisions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Decisions</h2>
              <div className="space-y-3">
                {gameState.decisions.map((decision, idx) => {
                  const scenario = scenarios.find(s => s.id === decision.scenarioId);
                  if (!scenario) return null;
                  
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          decision.choice === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {decision.choice.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.policy.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
