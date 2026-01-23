'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import {
  DEFAULT_PRESSURE,
  PRESSURE_LABELS,
  type GameSessionV2,
  type EventCard,
  type GameAction,
  type PressureMeters,
  type PressureCategory,
} from '@/types/gameV2';
import { EVENT_CARDS, drawEventCards } from '@/data/eventCards';
import { getActionsForTurn } from '@/data/gameActions';
import { Map, User, AlertTriangle, ChevronRight, MessageCircle } from 'lucide-react';
import PressureMetersV2 from './PressureMetersV2';
import EventCardV2 from './EventCardV2';

type Phase = 'start' | 'loading' | 'persona' | 'events' | 'actions' | 'feedback' | 'map_reveal' | 'reflection' | 'crisis';

export default function GameSessionV2() {
  const { setCurrentView } = useApp();
  const [phase, setPhase] = useState<Phase>('start');
  const [session, setSession] = useState<GameSessionV2 | null>(null);
  const [eventCards, setEventCards] = useState<EventCard[]>([]);
  const [actions, setActions] = useState<GameAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<GameAction | null>(null);
  const [feedback, setFeedback] = useState('');
  const [pressure, setPressure] = useState<PressureMeters>(DEFAULT_PRESSURE);
  const [previousPressure, setPreviousPressure] = useState<PressureMeters | undefined>(undefined);
  const [turnNumber, setTurnNumber] = useState(0);
  const [localCrisis, setLocalCrisis] = useState<{ title: string; description: string; cascadingEffects: string[] } | null>(null);
  const [insightBadges, setInsightBadges] = useState<string[]>([]);
  const [personaReactions, setPersonaReactions] = useState<Record<string, string>>({});

  // Start game (fetch when user clicks Start)
  useEffect(() => {
    if (phase !== 'loading') return;
    (async () => {
      try {
        const res = await fetch('/api/game/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error('Failed to start game');
        const { session: s, eventCards: evts } = await res.json();
        setSession(s);
        setEventCards(evts);
        setPreviousPressure(DEFAULT_PRESSURE);
        setPressure(s.pressure);
        setTurnNumber(1);
        // Generate persona reactions for events
        const reactions = generatePersonaReactions(s.persona, evts);
        setPersonaReactions(reactions);
        setPhase('persona');
      } catch (e) {
        console.error(e);
        setPhase('persona'); // fallback: show placeholder persona
        setSession(null);
        setEventCards([]);
        setPressure(DEFAULT_PRESSURE);
      }
    })();
  }, [phase]);

  const applyDeltas = (base: PressureMeters, deltas: Partial<Record<PressureCategory, number>>[]) => {
    const next = { ...base };
    for (const d of deltas) {
      for (const [k, v] of Object.entries(d)) {
        if (typeof v !== 'number') continue;
        const key = k as PressureCategory;
        next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + v));
      }
    }
    return next;
  };

  const triggerCrisis = (p: PressureMeters): boolean => {
    const maxed = (Object.entries(p) as [PressureCategory, number][]).find(([, v]) => v >= 100);
    if (maxed) {
      const [cat] = maxed;
      setLocalCrisis({
        title: 'Local Crisis',
        description: `${PRESSURE_LABELS[cat]} pressure has reached a breaking point. The consequences are cascading.`,
        cascadingEffects: ['Services are stretched thin.', 'Your community is struggling.', 'Tradeoffs become even harder.'],
      });
      setPhase('crisis');
      return true;
    }
    return false;
  };

  const onContinueFromPersona = () => setPhase('events');
  const onContinueFromEvents = () => {
    const categories = eventCards.flatMap((e) => Object.keys(e.pressureDelta) as PressureCategory[]);
    const acts = getActionsForTurn([...new Set(categories)], []);
    setActions(acts);
    setPhase('actions');
  };

  // Generate persona reactions to events (simple for now, can be AI-enhanced later)
  const generatePersonaReactions = (persona: any, events: EventCard[]): Record<string, string> => {
    const reactions: Record<string, string> = {};
    events.forEach((evt) => {
      // Simple reaction based on event type and persona priorities
      const topPriority = persona.topPriorities?.[0]?.issue?.toLowerCase() || '';
      if (evt.title.toLowerCase().includes('housing') || topPriority.includes('housing')) {
        reactions[evt.id] = 'This hits close to home. Literally.';
      } else if (evt.title.toLowerCase().includes('health') || topPriority.includes('health')) {
        reactions[evt.id] = 'I need to think about what this means for my family.';
      } else if (evt.title.toLowerCase().includes('economic') || topPriority.includes('economic')) {
        reactions[evt.id] = 'My budget is already tight. This worries me.';
      } else {
        reactions[evt.id] = evt.narrative; // Fallback to event narrative
      }
    });
    return reactions;
  };
  const onSelectAction = (a: GameAction) => {
    setSelectedAction(a);
  };
  const onConfirmAction = () => {
    if (!selectedAction || !session) return;
    const deltas = [selectedAction.pressureDelta].filter((d) => Object.keys(d).length > 0);
    const nextPressure = applyDeltas(pressure, deltas);
    setPreviousPressure(pressure);
    setPressure(nextPressure);
    setFeedback(selectedAction.feedback);
    setPhase('feedback');
    if (triggerCrisis(nextPressure)) return;

    // Persist turn into session (client-side)
    setSession((prev) =>
      prev
        ? {
            ...prev,
            pressure: nextPressure,
            turns: [
              ...prev.turns,
              {
                turnNumber,
                eventCards,
                pressureBefore: pressure,
                pressureAfter: nextPressure,
                actionsTaken: [selectedAction],
                narrativeFeedback: selectedAction.feedback,
              },
            ],
            currentTurn: turnNumber,
          }
        : null
    );
  };
  const onContinueFromFeedback = () => {
    setSelectedAction(null);
    if (turnNumber === 1) {
      setPhase('map_reveal');
      setInsightBadges((b) => [...b, 'Completed first turn']);
    } else {
      nextTurn();
    }
  };

  const nextTurn = () => {
    const usedIds = eventCards.map((e) => e.id);
    const newEvents = drawEventCards(EVENT_CARDS, 2, usedIds);
    if (newEvents.length === 0) {
      setPhase('reflection');
      return;
    }
    const nextP = applyDeltas(pressure, newEvents.map((e) => e.pressureDelta));
    if (triggerCrisis(nextP)) return;
    setEventCards(newEvents);
    setPressure(nextP);
    const categories = newEvents.flatMap((e) => Object.keys(e.pressureDelta) as PressureCategory[]);
    setActions(getActionsForTurn([...new Set(categories)], []));
    setTurnNumber((n) => n + 1);
    setPhase('events');
  };

  const onRevealMapContinue = () => {
    setPhase('events');
    nextTurn();
  };

  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-3">
            Experience a life inside political constraints
          </h1>
          <p className="text-stone-600 mb-8">
            You are not fixing politics. You are learning what it feels like to live inside them.
          </p>
          <button
            onClick={() => setPhase('loading')}
            className="w-full py-4 px-6 bg-stone-800 text-white rounded-xl font-semibold hover:bg-stone-900 transition-colors mb-4"
          >
            Start
          </button>
          <button
            onClick={() => setCurrentView('state-map')}
            className="w-full py-2 px-4 text-stone-600 hover:text-stone-900 text-sm font-medium"
          >
            Explore the map
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-stone-300 border-t-stone-600 mx-auto mb-4" />
          <p className="text-stone-600">Loading your scenario...</p>
        </div>
      </div>
    );
  }

  if (phase === 'crisis' && localCrisis) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="text-xl font-bold">{localCrisis.title}</h1>
          </div>
          <p className="text-stone-700 mb-4">{localCrisis.description}</p>
          <ul className="list-disc list-inside text-stone-600 space-y-1 mb-6">
            {localCrisis.cascadingEffects.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="text-sm text-stone-500 mb-6">
            There are no &quot;correct&quot; choices. You experienced what it feels like to live inside political constraints.
          </p>
          <button
            onClick={() => setPhase('reflection')}
            className="w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900"
          >
            Reflect on this experience
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'reflection') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          <h1 className="text-xl font-bold text-stone-900 mb-2">What surprised you?</h1>
          <p className="text-stone-600 mb-4">
            What surprised you about what mattered most here?
          </p>
          <textarea
            className="w-full h-32 p-4 border border-stone-300 rounded-lg resize-none focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
            placeholder="Share your thoughts..."
          />
          {insightBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {insightBadges.map((b, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => setCurrentView('play')}
            className="mt-6 w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'map_reveal' && session) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-600 mb-2">
              <Map className="w-5 h-5" />
              <span className="font-medium">Context</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              {session.persona.name} lives in {session.county.name}, {session.county.stateName}
            </h2>
            <p className="text-stone-600 text-sm mt-1">
              Population {session.county.population.toLocaleString()} · Median income ${session.county.medianIncome.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-stone-200 mb-6">
            <div className="h-80 bg-stone-100 flex items-center justify-center text-stone-500">
              Map placeholder — county: {session.county.name}, {session.county.stateName}
            </div>
          </div>
          <button
            onClick={onRevealMapContinue}
            className="w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'persona' && session) {
    const p = session.persona;
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          <div className="flex items-center gap-3 text-stone-700 mb-6">
            <User className="w-8 h-8" />
            <h1 className="text-xl font-bold text-stone-900">You are {p.name}</h1>
          </div>
          <p className="text-stone-600 mb-4">
            {p.age} · {p.occupation} · {p.householdInfo.type}, household of {p.householdInfo.size}
          </p>
          <p className="text-stone-600 mb-4">
            <strong>{session.county.name}, {session.county.stateName}</strong>
          </p>
          <p className="text-stone-500 text-sm mb-4">{p.background}</p>
          <div className="mb-6">
            <p className="text-sm font-medium text-stone-700 mb-2">Top priorities</p>
            <ul className="space-y-1 text-stone-600 text-sm">
              {p.topPriorities.slice(0, 3).map((pr, i) => (
                <li key={i}>{pr.issue} — {pr.description}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onContinueFromPersona}
            className="w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'events' && session) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-stone-900 mb-2">What just happened</h1>
          <p className="text-stone-600 text-sm mb-6">
            These events are affecting {session.persona.name}&apos;s life right now.
          </p>
          <div className="space-y-4 mb-8">
            {eventCards.map((evt, idx) => (
              <EventCardV2
                key={evt.id}
                event={evt}
                personaReaction={personaReactions[evt.id]}
                animate={idx === 0} // Animate first card
              />
            ))}
          </div>
          <PressureMetersV2
            pressure={pressure}
            previousPressure={previousPressure}
            affectedCategories={eventCards.flatMap((e) => Object.keys(e.pressureDelta) as PressureCategory[])}
            showCrisisAnticipation={true}
          />
          <button
            onClick={onContinueFromEvents}
            className="mt-8 w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 flex items-center justify-center gap-2"
          >
            Choose how to respond
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'actions' && session) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-stone-900 mb-2">What do you do?</h1>
          <p className="text-stone-600 text-sm mb-6">
            You have 2–3 options. Tradeoffs are required; you can&apos;t address everything.
          </p>
          <PressureMetersV2
            pressure={pressure}
            previousPressure={previousPressure}
            showCrisisAnticipation={true}
          />
          <div className="space-y-3 mt-8">
            {actions.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectAction(a)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAction?.id === a.id
                    ? 'border-stone-800 bg-stone-100'
                    : 'border-stone-200 bg-white hover:border-stone-400'
                }`}
              >
                <span className="font-medium text-stone-900">{a.label}</span>
                <p className="text-sm text-stone-600 mt-1">{a.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={onConfirmAction}
            disabled={!selectedAction}
            className="mt-8 w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'feedback' && session) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-stone-600 mb-4">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">What happens next</span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-stone-200 mb-6">
            <p className="text-stone-700 italic">&quot;{feedback}&quot;</p>
          </div>
          <PressureMetersV2
            pressure={pressure}
            previousPressure={previousPressure}
            showCrisisAnticipation={true}
          />
          <button
            onClick={onContinueFromFeedback}
            className="mt-8 w-full py-3 px-4 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
