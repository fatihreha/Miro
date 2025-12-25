
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeProfile } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User } from '../types';
import { Sparkles, CheckCircle2, Fingerprint, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Analysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [status, setStatus] = useState('Connecting to bind AI Node...');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ persona: string, summary: string } | null>(null);

  useEffect(() => {
    const userData = location.state?.userData;

    if (!userData) {
      navigate('/welcome');
      return;
    }

    const runAnalysis = async () => {
      // Simulate Steps
      setTimeout(() => { setProgress(20); setStatus('Vectorizing sports interests...'); }, 800);
      setTimeout(() => { setProgress(45); setStatus('Scanning local matches...'); }, 1600);
      setTimeout(() => { setProgress(70); setStatus('Generating Sport Persona...'); }, 2400);

      // Actual Gemini Call
      const aiResult = await analyzeProfile(userData);
      setResult(aiResult);

      setProgress(100);
      setStatus('Profile Optimized.');

      // Finalize
      setTimeout(async () => {
        const finalUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          matchPercentage: 0,
          aiPersona: aiResult.persona,
          aiSummary: aiResult.summary,
          isTrainer: false,
          isPremium: false,
          xp: 0,
          userLevel: 1,
          streak: 1,
          rating: 3.0,
          reviewCount: 0,
          lastActiveDate: new Date().toISOString()
        };

        // Save to database
        try {
          await userService.createProfile(finalUser);
        } catch (e) {
          console.error('Failed to save user to DB:', e);
        }

        login(finalUser);

        // Redirect to Welcome Athlete page to show the persona
        const nextPath = userData.wantsPro ? '/become-pro' : '/';
        navigate('/welcome-athlete', {
          state: {
            nextPath,
            persona: aiResult.persona,
            summary: aiResult.summary
          }
        });
      }, 2500);
    };

    runAnalysis();
  }, []);

  return (
    <div className={`h-screen w-full flex items-center justify-center p-8 text-center relative overflow-hidden ${isLight ? 'bg-[#f0f4f8]' : 'bg-black'
      }`}>

      {/* 1. Liquid Atmosphere Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Base Gradient */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isLight
            ? 'bg-gradient-to-br from-slate-100 via-white to-white'
            : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1b4b] via-[#000000] to-[#000000]'
          }`}></div>

        {/* Kinetic Blobs */}
        <div className={`
            absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full mix-blend-screen filter blur-[120px] animate-blob 
            ${isLight ? 'bg-blue-300/40' : 'bg-[#4b29ff]/30'}
        `} style={{ animationDuration: '20s' }}></div>

        <div className={`
            absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob 
            ${isLight ? 'bg-lime-200/40' : 'bg-[#deff90]/20'}
        `} style={{ animationDelay: '-5s', animationDuration: '18s' }}></div>

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center justify-center min-h-[400px]">
        {!result ? (
          /* SCANNING STATE */
          <div className="animate-fade-in flex flex-col items-center">
            <div className="w-48 h-48 mx-auto mb-16 relative flex items-center justify-center">
              {/* Outer Ring Pulse */}
              <div className={`absolute inset-0 rounded-full border-2 opacity-20 animate-ping ${isLight ? 'border-indigo-500' : 'border-brand-indigo'
                }`} style={{ animationDuration: '3s' }}></div>
              <div className={`absolute inset-4 rounded-full border-2 opacity-40 animate-ping ${isLight ? 'border-indigo-500' : 'border-brand-indigo'
                }`} style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>

              {/* Spinning Loader Ring */}
              <div className="absolute inset-0 border-t-2 border-brand-lime rounded-full animate-spin shadow-[0_0_30px_rgba(222,255,144,0.3)]" style={{ animationDuration: '2s' }}></div>

              {/* Inner Core */}
              <div className={`
                absolute inset-6 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-inner
                ${isLight ? 'bg-white/40 border-white/50' : 'bg-black/40 border-white/10'}
              `}>
                <Fingerprint size={64} className={`${isLight ? 'text-indigo-600' : 'text-white'} animate-pulse`} strokeWidth={1} />
              </div>
            </div>

            <h2 className={`text-4xl font-display font-bold mb-4 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'
              }`}>AI Analysis</h2>
            <div className="flex items-center gap-2 mb-8">
              <Activity size={14} className="text-brand-lime animate-bounce" />
              <p className={`font-mono text-xs tracking-wider uppercase ${isLight ? 'text-slate-500' : 'text-white/50'
                }`}>{status}</p>
            </div>

            {/* Progress Bar */}
            <div className={`w-64 rounded-full h-1.5 mb-4 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'
              }`}>
              <div
                className="h-full bg-brand-lime shadow-[0_0_15px_rgba(222,255,144,0.8)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* RESULT STATE - HOLOGRAPHIC CARD */
          <div className="animate-[pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center w-full">

            <div className="w-24 h-24 mx-auto mb-8 bg-brand-lime/10 rounded-full flex items-center justify-center border border-brand-lime/30 shadow-[0_0_40px_rgba(222,255,144,0.2)]">
              <CheckCircle2 className="text-brand-lime w-10 h-10 drop-shadow-lg" strokeWidth={2} />
            </div>

            <h2 className={`text-2xl font-bold mb-2 uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/60'
              }`}>Identity Verified</h2>

            {/* The Persona Card */}
            <div className={`
                w-full p-8 rounded-[32px] border mt-6 shadow-2xl relative overflow-hidden group
                ${isLight ? 'bg-white/80 border-slate-200 shadow-xl' : 'bg-white/5 border-white/10'}
            `}>
              {/* Card Shine Effect */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/5 to-brand-indigo/5 opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity"></div>

              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-brand-indigo to-purple-600 shadow-lg text-white">
                    <Sparkles size={24} />
                  </div>
                </div>

                <div className={`text-[10px] uppercase tracking-[0.3em] mb-2 font-bold ${isLight ? 'text-slate-400' : 'text-white/40'
                  }`}>Sport Persona</div>
                <div className={`text-4xl font-display font-black mb-4 drop-shadow-sm ${isLight ? 'text-slate-900' : 'text-white'
                  }`}>{result.persona}</div>

                <div className={`w-12 h-1 mx-auto mb-5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/20'
                  }`}></div>

                <p className={`text-sm font-medium leading-relaxed italic ${isLight ? 'text-slate-600' : 'text-white/80'
                  }`}>
                  "{result.summary}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-10">
              <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse"></div>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${isLight ? 'text-slate-400' : 'text-white/30'
                }`}>Entering Main Hub...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
