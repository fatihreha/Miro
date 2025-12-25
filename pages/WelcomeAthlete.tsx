import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlassButton } from '../components/ui/Glass';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const WelcomeAthlete: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { nextPath?: string; persona?: string; summary?: string } | undefined;
  const nextPath = state?.nextPath;
  const persona = state?.persona || "The Future Star";
  const summary = state?.summary || "Ready to make your mark in the arena.";

  const handleContinue = () => {
    navigate(nextPath || '/premium-ad', { replace: true });
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black text-white">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1b4b] via-[#000000] to-[#000000] z-0"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-brand-indigo/30 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-brand-lime/10 blur-[100px] animate-blob"></div>

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full animate-slide-up">

        {/* Verification Icon using Persona Style */}
        <div className="w-24 h-24 mb-6 relative group">
          <div className="absolute inset-0 bg-brand-lime blur-[50px] opacity-40 animate-pulse"></div>
          <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(222,255,144,0.2)]">
            <CheckCircle2 size={48} className="text-brand-lime drop-shadow-[0_0_15px_rgba(222,255,144,0.8)]" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-brand-lime/80 font-mono text-xs uppercase tracking-[0.2em] font-bold">Identity Verified</p>
            <h1 className="text-5xl font-display font-black text-white leading-none tracking-tight drop-shadow-2xl uppercase">
              {persona}
            </h1>
          </div>

          <div className="relative py-6 px-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-white/20 rounded-full"></div>
            <p className="text-white/70 text-lg font-light italic leading-relaxed max-w-xs mx-auto">
              "{summary}"
            </p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white/10 rounded-full"></div>
          </div>
        </div>

        <div className="mt-12 w-full">
          <GlassButton
            onClick={handleContinue}
            className="w-full h-16 text-xl font-bold shadow-[0_0_40px_rgba(75,41,255,0.3)] border-white/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter the Arena <ArrowRight className="ml-2" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default WelcomeAthlete;
