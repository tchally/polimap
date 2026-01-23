'use client';

import React from 'react';
import { Constituent } from '@/types/gameV3';
import { User, MapPin, Heart, AlertCircle } from 'lucide-react';

export default function ConstituentDetailView({ constituent }: { constituent: Constituent }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-stone-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center">
            <User className="w-8 h-8 text-stone-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{constituent.name}</h1>
            <p className="text-stone-600">{constituent.age} years old · {constituent.occupation}</p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-stone-500" />
              <span className="text-sm text-stone-600">
                {constituent.location.county}, {constituent.location.state}
                {!constituent.location.inJurisdiction && (
                  <span className="ml-2 text-xs text-amber-600">(Out of jurisdiction)</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-stone-50 rounded-lg">
          <p className="text-stone-700">{constituent.familyContext}</p>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Core Concern</h3>
          </div>
          <p className="text-blue-800">{constituent.coreConcern}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Won't Compromise On</h3>
          </div>
          <p className="text-red-800">{constituent.nonNegotiableValue}</p>
        </div>
      </div>

      {/* Full Background */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900 mb-3">Personal History</h2>
          <p className="text-stone-700 leading-relaxed">{constituent.background.personalHistory}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-stone-900 mb-3">Economic Situation</h2>
          <p className="text-stone-700 leading-relaxed">{constituent.background.economicSituation}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-stone-900 mb-3">Community Involvement</h2>
          <p className="text-stone-700 leading-relaxed">{constituent.background.communityInvolvement}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-stone-900 mb-3">Political Views</h2>
          <p className="text-stone-700 leading-relaxed italic">{constituent.background.politicalViews}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Current Challenges</h3>
            <ul className="space-y-1">
              {constituent.background.challenges.map((challenge, i) => (
                <li key={i} className="text-stone-700 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-2">Hopes & Aspirations</h3>
            <ul className="space-y-1">
              {constituent.background.hopes.map((hope, i) => (
                <li key={i} className="text-stone-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{hope}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Current Reaction */}
      {constituent.currentReaction && (
        <div className="mt-6 p-4 bg-stone-50 border-l-4 border-stone-400 rounded-r-lg">
          <p className="text-sm font-semibold text-stone-700 mb-1">Recent Reaction:</p>
          <p className="text-stone-800 italic">&quot;{constituent.currentReaction.message}&quot;</p>
        </div>
      )}
    </div>
  );
}
