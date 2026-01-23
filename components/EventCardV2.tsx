'use client';

import React from 'react';
import { EventCard, PressureCategory, PRESSURE_LABELS } from '@/types/gameV2';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface EventCardV2Props {
  event: EventCard;
  /** Persona reaction to this event */
  personaReaction?: string;
  /** Animate the card appearance */
  animate?: boolean;
}

export default function EventCardV2({
  event,
  personaReaction,
  animate = false,
}: EventCardV2Props) {
  const affectedCategories = Object.keys(event.pressureDelta) as PressureCategory[];
  const hasIncreases = Object.values(event.pressureDelta).some((v) => v && v > 0);
  const hasDecreases = Object.values(event.pressureDelta).some((v) => v && v < 0);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 border-2 border-stone-200 transition-all duration-500 ${
        animate ? 'animate-in fade-in slide-in-from-bottom-4' : ''
      }`}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
            event.level === 'federal' ? 'bg-blue-100 text-blue-700' :
            event.level === 'state' ? 'bg-green-100 text-green-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {event.level.toUpperCase()}
          </span>
          <h2 className="text-lg font-bold text-stone-900 mt-1">{event.title}</h2>
        </div>
        {hasIncreases && (
          <div className="flex items-center gap-1 text-red-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        )}
        {hasDecreases && !hasIncreases && (
          <div className="flex items-center gap-1 text-green-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Event Description */}
      <p className="text-stone-700 mb-4">{event.description}</p>

      {/* Persona Reaction */}
      {personaReaction && (
        <div className="bg-stone-50 border-l-4 border-stone-400 rounded-r-lg p-3 mb-4 animate-in fade-in slide-in-from-left-4">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center flex-shrink-0 ring-2 ring-stone-400">
              <span className="text-stone-600 text-xs font-medium">You</span>
            </div>
            <p className="text-sm text-stone-700 italic flex-1">&quot;{personaReaction}&quot;</p>
          </div>
        </div>
      )}

      {/* Narrative */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-indigo-900 italic">&quot;{event.narrative}&quot;</p>
      </div>

      {/* Affected Pressures - Visual Highlight */}
      {affectedCategories.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <p className="text-xs font-semibold text-stone-600 mb-2">Affects:</p>
          <div className="flex flex-wrap gap-2">
            {affectedCategories.map((cat) => {
              const delta = event.pressureDelta[cat] || 0;
              return (
                <div
                  key={cat}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 flex items-center gap-2 animate-pulse"
                >
                  <span className="text-xs font-medium text-amber-900">
                    {PRESSURE_LABELS[cat]}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      delta > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source Hint */}
      {event.sourceHint && (
        <p className="text-xs text-stone-500 mt-3 italic">Based on: {event.sourceHint}</p>
      )}
    </div>
  );
}
