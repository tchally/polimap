'use client';

import React, { useState } from 'react';
import { GameSessionV3, PolicyCard, PolicyDecision, Constituent } from '@/types/gameV3';
import { CheckCircle, XCircle, Minus, ExternalLink, FileText, Clock, Users, TrendingUp, TrendingDown, ArrowRight, Heart, AlertCircle } from 'lucide-react';

export default function ReviewScreen({
  session,
  onBack,
}: {
  session: GameSessionV3;
  onBack: () => void;
}) {
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  // Get all decided policies with their full details
  const decidedPolicies = session.decisions.map((decision) => ({
    decision,
    policy: decision.policy,
  }));

  // Calculate constituent impact summary
  const constituentImpact = session.constituents.map((c) => {
    const affectedDecisions = session.decisions.filter((d) =>
      d.policy.immediateEffects.affectedConstituents.includes(c.id)
    );
    const positiveReactions = affectedDecisions.filter((d) => {
      const relevantArg = d.policy.arguments.find((a) =>
        a.group.toLowerCase().includes(c.coreConcern.toLowerCase()) ||
        c.coreConcern.toLowerCase().includes(a.group.toLowerCase())
      );
      if (d.decision.choice === 'support') {
        return relevantArg?.position === 'for';
      } else if (d.decision.choice === 'oppose') {
        return relevantArg?.position === 'against';
      }
      return false;
    });
    const negativeReactions = affectedDecisions.filter((d) => {
      const relevantArg = d.policy.arguments.find((a) =>
        a.group.toLowerCase().includes(c.coreConcern.toLowerCase()) ||
        c.coreConcern.toLowerCase().includes(a.group.toLowerCase())
      );
      if (d.decision.choice === 'support') {
        return relevantArg?.position === 'against';
      } else if (d.decision.choice === 'oppose') {
        return relevantArg?.position === 'for';
      }
      return false;
    });

    return {
      constituent: c,
      affectedBy: affectedDecisions.length,
      positive: positiveReactions.length,
      negative: negativeReactions.length,
    };
  });

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Decision Review</h1>
            <p className="text-stone-600 mt-1">
              Complete review of your session as {session.playerRole.replace('-', ' ')} in {session.jurisdiction.name}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 flex items-center gap-2"
          >
            ← Back to Summary
          </button>
        </div>

        {/* Session Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-stone-200 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-stone-600">Decisions Made</p>
              <p className="text-3xl font-bold text-stone-900">{session.decisions.length}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Turn</p>
              <p className="text-3xl font-bold text-stone-900">{session.currentTurn}</p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Session Duration</p>
              <p className="text-3xl font-bold text-stone-900">
                {Math.round((Date.now() - session.startTime) / 1000 / 60)} min
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-600">Constituents</p>
              <p className="text-3xl font-bold text-stone-900">{session.constituents.length}</p>
            </div>
          </div>
        </div>

        {/* Decisions List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Your Policy Decisions
          </h2>
          
          <div className="space-y-4">
            {decidedPolicies.map(({ decision, policy }, index) => (
              <PolicyDecisionCard
                key={decision.policyId}
                decision={decision}
                policy={policy}
                index={index + 1}
                constituents={session.constituents}
                onExpand={() => setExpandedPolicy(expandedPolicy === decision.policyId ? null : decision.policyId)}
                isExpanded={expandedPolicy === decision.policyId}
              />
            ))}

            {decidedPolicies.length === 0 && (
              <div className="bg-white rounded-xl p-8 border border-stone-200 text-center">
                <p className="text-stone-600">No decisions were made in this session.</p>
              </div>
            )}
          </div>
        </div>

        {/* Constituent Impact Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Impact on Your Constituents
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {constituentImpact.map((impact) => (
              <ConstituentImpactCard
                key={impact.constituent.id}
                impact={impact}
                decisions={session.decisions}
              />
            ))}
          </div>
        </div>

        {/* Note about real policies */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About These Policies</h3>
              <p className="text-blue-800 text-sm">
                The policies in this game are inspired by real legislation and policy debates currently 
                happening in U.S. politics. Click on any policy above to see links to real-world sources, 
                including Congress.gov for federal bills and news articles covering these issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyDecisionCard({
  decision,
  policy,
  index,
  constituents,
  onExpand,
  isExpanded,
}: {
  decision: PolicyDecision;
  policy: PolicyCard;
  index: number;
  constituents: Constituent[];
  onExpand: () => void;
  isExpanded: boolean;
}) {
  const choiceIcons = {
    support: CheckCircle,
    oppose: XCircle,
    abstain: Minus,
  };

  const choiceColors = {
    support: 'text-green-600 bg-green-50 border-green-200',
    oppose: 'text-red-600 bg-red-50 border-red-200',
    abstain: 'text-stone-600 bg-stone-50 border-stone-200',
  };

  const Icon = choiceIcons[decision.choice];
  const affectedConstituents = constituents.filter((c) =>
    policy.immediateEffects.affectedConstituents.includes(c.id)
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
      <button
        onClick={onExpand}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${choiceColors[decision.choice]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-stone-500">Decision #{index}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${choiceColors[decision.choice]}`}>
                {decision.choice}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                policy.level === 'federal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {policy.level.toUpperCase()}
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-lg">{policy.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-stone-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {decision.timeTaken}s
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {affectedConstituents.length} constituent{affectedConstituents.length !== 1 ? 's' : ''} affected
              </span>
            </div>
          </div>
        </div>
        <div className="text-stone-400 ml-4">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-stone-200 bg-stone-50">
          <div className="pt-6 space-y-6">
            {/* Policy Arguments */}
            <div>
              <h4 className="font-semibold text-stone-900 mb-3">Arguments Presented</h4>
              <div className="space-y-2">
                {policy.arguments.map((arg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      arg.position === 'for' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {arg.position === 'for' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-semibold text-stone-900 text-sm">{arg.group}</span>
                      <span className="text-xs text-stone-500">({arg.position})</span>
                    </div>
                    <p className="text-stone-800 text-sm">{arg.statement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Direct Impact</h4>
                <p className="text-sm text-stone-700 mb-2">{policy.directImpact.description}</p>
                <div className="flex flex-wrap gap-2">
                  {policy.directImpact.groups.map((g, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 mb-2">Indirect Impact</h4>
                <p className="text-sm text-stone-700">{policy.indirectImpact.description}</p>
              </div>
            </div>

            {/* Affected Constituents */}
            {affectedConstituents.length > 0 && (
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Affected Constituents</h4>
                <div className="space-y-2">
                  {affectedConstituents.map((c) => {
                    const reaction = c.currentReaction;
                    const sentiment = reaction?.sentiment || 'neutral';
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg border ${
                          sentiment === 'positive' ? 'bg-green-50 border-green-200' :
                          sentiment === 'negative' || sentiment === 'angry' ? 'bg-red-50 border-red-200' :
                          'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-stone-900">{c.name}</p>
                            <p className="text-xs text-stone-600">{c.occupation} · {c.location.county}</p>
                            <p className="text-xs text-stone-700 mt-1">
                              <strong>Core concern:</strong> {c.coreConcern}
                            </p>
                          </div>
                        </div>
                        {reaction && (
                          <div className="mt-2 pt-2 border-t border-stone-200">
                            <p className="text-sm italic text-stone-700">&quot;{reaction.message}&quot;</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pressure Changes */}
            {Object.keys(policy.immediateEffects.pressureChanges).length > 0 && (
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Pressure Changes</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(policy.immediateEffects.pressureChanges).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-2 rounded-lg flex items-center justify-between ${
                        (value as number) < 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <span className="text-sm font-medium text-stone-700 capitalize">{key}</span>
                      <span className={`text-sm font-bold flex items-center gap-1 ${
                        (value as number) < 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {(value as number) < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        {Math.abs(value as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Policy Links */}
            {policy.realWorldPolicy && (
              <div className="pt-4 border-t border-stone-300">
                <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Learn More About This Real Policy
                </h4>
                <p className="text-sm text-stone-700 mb-3">{policy.realWorldPolicy.description}</p>
                {policy.realWorldPolicy.billNumber && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-stone-700">Bill Number:</p>
                    <p className="text-sm text-stone-900 font-mono">{policy.realWorldPolicy.billNumber}</p>
                  </div>
                )}
                {policy.realWorldPolicy.status && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-stone-700">Status:</p>
                    <p className="text-sm text-stone-900">{policy.realWorldPolicy.status}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {policy.realWorldPolicy.congressGovUrl && (
                    <a
                      href={policy.realWorldPolicy.congressGovUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Congress.gov
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                  {policy.realWorldPolicy.newsArticles?.map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {article.title} ({article.source})
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Details */}
            <div className="pt-4 border-t border-stone-300">
              <h4 className="font-semibold text-stone-900 mb-3">Your Decision</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-600">Time Taken:</p>
                  <p className="font-medium text-stone-900">{decision.timeTaken}s</p>
                </div>
                <div>
                  <p className="text-stone-600">Timestamp:</p>
                  <p className="font-medium text-stone-900">
                    {new Date(decision.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConstituentImpactCard({
  impact,
  decisions,
}: {
  impact: {
    constituent: Constituent;
    affectedBy: number;
    positive: number;
    negative: number;
  };
  decisions: PolicyDecision[];
}) {
  const { constituent, affectedBy, positive, negative } = impact;
  const netImpact = positive - negative;

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-stone-900">{constituent.name}</h3>
          <p className="text-xs text-stone-600">{constituent.occupation} · {constituent.location.county}</p>
        </div>
        {netImpact > 0 ? (
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">+{netImpact}</span>
          </div>
        ) : netImpact < 0 ? (
          <div className="flex items-center gap-1 text-red-600">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-semibold">{netImpact}</span>
          </div>
        ) : (
          <div className="text-stone-400 text-sm">Neutral</div>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-stone-600">Affected by:</span>
          <span className="font-medium text-stone-900">{affectedBy} decision{affectedBy !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-600">Positive impacts:</span>
          <span className="font-medium text-green-700">{positive}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-600">Negative impacts:</span>
          <span className="font-medium text-red-700">{negative}</span>
        </div>
      </div>

      {constituent.currentReaction && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <p className="text-sm italic text-stone-700">&quot;{constituent.currentReaction.message}&quot;</p>
        </div>
      )}
    </div>
  );
}
