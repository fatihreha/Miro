
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LayoutProvider } from './context/LayoutContext';
import { Home } from './pages/Home';
import { Matches } from './pages/Matches';
import { MatchProfile } from './pages/MatchProfile';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
// Analysis page removed as requested
import { Clubs } from './pages/Clubs';
import { ClubDetail } from './pages/ClubDetail';
import { Gamification } from './pages/Gamification';
import { Premium } from './pages/Premium';
import { Trainers } from './pages/Trainers';
import { TrainerDetail } from './pages/TrainerDetail';
import { Bookings } from './pages/Bookings';
import { Events } from './pages/Events';
import { Map } from './pages/Map';
import { BecomePro } from './pages/BecomePro';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white" style={{ backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" style={{ width: '32px', height: '32px', border: '4px solid #00f2ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Layout>
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
    </Layout>
  );
};

const App: React.FC = () => {
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
