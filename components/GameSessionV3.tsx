'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/AppContext';
import {
  type PlayerRole,
  type Jurisdiction,
  type Constituent,
  type PolicyCard,
  type GameSessionV3,
  type PolicyDecision,
  type PressureMeters,
  DEFAULT_PRESSURE,
  type PressureCategory,
} from '@/types/gameV3';
import { Map, Clock, Users, AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react';
import PressureMetersV2 from './PressureMetersV2';
import GameMap from './GameMap';
import ConstituentDetailView from './ConstituentDetailView';
import ReviewScreen from './ReviewScreen';

type Phase = 'role-selection' | 'loading' | 'playing' | 'policy-detail' | 'session-summary';

export default function GameSessionV3() {
  const { setCurrentView } = useApp();
  const [phase, setPhase] = useState<Phase>('role-selection');
  const [session, setSession] = useState<GameSessionV3 | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyCard | null>(null);
  const [selectedConstituent, setSelectedConstituent] = useState<Constituent | null>(null);
  const [mapHighlight, setMapHighlight] = useState<string[]>([]); // Regions to highlight

  // Initialize game based on role
  const startGame = useCallback(async (role: PlayerRole) => {
    setPhase('loading');
    try {
      const res = await fetch('/api/game/v3/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to start game: ${errorText}`);
      }
      const data = await res.json();
      console.log('Game session data:', data);
      console.log('Current policy:', data.session?.currentPolicy);
      
      if (!data.session) {
        throw new Error('No session data returned from API');
      }
      
      if (!data.session.currentPolicy && data.session.policyQueue.length === 0) {
        console.warn('No policies available in session');
      }
      
      setSession(data.session);
      setTimeRemaining(data.session.currentPolicy?.timeRemaining || null);
      setPhase('playing');
    } catch (e) {
      console.error(e);
      setPhase('role-selection');
    }
  }, []);

  // Time pressure countdown
  useEffect(() => {
    if (phase !== 'playing' || !timeRemaining || !session?.currentPolicy) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-decision or escalate urgency
          handleTimeExpired();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeRemaining, session?.currentPolicy]);

  const handleTimeExpired = () => {
    if (!session?.currentPolicy) return;
    // Escalate urgency or auto-abstain
    setSession((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      if (updated.currentPolicy) {
        updated.currentPolicy.urgency = updated.currentPolicy.urgency === 'critical' ? 'critical' : 
          updated.currentPolicy.urgency === 'high' ? 'critical' : 
          updated.currentPolicy.urgency === 'medium' ? 'high' : 'medium';
      }
      return updated;
    });
  };

  const handlePolicyDecision = (choice: 'support' | 'oppose' | 'abstain') => {
    if (!session?.currentPolicy) return;
    
    const decision: PolicyDecision = {
      policyId: session.currentPolicy.id,
      policy: session.currentPolicy, // Store full policy for review
      choice,
      timestamp: Date.now(),
      timeTaken: session.currentPolicy.timeRemaining ? 
        (session.currentPolicy.timeRemaining - (timeRemaining || 0)) : 0,
    };

    // Apply immediate effects
    const nextPressure = applyPressureDeltas(
      session.pressure,
      session.currentPolicy.immediateEffects.pressureChanges
    );

    // Update constituents
    const updatedConstituents = updateConstituentReactions(
      session.constituents,
      session.currentPolicy,
      choice
    );

    // Move to next policy (current was in policyQueue[0], next is policyQueue[1])
    // Actually, currentPolicy is separate, so we take from queue
    const remainingPolicies = session.policyQueue;
    const nextPolicy = remainingPolicies.length > 0 ? remainingPolicies[0] : null;

    // Check for delayed effects to reveal
    const nowRevealed = session.pendingReveals.filter((r) => r.turnToReveal <= session.currentTurn + 1);
    const stillPending = session.pendingReveals.filter((r) => r.turnToReveal > session.currentTurn + 1);

    // Add new delayed effects if this policy has them
    const newPending = session.currentPolicy?.delayedEffects
      ? [
          ...stillPending,
          {
            policyId: session.currentPolicy.id,
            turnToReveal: session.currentTurn + 1 + (session.currentPolicy.delayedEffects.turnsUntilReveal || 0),
            effect: session.currentPolicy.delayedEffects.description,
          },
        ]
      : stillPending;

    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        pressure: nextPressure,
        constituents: updatedConstituents,
        decisions: [...prev.decisions, decision],
        policyQueue: nextPolicy ? remainingPolicies.slice(1) : [],
        currentPolicy: nextPolicy,
        currentTurn: prev.currentTurn + 1,
        pendingReveals: newPending,
      };
    });

    setTimeRemaining(nextPolicy?.timeRemaining || null);
    
    // Show delayed effect reveals if any
    if (nowRevealed.length > 0) {
      // Could show a modal or notification here
      console.log('Delayed effects revealed:', nowRevealed);
    }

    // If no more policies, end session (but only after at least 10 decisions or all policies exhausted)
    if (!nextPolicy && remainingPolicies.length === 0) {
      // Only end if we've made at least 10 decisions OR all policies are exhausted
      if (session.decisions.length >= 10 || session.policyQueue.length === 0) {
        setTimeout(() => setPhase('session-summary'), 2000);
      }
    }
    
    // Animate map response
    animateMapResponse(session.currentPolicy, choice);
  };

  const applyPressureDeltas = (
    base: PressureMeters,
    deltas: Partial<Record<PressureCategory, number>>
  ): PressureMeters => {
    const next = { ...base };
    for (const [k, v] of Object.entries(deltas)) {
      if (typeof v !== 'number') continue;
      const key = k as PressureCategory;
      next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + v));
    }
    return next;
  };

  const updateConstituentReactions = (
    constituents: Constituent[],
    policy: PolicyCard,
    decision: 'support' | 'oppose' | 'abstain'
  ): Constituent[] => {
    return constituents.map((c) => {
      const isAffected = policy.immediateEffects.affectedConstituents.includes(c.id);
      if (!isAffected) return c;

      // Simple reaction logic (can be enhanced with AI)
      const sentiment = decision === 'support' ? 
        (policy.arguments.find(a => a.group.toLowerCase().includes(c.coreConcern.toLowerCase()))?.position === 'for' ? 'positive' : 'negative') :
        (policy.arguments.find(a => a.group.toLowerCase().includes(c.coreConcern.toLowerCase()))?.position === 'against' ? 'positive' : 'negative');

      return {
        ...c,
        currentReaction: {
          sentiment: sentiment as any,
          message: generateConstituentReaction(c, policy, decision),
          affectedBy: [...(c.currentReaction?.affectedBy || []), policy.id],
        },
      };
    });
  };

  const generateConstituentReaction = (
    constituent: Constituent,
    policy: PolicyCard,
    decision: 'support' | 'oppose' | 'abstain'
  ): string => {
    // Match constituent's core concern with policy arguments
    const relevantArg = policy.arguments.find((a) => 
      a.group.toLowerCase().includes(constituent.coreConcern.toLowerCase()) ||
      constituent.coreConcern.toLowerCase().includes(a.group.toLowerCase())
    );
    
    if (decision === 'support') {
      if (relevantArg?.position === 'for') {
        return `Thank you for supporting this. ${constituent.coreConcern} is everything to my family.`;
      } else {
        return `I can't believe you supported this. It hurts people like me who care about ${constituent.coreConcern}.`;
      }
    } else if (decision === 'oppose') {
      if (relevantArg?.position === 'against') {
        return `Thank you for standing against this. You protected ${constituent.coreConcern}.`;
      } else {
        return `You opposed this? ${constituent.coreConcern} is at stake. I'm disappointed.`;
      }
    } else {
      return `You abstained? We need leaders who take a stand on ${constituent.coreConcern}.`;
    }
  };

  const animateMapResponse = (policy: PolicyCard, decision: 'support' | 'oppose' | 'abstain') => {
    // Highlight affected regions
    const regions = [
      ...policy.directImpact.regions,
      ...policy.indirectImpact.regions,
    ];
    setMapHighlight(regions);
    setTimeout(() => setMapHighlight([]), 3000);
  };

  const openPolicyDetail = (policy: PolicyCard) => {
    setSelectedPolicy(policy);
    setPhase('policy-detail');
  };

  const closePolicyDetail = () => {
    setSelectedPolicy(null);
    setPhase('playing');
  };

  const openConstituentDetail = (constituent: Constituent) => {
    setSelectedConstituent(constituent);
    setPhase('constituent-detail');
  };

  const closeConstituentDetail = () => {
    setSelectedConstituent(null);
    setPhase('playing');
  };

  if (phase === 'role-selection') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Choose Your Role</h1>
          <p className="text-stone-600 mb-6">
            You are a real political actor tied to a specific place. Make decisions under pressure, with limited information, and uneven consequences.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['state-legislator', 'senator', 'governor'] as PlayerRole[]).map((role) => (
              <button
                key={role}
                onClick={() => startGame(role)}
                className="p-6 bg-stone-100 hover:bg-stone-200 rounded-lg border-2 border-stone-300 hover:border-stone-500 transition-all text-left"
              >
                <h3 className="font-bold text-stone-900 mb-2 capitalize">
                  {role.replace('-', ' ')}
                </h3>
                <p className="text-sm text-stone-600">
                  {role === 'state-legislator' && 'Make state-level policy decisions'}
                  {role === 'senator' && 'Represent your state in federal decisions'}
                  {role === 'governor' && 'Lead state policy with executive authority'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4" />
          <p className="text-stone-600">Loading your jurisdiction...</p>
        </div>
      </div>
    );
  }

  if (phase === 'policy-detail' && selectedPolicy) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={closePolicyDetail}
            className="mb-4 text-stone-600 hover:text-stone-900"
          >
            ← Back to game
          </button>
          <PolicyDetailView policy={selectedPolicy} onDecision={handlePolicyDecision} />
        </div>
      </div>
    );
  }

  if (phase === 'session-summary' && session) {
    return <SessionSummaryView session={session} onRestart={() => setPhase('role-selection')} onReview={() => setPhase('review')} />;
  }

  if (phase === 'review' && session) {
    return <ReviewScreen session={session} onBack={() => setPhase('session-summary')} />;
  }

  if (phase === 'playing' && session) {
    // Debug logging
    console.log('Rendering playing phase:', {
      hasSession: !!session,
      hasCurrentPolicy: !!session.currentPolicy,
      currentTurn: session.currentTurn,
      policyQueueLength: session.policyQueue.length,
      constituentsCount: session.constituents.length,
    });

    return (
      <div className="h-screen flex flex-col bg-stone-50">
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900 capitalize">
              {session.playerRole.replace('-', ' ')} — {session.jurisdiction.name}
            </h1>
            <p className="text-sm text-stone-600">Turn {session.currentTurn}</p>
          </div>
          {timeRemaining !== null && session.currentPolicy && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-600">{timeRemaining}s</span>
            </div>
          )}
        </div>

        {/* Split Screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Interactive Map */}
          <div className="w-1/2 border-r border-stone-200 bg-white overflow-hidden">
            <GameMap
              jurisdiction={session.jurisdiction}
              currentPolicy={session.currentPolicy}
              highlightRegions={mapHighlight}
            />
          </div>

          {/* Right: Constituents & Current Policy */}
          <div className="w-1/2 bg-stone-50 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Current Policy Card */}
              {session.currentPolicy ? (
                <PolicyCardView
                  policy={session.currentPolicy}
                  onViewDetail={() => openPolicyDetail(session.currentPolicy!)}
                  onDecision={handlePolicyDecision}
                  timeRemaining={timeRemaining}
                />
              ) : (
                <div className="bg-white rounded-xl p-6 border border-stone-200 text-center">
                  <p className="text-stone-600 mb-4">
                    {session.policyQueue.length > 0 
                      ? 'Loading next policy...' 
                      : 'No pending policies. Session complete.'}
                  </p>
                  {session.pendingReveals.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Delayed Effects Revealed:</p>
                      {session.pendingReveals.map((r, i) => (
                        <p key={i} className="text-sm text-amber-800">{r.effect}</p>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setPhase('session-summary')}
                    className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900"
                  >
                    View Summary
                  </button>
                </div>
              )}

              {/* Pressure Meters */}
              <PressureMetersV2
                pressure={session.pressure}
                showCrisisAnticipation={true}
              />

              {/* Constituents */}
              <div>
                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Constituents
                </h2>
                <div className="space-y-3">
                  {session.constituents.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openConstituentDetail(c)}
                      className="w-full text-left"
                    >
                      <ConstituentCard constituent={c} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy Queue */}
              {session.policyQueue.length > 1 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-700 mb-2">
                    Pending Policies ({session.policyQueue.length - 1})
                  </h3>
                  <div className="space-y-2">
                    {session.policyQueue.slice(1, 4).map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-lg p-3 border border-stone-200 text-sm"
                      >
                        <span className="font-medium">{p.title}</span>
                        <span className="text-stone-500 ml-2">({p.level})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


// Policy Card View
function PolicyCardView({
  policy,
  onViewDetail,
  onDecision,
  timeRemaining,
}: {
  policy: PolicyCard;
  onViewDetail: () => void;
  onDecision: (choice: 'support' | 'oppose' | 'abstain') => void;
  timeRemaining: number | null;
}) {
  const urgencyColors = {
    low: 'border-blue-300 bg-blue-50',
    medium: 'border-yellow-300 bg-yellow-50',
    high: 'border-orange-300 bg-orange-50',
    critical: 'border-red-500 bg-red-50 animate-pulse',
  };

  return (
    <div className={`bg-white rounded-xl p-6 border-2 ${urgencyColors[policy.urgency]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
            policy.level === 'federal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          }`}>
            {policy.level.toUpperCase()}
          </span>
          <h2 className="text-xl font-bold text-stone-900">{policy.title}</h2>
        </div>
        {timeRemaining !== null && (
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="font-bold">{timeRemaining}s</span>
          </div>
        )}
      </div>

      {/* Framed Arguments */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-stone-700 mb-2">Arguments:</p>
        <div className="space-y-2">
          {policy.arguments.slice(0, 3).map((arg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                arg.position === 'for' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <span className="font-semibold text-stone-900">{arg.group}:</span> <span className="text-stone-800">{arg.statement}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="mb-4 text-sm">
        <p className="font-semibold text-stone-700 mb-1">Directly affects:</p>
        <p className="text-stone-600">{policy.directImpact.description}</p>
        <p className="font-semibold text-stone-700 mt-2 mb-1">Indirectly affects:</p>
        <p className="text-stone-600">{policy.indirectImpact.description}</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onDecision('support')}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Support
        </button>
        <button
          onClick={() => onDecision('oppose')}
          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Oppose
        </button>
        <button
          onClick={() => onDecision('abstain')}
          className="flex-1 py-2 px-4 bg-stone-400 text-white rounded-lg font-medium hover:bg-stone-500 transition-colors flex items-center justify-center gap-2"
        >
          <Minus className="w-4 h-4" />
          Abstain
        </button>
      </div>
      <button
        onClick={onViewDetail}
        className="mt-3 w-full py-2 text-sm text-stone-600 hover:text-stone-900"
      >
        View full details →
      </button>
    </div>
  );
}

// Policy Detail View
function PolicyDetailView({
  policy,
  onDecision,
}: {
  policy: PolicyCard;
  onDecision: (choice: 'support' | 'oppose' | 'abstain') => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-stone-200">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">{policy.title}</h1>
      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mb-4 ${
        policy.level === 'federal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
      }`}>
        {policy.level.toUpperCase()}
      </span>

      {/* All Arguments */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-stone-900 mb-3">How Different Groups See This</h2>
        <div className="space-y-3">
          {policy.arguments.map((arg, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                arg.position === 'for' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {arg.position === 'for' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-stone-900">{arg.group}</span>
                <span className="text-sm text-stone-500">({arg.position})</span>
              </div>
              <p className="text-stone-900">{arg.statement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Details */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="font-bold text-stone-900 mb-2">Direct Impact</h3>
          <p className="text-stone-700">{policy.directImpact.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {policy.directImpact.groups.map((g, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {g}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-stone-900 mb-2">Indirect Impact</h3>
          <p className="text-stone-700">{policy.indirectImpact.description}</p>
        </div>
      </div>

      {/* Uncertain Effects */}
      {policy.uncertainEffects && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-bold text-amber-900 mb-2">⚠️ Uncertain Outcomes</h3>
          <p className="text-amber-800 text-sm">{policy.uncertainEffects.description}</p>
          <p className="text-xs text-amber-700 mt-2">
            Probability: {Math.round(policy.uncertainEffects.probability * 100)}%
          </p>
        </div>
      )}

      {/* Decision Buttons */}
      <div className="flex gap-4 pt-6 border-t border-stone-200">
        <button
          onClick={() => onDecision('support')}
          className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Support
        </button>
        <button
          onClick={() => onDecision('oppose')}
          className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          Oppose
        </button>
        <button
          onClick={() => onDecision('abstain')}
          className="flex-1 py-3 px-6 bg-stone-400 text-white rounded-lg font-semibold hover:bg-stone-500 transition-colors flex items-center justify-center gap-2"
        >
          <Minus className="w-5 h-5" />
          Abstain
        </button>
      </div>
    </div>
  );
}

// Constituent Card
function ConstituentCard({ constituent }: { constituent: Constituent }) {
  const sentimentColors = {
    positive: 'bg-green-50 border-green-200',
    neutral: 'bg-stone-50 border-stone-200',
    negative: 'bg-red-50 border-red-200',
    angry: 'bg-red-100 border-red-300',
  };

  return (
    <div className={`bg-white rounded-lg p-4 border ${
      constituent.currentReaction ? sentimentColors[constituent.currentReaction.sentiment] : 'border-stone-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-stone-900">{constituent.name}</h3>
          <p className="text-xs text-stone-600">
            {constituent.age} · {constituent.occupation} · {constituent.location.county}, {constituent.location.state}
          </p>
        </div>
        {!constituent.location.inJurisdiction && (
          <span className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded">Out of jurisdiction</span>
        )}
      </div>
      <p className="text-sm text-stone-600 mb-2">{constituent.familyContext}</p>
      <div className="text-xs space-y-1">
        <p><strong>Core concern:</strong> {constituent.coreConcern}</p>
        <p><strong>Won't compromise on:</strong> {constituent.nonNegotiableValue}</p>
      </div>
      {constituent.currentReaction && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <p className="text-sm italic text-stone-700">&quot;{constituent.currentReaction.message}&quot;</p>
        </div>
      )}
    </div>
  );
}

// Session Summary
function SessionSummaryView({
  session,
  onRestart,
  onReview,
}: {
  session: GameSessionV3;
  onRestart: () => void;
  onReview: () => void;
}) {
  const benefited = session.constituents.filter(
    (c) => c.currentReaction?.sentiment === 'positive'
  );
  const harmed = session.constituents.filter(
    (c) => c.currentReaction?.sentiment === 'negative' || c.currentReaction?.sentiment === 'angry'
  );
  const neutral = session.constituents.filter(
    (c) => !c.currentReaction || c.currentReaction.sentiment === 'neutral'
  );

  // Calculate pressure changes
  const initialPressure = DEFAULT_PRESSURE;
  const finalPressure = session.pressure;
  const improved = (Object.keys(finalPressure) as Array<keyof typeof finalPressure>).filter(
    (k) => finalPressure[k] < initialPressure[k]
  );
  const worsened = (Object.keys(finalPressure) as Array<keyof typeof finalPressure>).filter(
    (k) => finalPressure[k] > initialPressure[k]
  );

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Session Summary</h1>
        <p className="text-stone-600 mb-6">
          No scores, no winners. Here&apos;s what happened.
        </p>
        
        {/* Constituent Impact */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="font-bold text-green-900 mb-2 text-sm">Benefited</h2>
            <p className="text-3xl font-bold text-green-700 mb-2">{benefited.length}</p>
            <p className="text-xs text-green-800">constituents</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="font-bold text-red-900 mb-2 text-sm">Harmed</h2>
            <p className="text-3xl font-bold text-red-700 mb-2">{harmed.length}</p>
            <p className="text-xs text-red-800">constituents</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
            <h2 className="font-bold text-stone-900 mb-2 text-sm">Neutral</h2>
            <p className="text-3xl font-bold text-stone-700 mb-2">{neutral.length}</p>
            <p className="text-xs text-stone-800">constituents</p>
          </div>
        </div>

        {/* Who Benefited */}
        {benefited.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-stone-200 mb-6">
            <h2 className="font-bold text-stone-900 mb-4">Who Benefited</h2>
            <div className="space-y-2">
              {benefited.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-sm text-stone-600">{c.occupation} · {c.location.county}</p>
                  </div>
                  {c.currentReaction && (
                    <p className="text-sm text-green-700 italic">&quot;{c.currentReaction.message}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who Was Harmed */}
        {harmed.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-stone-200 mb-6">
            <h2 className="font-bold text-stone-900 mb-4">Who Was Harmed</h2>
            <div className="space-y-2">
              {harmed.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-sm text-stone-600">{c.occupation} · {c.location.county}</p>
                  </div>
                  {c.currentReaction && (
                    <p className="text-sm text-red-700 italic">&quot;{c.currentReaction.message}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pressure Changes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-stone-200 mb-6">
          <h2 className="font-bold text-stone-900 mb-4">Pressure Changes</h2>
          {improved.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-700 mb-2">Improved:</p>
              <div className="flex flex-wrap gap-2">
                {improved.map((k) => (
                  <span key={k} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {worsened.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-red-700 mb-2">Worsened:</p>
              <div className="flex flex-wrap gap-2">
                {worsened.map((k) => (
                  <span key={k} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-stone-200 mb-6">
          <h2 className="font-bold text-stone-900 mb-4">Insights</h2>
          <p className="text-stone-700 italic mb-4">
            Here&apos;s why leaders in {session.jurisdiction.name} often prioritize certain issues over others.
          </p>
          <p className="text-stone-600">
            Every decision helps some and hurts others. There are no perfect choices. 
            You experienced what it feels like to make decisions under pressure, with limited information, 
            and uneven consequences.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-6 bg-stone-800 text-white rounded-lg font-semibold hover:bg-stone-900"
          >
            Play Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 py-3 px-6 bg-stone-200 text-stone-800 rounded-lg font-semibold hover:bg-stone-300"
          >
            Return to Map
          </button>
        </div>
      </div>
    </div>
  );
}
