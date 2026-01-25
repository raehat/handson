import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { seedOpportunities } from './lib/seedData';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded) {
      seedOpportunities();
      setSeeded(true);
    }
  }, [seeded]);

  useEffect(() => {
    if (profile) {
      const hasCompletedProfile =
        profile.location &&
        profile.interests &&
        profile.interests.length > 0 &&
        profile.availability &&
        profile.availability.length > 0;

      setNeedsOnboarding(!hasCompletedProfile);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
