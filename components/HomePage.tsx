'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { Scale, Users, Map, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { setCurrentView } = useApp();

  const handleStartGame = () => {
    // Navigate to play view, which will show role selection
    setCurrentView('play');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-blue-50 to-stone-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-stone-900">
                PoliMap
              </h1>
            </div>
            
            <p className="text-2xl md:text-3xl text-stone-700 mb-6 font-light">
              Experience the weight of political decisions
            </p>
            
            <p className="text-lg md:text-xl text-stone-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Step into the role of a real political actor. Make decisions under pressure, 
              with limited information, and uneven consequences. There are no perfect choices— 
              only tradeoffs that help some and hurt others.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleStartGame}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-xl text-lg font-semibold hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Your Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-stone-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Real Constituents"
            description="Meet named, persistent characters with full backgrounds, concerns, and values. See how your decisions affect real people."
          />
          <FeatureCard
            icon={<Scale className="w-8 h-8" />}
            title="Real Policies"
            description="Make decisions on policies inspired by actual legislation being debated in U.S. politics today. Learn about real-world impacts."
          />
          <FeatureCard
            icon={<Map className="w-8 h-8" />}
            title="Geographic Context"
            description="Understand how decisions affect different regions, counties, and communities across your jurisdiction."
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Choose Your Role"
              description="State Legislator, Senator, or Governor"
            />
            <StepCard
              number="2"
              title="Meet Your Constituents"
              description="Learn about the people you represent"
            />
            <StepCard
              number="3"
              title="Make Decisions"
              description="Policies arrive with time pressure and competing arguments"
            />
            <StepCard
              number="4"
              title="See the Impact"
              description="Understand who benefited, who was harmed, and why"
            />
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-6 text-blue-400" />
          <h2 className="text-3xl font-bold mb-6">The Goal is Understanding, Not Winning</h2>
          <p className="text-lg text-stone-300 leading-relaxed">
            This game makes you feel why political decisions are hard and why reasonable people disagree. 
            Through time pressure, uneven impact, and lived experience, you&apos;ll gain empathy for the 
            constraints that real political leaders face every day.
          </p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-stone-50 border-t border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Ready to experience political decision-making?
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            Each session takes 10-15 minutes. No scores, no winners—just understanding.
          </p>
          <button
            onClick={handleStartGame}
            className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-xl text-lg font-semibold hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Session
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-8 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-stone-900 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-stone-900 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-600">{description}</p>
    </div>
  );
}
