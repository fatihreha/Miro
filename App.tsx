
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LayoutProvider } from './context/LayoutContext';
import { GamificationProvider } from './context/GamificationContext';
import { Splash } from './components/ui/Splash';
import { ErrorBoundary } from './components/ErrorBoundary';
import { XPNotification } from './components/ui/XPNotification';
import { subscriptionService } from './services/subscriptionService';
import { chatService } from './services/chatService';

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
const WelcomeAthlete = lazy(() => import('./pages/WelcomeAthlete').then(m => ({ default: m.WelcomeAthlete })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Clubs = lazy(() => import('./pages/Clubs').then(m => ({ default: m.Clubs })));
const ClubDetail = lazy(() => import('./pages/ClubDetail').then(m => ({ default: m.ClubDetail })));
const Gamification = lazy(() => import('./pages/Gamification').then(m => ({ default: m.Gamification })));
const Premium = lazy(() => import('./pages/Premium').then(m => ({ default: m.Premium })));
const PremiumAd = lazy(() => import('./pages/PremiumAd').then(m => ({ default: m.PremiumAd })));
const Trainers = lazy(() => import('./pages/Trainers').then(m => ({ default: m.Trainers })));
const TrainerDetail = lazy(() => import('./pages/TrainerDetail').then(m => ({ default: m.TrainerDetail })));
const Bookings = lazy(() => import('./pages/Bookings').then(m => ({ default: m.Bookings })));
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const EventDetail = lazy(() => import('./pages/EventDetail').then(m => ({ default: m.EventDetail })));
const PhotoGallery = lazy(() => import('./pages/PhotoGallery').then(m => ({ default: m.PhotoGallery })));
const PhotoManager = lazy(() => import('./pages/PhotoManager').then(m => ({ default: m.PhotoManager })));
const Map = lazy(() => import('./pages/Map').then(m => ({ default: m.Map })));
const BecomePro = lazy(() => import('./pages/BecomePro').then(m => ({ default: m.BecomePro })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings').then(m => ({ default: m.PrivacySettings })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Analysis = lazy(() => import('./pages/Analysis').then(m => ({ default: m.Analysis })));
const PremiumUpgrade = lazy(() => import('./pages/PremiumUpgrade').then(m => ({ default: m.PremiumUpgrade })));
const BlockedUsers = lazy(() => import('./pages/BlockedUsers').then(m => ({ default: m.BlockedUsers })));
const LegalPrivacyPolicy = lazy(() => import('./pages/LegalPrivacyPolicy').then(m => ({ default: m.LegalPrivacyPolicy })));
const LegalConsentForm = lazy(() => import('./pages/LegalConsentForm').then(m => ({ default: m.LegalConsentForm })));

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
          <Route path="/welcome-athlete" element={<ProtectedRoute><WelcomeAthlete /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/analysis" element={<Analysis />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/matches/:userId" element={<ProtectedRoute><MatchProfile /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
          <Route path="/clubs/:clubId" element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/photo-gallery" element={<ProtectedRoute><PhotoGallery /></ProtectedRoute>} />
          <Route path="/photo-manager" element={<ProtectedRoute><PhotoManager userId="" photos={[]} onPhotosChange={async () => {}} onClose={() => {}} /></ProtectedRoute>} />
          <Route path="/trainers" element={<ProtectedRoute><Trainers /></ProtectedRoute>} />
          <Route path="/trainers/:trainerId" element={<ProtectedRoute><TrainerDetail /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
          <Route path="/premium-ad" element={<ProtectedRoute><PremiumAd /></ProtectedRoute>} />
          <Route path="/premium-upgrade" element={<ProtectedRoute><PremiumUpgrade /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/become-pro" element={<ProtectedRoute><BecomePro /></ProtectedRoute>} />

          {/* Support & Legal Routes */}
          <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
          <Route path="/privacy-settings" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
          <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
          <Route path="/blocked-users" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
          <Route path="/legal/privacy-policy" element={<ProtectedRoute><LegalPrivacyPolicy /></ProtectedRoute>} />
          <Route path="/legal/consent-form" element={<ProtectedRoute><LegalConsentForm /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  // Show splash on every page load (not stored)
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // ============================================
  // PRODUCTION SAFETY: App Startup Hooks
  // ============================================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Retry failed payment syncs from previous sessions
        await subscriptionService.checkAndRetryFailedSyncs();
        
        // Retry pending messages that failed to send
        await chatService.retryPendingMessages();
        
        console.log('[App] Startup recovery completed');
      } catch (error) {
        console.error('[App] Startup recovery failed:', error);
        // Don't block app startup even if recovery fails
      }
    };

    initializeApp();
  }, []);

  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <GamificationProvider>
          <ThemeProvider>
            <LayoutProvider>
              <HashRouter>
                <XPNotification />
                <AppRoutes />
              </HashRouter>
            </LayoutProvider>
          </ThemeProvider>
        </GamificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
