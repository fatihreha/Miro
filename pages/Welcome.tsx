
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../components/ui/Glass';
import { Activity, Heart, Zap, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SportType } from '../types';

// Helper to render sport tags - MOVED OUTSIDE
const SportTag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md whitespace-nowrap flex-shrink-0 hover:bg-white/10 transition-colors">
    {label}
  </span>
);

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTheme();

  // Prepare sports for marquee
  const allSports = Object.values(SportType);
  const half = Math.ceil(allSports.length / 2);
  const row1 = allSports.slice(0, half);
  const row2 = allSports.slice(half);

  return (
    // Use bg-transparent so Layout background shows through
    <div className="h-screen flex flex-col items-center justify-between pt-8 pb-8 relative overflow-hidden bg-transparent">
      
      {/* Main Content Centered */}
      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full">
        
        {/* Logo Icon */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-white/5 blur-[60px] rounded-full animate-pulse-slow"></div>
          <div className="relative w-36 h-36 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-3 border border-white/20 ring-1 ring-white/10">
            <Zap size={72} className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" fill="currentColor" />
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-black/40 backdrop-blur-2xl rounded-2xl flex items-center justify-center shadow-2xl -rotate-6 border border-white/10">
            <Heart size={36} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" fill="currentColor" />
          </div>
        </div>

        <h1 className="text-7xl font-black text-white mb-6 tracking-tighter font-display leading-none drop-shadow-2xl text-center">
          Sport<span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50">Pulse</span>
        </h1>
        <p className="text-lg text-white/70 font-medium mb-12 leading-relaxed max-w-[280px] drop-shadow-sm text-center">
          {t('welcome_subtitle')}
        </p>

        {/* Scrolling Sports Marquee - Liquid Glass */}
        <div className="w-full overflow-hidden space-y-4 mb-10 opacity-90 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
            {/* Row 1: Left to Right */}
            <div className="flex w-max gap-4 animate-marquee-reverse hover:[animation-play-state:paused]">
                {[...row1, ...row1, ...row1, ...row1].map((sport, i) => (
                    <SportTag key={`r1-${i}`} label={sport} />
                ))}
            </div>
            
            {/* Row 2: Right to Left */}
            <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
                {[...row2, ...row2, ...row2, ...row2].map((sport, i) => (
                    <SportTag key={`r2-${i}`} label={sport} />
                ))}
            </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-md z-10 px-8 space-y-4">
        <GlassButton 
          onClick={() => navigate('/auth?mode=signup')} 
          className="w-full text-lg py-6 group shadow-[0_0_50px_rgba(255,255,255,0.1)] border-white/30 hover:border-white/50"
        >
          {t('start_journey')}
          <Activity className="group-hover:translate-x-1 transition-transform ml-2" size={20} />
        </GlassButton>
        
        <button 
          onClick={() => navigate('/auth?mode=login')}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white/70 font-bold text-sm hover:bg-white/10 transition-colors"
        >
           Have an account? <span className="text-white">Sign In</span> <ArrowRight size={16} />
        </button>
        
        <p className="text-center text-white/30 text-[10px] uppercase tracking-widest font-medium pt-2">
          {t('premium_experience')}
        </p>
      </div>
    </div>
  );
};
