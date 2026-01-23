'use client';

import React, { useEffect, useState } from 'react';
import {
  PressureMeters,
  PressureCategory,
  PRESSURE_LABELS,
} from '@/types/gameV2';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface PressureMetersV2Props {
  pressure: PressureMeters;
  previousPressure?: PressureMeters;
  /** Categories affected by current event (for animation) */
  affectedCategories?: PressureCategory[];
  /** Show crisis anticipation panel */
  showCrisisAnticipation?: boolean;
}

/** Each unit represents 10 points of pressure */
const PRESSURE_UNIT_SIZE = 10;
const UNITS_PER_ROW = 10; // 10 units = 100 max
const CRISIS_THRESHOLD = 80; // Visual warning at 80
const CRITICAL_THRESHOLD = 90; // Critical warning at 90

/** Group pressures by theme */
const PRESSURE_GROUPS = {
  immediate: ['economic', 'housing', 'health'] as PressureCategory[],
  stability: ['education', 'environment', 'rightsSafety'] as PressureCategory[],
};

export default function PressureMetersV2({
  pressure,
  previousPressure,
  affectedCategories = [],
  showCrisisAnticipation = true,
}: PressureMetersV2Props) {
  const [animatingCategories, setAnimatingCategories] = useState<Set<PressureCategory>>(new Set());
  const [thresholdBreaches, setThresholdBreaches] = useState<Set<PressureCategory>>(new Set());

  // Detect threshold breaches and trigger animations
  useEffect(() => {
    if (!previousPressure) return;

    const breaches = new Set<PressureCategory>();
    (Object.keys(pressure) as PressureCategory[]).forEach((cat) => {
      const prev = previousPressure[cat];
      const curr = pressure[cat];
      
      // Crossed crisis threshold (80)
      if (prev < CRISIS_THRESHOLD && curr >= CRISIS_THRESHOLD) {
        breaches.add(cat);
      }
      // Crossed critical threshold (90)
      if (prev < CRITICAL_THRESHOLD && curr >= CRITICAL_THRESHOLD) {
        breaches.add(cat);
      }
    });

    if (breaches.size > 0) {
      setThresholdBreaches(breaches);
      setTimeout(() => setThresholdBreaches(new Set()), 2000);
    }
  }, [pressure, previousPressure]);

  // Animate affected categories
  useEffect(() => {
    if (affectedCategories.length === 0) return;
    setAnimatingCategories(new Set(affectedCategories));
    setTimeout(() => setAnimatingCategories(new Set()), 1500);
  }, [affectedCategories]);

  // Get closest to crisis (for anticipation panel)
  const getCrisisRisk = () => {
    const risks = (Object.keys(pressure) as PressureCategory[])
      .map((cat) => ({
        category: cat,
        value: pressure[cat],
        distance: 100 - pressure[cat],
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    return risks;
  };

  return (
    <div className="space-y-6">
      {/* Crisis Anticipation Panel */}
      {showCrisisAnticipation && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">At Risk</h3>
          </div>
          <div className="space-y-2">
            {getCrisisRisk()
              .filter((r) => r.value >= 60)
              .map((risk) => (
                <div key={risk.category} className="flex items-center justify-between text-sm">
                  <span className="text-amber-800">{PRESSURE_LABELS[risk.category]}</span>
                  <span className="font-medium text-amber-900">
                    {risk.distance} points from crisis
                  </span>
                </div>
              ))}
            {getCrisisRisk().filter((r) => r.value >= 60).length === 0 && (
              <p className="text-sm text-amber-700">All pressures are manageable.</p>
            )}
          </div>
        </div>
      )}

      {/* Immediate Pressures (Short-term Survival) */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Immediate Pressures</h3>
        <div className="space-y-4">
          {PRESSURE_GROUPS.immediate.map((cat) => (
            <PressureCategoryDisplay
              key={cat}
              category={cat}
              value={pressure[cat]}
              previousValue={previousPressure?.[cat]}
              isAnimating={animatingCategories.has(cat)}
              hasThresholdBreach={thresholdBreaches.has(cat)}
            />
          ))}
        </div>
      </div>

      {/* Stability Pressures (Long-term) */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Stability Pressures</h3>
        <div className="space-y-4">
          {PRESSURE_GROUPS.stability.map((cat) => (
            <PressureCategoryDisplay
              key={cat}
              category={cat}
              value={pressure[cat]}
              previousValue={previousPressure?.[cat]}
              isAnimating={animatingCategories.has(cat)}
              hasThresholdBreach={thresholdBreaches.has(cat)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PressureCategoryDisplay({
  category,
  value,
  previousValue,
  isAnimating,
  hasThresholdBreach,
}: {
  category: PressureCategory;
  value: number;
  previousValue?: number;
  isAnimating: boolean;
  hasThresholdBreach: boolean;
}) {
  const units = Math.ceil(value / PRESSURE_UNIT_SIZE);
  const fullRows = Math.floor(units / UNITS_PER_ROW);
  const remainder = units % UNITS_PER_ROW;
  const totalRows = fullRows + (remainder > 0 ? 1 : 0);

  // Color based on pressure level
  const getUnitColor = (index: number) => {
    const unitValue = (index + 1) * PRESSURE_UNIT_SIZE;
    if (unitValue > value) return 'bg-stone-100'; // Empty
    if (value >= CRITICAL_THRESHOLD) return 'bg-red-600'; // Critical
    if (value >= CRISIS_THRESHOLD) return 'bg-amber-500'; // Warning
    if (value >= 50) return 'bg-yellow-400'; // Moderate
    return 'bg-blue-400'; // Low
  };

  const getBorderColor = () => {
    if (value >= CRITICAL_THRESHOLD) return 'border-red-600 border-2';
    if (value >= CRISIS_THRESHOLD) return 'border-amber-500 border-2';
    return 'border-stone-200';
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 border transition-all duration-300 ${
        isAnimating ? 'ring-2 ring-amber-400 ring-offset-2 animate-pulse' : ''
      } ${hasThresholdBreach ? 'animate-shake border-red-500' : ''} ${getBorderColor()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-700">{PRESSURE_LABELS[category]}</span>
        <span className="text-sm font-bold text-stone-900">{value}/100</span>
      </div>

      {/* Discrete Pressure Units */}
      <div className="space-y-1">
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const startUnit = rowIndex * UNITS_PER_ROW;
          const endUnit = Math.min(startUnit + UNITS_PER_ROW, units);
          const rowUnits = endUnit - startUnit;

          return (
            <div key={rowIndex} className="flex gap-1">
              {Array.from({ length: UNITS_PER_ROW }).map((_, unitIndex) => {
                const globalIndex = startUnit + unitIndex;
                const isFilled = globalIndex < units;
                const isNew = previousValue !== undefined && globalIndex >= Math.ceil(previousValue / PRESSURE_UNIT_SIZE) && isFilled;

                return (
                  <div
                    key={unitIndex}
                    className={`h-3 flex-1 rounded transition-all duration-300 ${
                      isFilled
                        ? `${getUnitColor(globalIndex)} ${isNew && isAnimating ? 'animate-pulse scale-110' : ''}`
                        : 'bg-stone-100'
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Threshold indicators */}
      {value >= CRISIS_THRESHOLD && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${
          value >= CRITICAL_THRESHOLD ? 'animate-pulse-glow' : ''
        }`}>
          {value >= CRITICAL_THRESHOLD ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-red-600 font-semibold">Critical — Crisis Imminent</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600 font-medium">At Risk</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
