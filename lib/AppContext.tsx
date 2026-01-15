'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, State, County, Persona } from '@/types';

interface AppContextType {
  currentView: View;
  selectedState: State | null;
  selectedCounty: County | null;
  selectedPersona: Persona | null;
  setCurrentView: (view: View) => void;
  setSelectedState: (state: State | null) => void;
  setSelectedCounty: (county: County | null) => void;
  setSelectedPersona: (persona: Persona | null) => void;
  goToStateMap: () => void;
  goToCountyMap: (state: State) => void;
  goToPersona: (county: County) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('state-map');
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const goToStateMap = () => {
    setCurrentView('state-map');
    setSelectedState(null);
    setSelectedCounty(null);
    setSelectedPersona(null);
  };

  const goToCountyMap = (state: State) => {
    setCurrentView('county-map');
    setSelectedState(state);
    setSelectedCounty(null);
    setSelectedPersona(null);
  };

  const goToPersona = (county: County) => {
    setCurrentView('persona');
    setSelectedCounty(county);
    setSelectedPersona(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        selectedState,
        selectedCounty,
        selectedPersona,
        setCurrentView,
        setSelectedState,
        setSelectedCounty,
        setSelectedPersona,
        goToStateMap,
        goToCountyMap,
        goToPersona,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
