import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../components/ui/Glass';
import { Activity, Mail, ChevronLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SportType } from '../types';
import { hapticFeedback } from '../services/hapticService';

// Helper to render sport tags for marquee
const SportTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-display text-white uppercase tracking-widest shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md whitespace-nowrap flex-shrink-0 hover:bg-white/10 transition-colors">
    {label}
  </span>
);

// Custom Brand Icons
const AppleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-24.3-88.2-24.3-46.1 0-112.5 30.1-137.4 78.4-23.7 46.1-2.9 146.5 25.1 187.9 23.4 34.6 51.1 73 87.2 73 34.2 0 45.4-21.3 88.2-21.3 42.1 0 54.4 21.3 88.2 21.3 35.8 0 63.4-38.2 86.8-73.4 28.3-41.7 40.2-82.7 40.5-84.8-.8-.4-79.6-30.6-79.9-103.9zM250.7 74.3c35.6-43.2 32.5-84.1 30-101.4-33.3 2.1-70.5 25.4-86.4 46.4-15.6 20.3-26.4 57.5-23.7 94.6 35.2 0 62-23.3 80.1-39.6z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

// CSS-based BIND Logo Component
const BindLogo: React.FC = () => (
  <div className="w-48 h-48 relative animate-pop flex items-center justify-center">
    {/* Glow Effect */}
    <div className="absolute inset-0 bg-brand-indigo/30 blur-[60px] z-0"></div>

    {/* Logo Container - Bind Style */}
    <div className="relative w-full h-full bg-gradient-to-br from-brand-indigo/90 to-[#6d28d9]/70 backdrop-blur-xl rounded-[32px] flex items-center justify-center shadow-[0_20px_60px_rgba(75,41,255,0.5)] border border-white/20">
      {/* BIND Text */}
      <span className="text-5xl font-display font-black text-white tracking-tight drop-shadow-2xl">
        BIND
      </span>

      {/* Animated Shine Effect */}
      <div className="absolute inset-0 z-20 w-full h-full mix-blend-overlay pointer-events-none rounded-[32px] overflow-hidden">
        <div className="absolute -inset-[50%] bg-[conic-gradient(from_90deg,transparent_0deg,rgba(255,255,255,0.3)_180deg,transparent_360deg)] animate-[spin_5s_linear_infinite] blur-lg opacity-50"></div>
      </div>
    </div>
  </div>
);

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t, theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<'hero' | 'auth_selection'>('hero');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isLight = theme === 'light';

  // Authenticated kullanıcıları home'a yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Prepare sports for marquee
  const allSports = Object.values(SportType);
  const half = Math.ceil(allSports.length / 2);
  const row1 = allSports.slice(0, half);
  const row2 = allSports.slice(half);

  const handleStartSelection = (mode: 'signup' | 'login') => {
    hapticFeedback.medium();
    setAuthMode(mode);
    setView('auth_selection');
  };

  const handleSocialLogin = async (platform: string) => {
    hapticFeedback.success();
    setIsLoggingIn(true);

    try {
      // Import authHelpers dynamically to avoid circular dependency
      const { authHelpers } = await import('../services/supabase');

      const provider = platform.toLowerCase() as 'google' | 'apple';
      const { error } = await authHelpers.signInWithOAuth(provider);

      if (error) {
        console.error('OAuth error:', error);
        setIsLoggingIn(false);
        // User cancelled or error occurred
        return;
      }

      // Supabase will redirect to OAuth provider
      // On return, AuthContext.onAuthStateChange will handle the session
      // Loading state will be maintained until redirect completes
    } catch (error) {
      console.error('OAuth failed:', error);
      setIsLoggingIn(false);
    }
  };

  const handlePhoneEmailLogin = () => {
    hapticFeedback.medium();
    navigate(`/auth?mode=${authMode}`);
  };

  return (
    <div className="h-screen flex flex-col pt-safe-top pb-10 relative overflow-hidden bg-transparent">

      {/* Top Section: Logo & Subtitle */}
      <div className={`flex-1 flex flex-col items-center justify-center z-10 w-full relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${view === 'auth_selection' ? 'scale-[0.85] -translate-y-4' : ''}`}>

        {/* BIND Logo */}
        <BindLogo />

        <p className={`text-lg text-white/70 font-sans font-medium mt-6 leading-relaxed max-w-[280px] drop-shadow-sm text-center transition-all duration-700 ${view === 'auth_selection' ? 'opacity-60 mt-4' : 'animate-fade-in'}`}>
          {t('welcome_subtitle')}
        </p>
      </div>

      {/* Bottom Section: Action Stack */}
      <div className="flex-none w-full z-10 flex flex-col items-center justify-end pb-safe-bottom">

        {view === 'hero' ? (
          <div className="w-full flex flex-col items-center animate-slide-up">
            {/* Scrolling Sports Marquee */}
            <div className="w-full overflow-hidden space-y-3 mb-10 opacity-80 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
              <div className="flex w-max gap-3 animate-marquee-reverse">
                {[...row1, ...row1].map((sport, i) => (
                  <SportTag key={`r1-${i}`} label={sport} />
                ))}
              </div>
              <div className="flex w-max gap-3 animate-marquee">
                {[...row2, ...row2].map((sport, i) => (
                  <SportTag key={`r2-${i}`} label={sport} />
                ))}
              </div>
            </div>

            <div className="w-full max-w-md px-8 space-y-4">
              <GlassButton
                onClick={() => handleStartSelection('signup')}
                className="w-full text-xl py-6 group shadow-[0_0_50px_rgba(75,41,255,0.2)] border-white/30 font-display"
              >
                {t('start_journey')}
                <Activity className="group-hover:translate-x-1 transition-transform ml-2" size={24} />
              </GlassButton>

              <button
                onClick={() => handleStartSelection('login')}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white/70 font-bold text-sm hover:bg-white/10 transition-colors font-sans"
              >
                Already have an account? <span className="text-brand-lime">Log In</span>
              </button>
            </div>
          </div>
        ) : (
          /* AUTH SELECTION VIEW */
          <div className="w-full max-w-md px-8 flex flex-col items-center animate-slide-up">

            <p className="text-[10px] text-white/40 text-center mb-6 leading-relaxed px-4 font-sans">
              By tapping '{authMode === 'login' ? 'Log in' : 'Sign up'}', you agree to our
              <button onClick={() => navigate('/terms')} className="underline text-white/60 mx-1 focus:outline-none">Terms of Service</button>.
              Learn how we process your data in our
              <button onClick={() => navigate('/privacy')} className="underline text-white/60 mx-1 focus:outline-none">Privacy Policy</button>.
            </p>

            <div className="w-full space-y-3 mb-8">
              {/* Apple Button */}
              <button
                onClick={() => handleSocialLogin('Apple')}
                disabled={isLoggingIn}
                className="w-full py-4 rounded-full bg-white text-black font-bold flex items-center justify-center transition-all active:scale-[0.98] shadow-xl hover:bg-gray-100"
              >
                <AppleIcon /> {authMode === 'login' ? 'Log in' : 'Sign up'} with Apple
              </button>

              {/* Google Button */}
              <button
                onClick={() => handleSocialLogin('Google')}
                disabled={isLoggingIn}
                className="w-full py-4 rounded-full bg-white text-black font-bold flex items-center justify-center transition-all active:scale-[0.98] shadow-xl hover:bg-gray-100"
              >
                <GoogleIcon /> {authMode === 'login' ? 'Log in' : 'Sign up'} with Google
              </button>

              {/* Email/Phone Button */}
              <button
                onClick={handlePhoneEmailLogin}
                disabled={isLoggingIn}
                className="w-full py-4 rounded-full bg-brand-lime text-black font-bold flex items-center justify-center transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(222,255,144,0.3)] hover:brightness-110"
              >
                <Mail size={18} className="mr-3" /> {authMode === 'login' ? 'Log in' : 'Sign up'} with Phone / Email
              </button>
            </div>

            {/* Back Button */}
            <button
              onClick={() => setView('hero')}
              className="py-4 text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>
        )}

        <p className="text-center text-white/20 text-[10px] uppercase tracking-widest font-medium pt-4 font-display">
          {t('premium_experience')}
        </p>
      </div>

      {/* GLOBAL LOADING OVERLAY */}
      {isLoggingIn && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-white font-display text-lg tracking-widest animate-pulse">
            {authMode === 'login' ? 'LOGGING IN...' : 'CREATING ACCOUNT...'}
          </span>
        </div>
      )}
    </div>
  );
};
