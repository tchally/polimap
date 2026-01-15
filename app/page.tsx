'use client';

import { AppProvider, useApp } from '@/lib/AppContext';
import StateMap from '@/components/StateMap';
import CountyMap from '@/components/CountyMap';
import PersonaScreen from '@/components/PersonaScreen';
import PersonaExploration from '@/components/PersonaExploration';
import ComparePerspectives from '@/components/ComparePerspectives';

function AppContent() {
  const { currentView } = useApp();

  switch (currentView) {
    case 'state-map':
      return <StateMap />;
    case 'county-map':
      return <CountyMap />;
    case 'persona':
      return <PersonaScreen />;
    case 'exploration':
      return <PersonaExploration />;
    case 'compare':
      return <ComparePerspectives />;
    default:
      return <StateMap />;
  }
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
