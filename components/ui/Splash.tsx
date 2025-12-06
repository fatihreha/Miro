import React, { useEffect, useState } from 'react';
import { Zap, Heart, Activity } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setShowText(true), 600);
    const exitTimer = setTimeout(() => setIsExiting(true), 2400);
    const finishTimer = setTimeout(() => onFinish(), 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
      
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#1a1b4b] via-[#000000] to-[#000000] opacity-80"></div>

        <div className={`
            absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob 
            bg-[#4b29ff]/40
        `} style={{ animationDuration: '20s' }}></div>
        
        <div className={`
            absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob 
            bg-[#deff90]/30
        `} style={{ animationDelay: '-5s', animationDuration: '18s' }}></div>

        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        <div className="relative mb-10 group animate-[pop_0.8s_cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="absolute inset-0 bg-brand-indigo/30 blur-[60px] rounded-full animate-pulse-slow"></div>
          <div className="relative w-36 h-36 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-3 border border-white/20 ring-1 ring-white/10">
            <Zap size={72} className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" fill="currentColor" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-black/40 backdrop-blur-2xl rounded-2xl flex items-center justify-center shadow-2xl -rotate-6 border border-white/10">
            <Heart size={36} className="text-brand-lime drop-shadow-[0_0_15px_rgba(222,255,144,0.5)]" fill="currentColor" />
          </div>
        </div>

        <div className={`text-center transition-all duration-1000 transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-3 tracking-tighter drop-shadow-2xl leading-none">
                SPORTPULSE
            </h1>
            
            <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-brand-lime/50"></div>
                <div className="flex items-center gap-2 text-brand-lime/90 text-[10px] font-bold uppercase tracking-[0.4em] font-sans shadow-brand-lime/50 drop-shadow-[0_0_8px_rgba(222,255,144,0.4)]">
                    <Activity size={12} strokeWidth={3} />
                    <span>Find Your Match</span>
                </div>
                <div className="h-[1px] w-8 bg-brand-lime/50"></div>
            </div>
        </div>

      </div>

    </div>
  );
};
