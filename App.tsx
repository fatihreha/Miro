
import React, { Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LayoutProvider } from './context/LayoutContext';
import { Splash } from './components/ui/Splash';

// Loading Spinner Component
const PageLoader: React.FC = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 relative">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
      </div>
      <p className="text-white/50 text-sm font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// Lazy loaded pages for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Matches = lazy(() => import('./pages/Matches').then(m => ({ default: m.Matches })));
const MatchProfile = lazy(() => import('./pages/MatchProfile').then(m => ({ default: m.MatchProfile })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Clubs = lazy(() => import('./pages/Clubs').then(m => ({ default: m.Clubs })));
const ClubDetail = lazy(() => import('./pages/ClubDetail').then(m => ({ default: m.ClubDetail })));
const Gamification = lazy(() => import('./pages/Gamification').then(m => ({ default: m.Gamification })));
const Premium = lazy(() => import('./pages/Premium').then(m => ({ default: m.Premium })));
const Trainers = lazy(() => import('./pages/Trainers').then(m => ({ default: m.Trainers })));
const TrainerDetail = lazy(() => import('./pages/TrainerDetail').then(m => ({ default: m.TrainerDetail })));
const Bookings = lazy(() => import('./pages/Bookings').then(m => ({ default: m.Bookings })));
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Map = lazy(() => import('./pages/Map').then(m => ({ default: m.Map })));
const BecomePro = lazy(() => import('./pages/BecomePro').then(m => ({ default: m.BecomePro })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/:userId" element={<ProtectedRoute><MatchProfile /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
          <Route path="/clubs/:clubId" element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/trainers" element={<ProtectedRoute><Trainers /></ProtectedRoute>} />
          <Route path="/trainers/:trainerId" element={<ProtectedRoute><TrainerDetail /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/become-pro" element={<ProtectedRoute><BecomePro /></ProtectedRoute>} />

          {/* Support & Legal Routes */}
          <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  // Show splash only once ever (not per session)
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashFinish = () => {
    localStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </LayoutProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
