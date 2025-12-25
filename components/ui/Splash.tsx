import React, { useEffect, useState } from 'react';

interface SplashProps {
  onFinish: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onFinish }) => {
  const [stage, setStage] = useState<'trails' | 'impact' | 'stable' | 'exit'>('trails');
  const [canSkip, setCanSkip] = useState(false);

  // Prefers-reduced-motion support
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onFinish();
      return;
    }
  }, [onFinish]);

  useEffect(() => {
    // Stage 1: Enerji izleri başlar (trails)
    const impactTimer = setTimeout(() => setStage('impact'), 600);
    
    // Stage 2: Logo kenetlenir ve parlar (impact)
    const stableTimer = setTimeout(() => setStage('stable'), 1000);
    
    // Skip button aktif olur
    const skipTimer = setTimeout(() => setCanSkip(true), 1000);
    
    // Stage 3: Çıkış animasyonu (stable → exit)
    const exitTimer = setTimeout(() => setStage('exit'), 2500);
    
    // Stage 4: Tamamlanma (3 saniye - mevcut ile aynı)
    const finishTimer = setTimeout(() => onFinish(), 3000);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(stableTimer);
      clearTimeout(skipTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    if (canSkip) {
      setStage('exit');
      setTimeout(() => onFinish(), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === 'Escape') && canSkip) {
      handleSkip();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.87,0,0.13,1)] ${stage === 'exit' ? 'opacity-0 scale-110' : 'opacity-100'}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      
      {/* 1. Dinamik Arka Plan */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0a0a0f] via-[#000000] to-[#000000]"></div>
        
        {/* Kinetic Blobs - Stage değiştikçe canlanacaklar */}
        <div className={`absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full mix-blend-screen filter blur-[120px] transition-all duration-[2000ms] ${stage !== 'trails' ? 'opacity-30 bg-brand-indigo/40 scale-100' : 'opacity-0 scale-50'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] transition-all duration-[2000ms] ${stage !== 'trails' ? 'opacity-20 bg-brand-lime/30 scale-100' : 'opacity-0 scale-50'}`} style={{ transitionDelay: '200ms' }}></div>
      </div>

      {/* 2. Enerji İzleri (Trails) */}
      {stage === 'trails' && (
        <>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-brand-lime to-transparent animate-[slideUp_0.6s_ease-in_forwards] blur-sm opacity-50 translate-x-[30vw]"></div>
          <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-t from-transparent via-brand-indigo to-transparent animate-[slideUp_0.6s_ease-in_forwards] blur-sm opacity-50 -translate-x-[30vw]"></div>
        </>
      )}

      {/* Skip Button */}
      {canSkip && (
        <button 
          onClick={handleSkip}
          className="absolute top-8 right-8 z-20 text-white/40 hover:text-white/90 text-sm font-medium transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-lime/50 rounded px-3 py-1.5"
          aria-label="Skip splash screen"
        >
          Skip →
        </button>
      )}

      {/* 3. Etki ve Logo Alanı */}
      <div className="relative flex flex-col items-center">
        
        {/* Çarpışma Parlaması (Shockwave) */}
        {stage === 'impact' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full animate-[ping_0.8s_cubic-bezier(0,0,0.2,1)_1] shadow-[0_0_100px_50px_rgba(255,255,255,0.8)] z-20"></div>
        )}

        <div className={`relative transition-all duration-700 ${stage === 'trails' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}>
            
            {/* Bind Logosu */}
            <div className={`relative flex items-center justify-center transition-all duration-700 ${stage === 'impact' ? 'animate-[pop_0.4s_cubic-bezier(0.68,-0.55,0.27,1.55)]' : ''}`}>
                <img 
                    src="/logo.png" 
                    alt="bind" 
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain relative z-10"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'text-7xl sm:text-8xl font-display font-bold text-white tracking-tighter drop-shadow-2xl';
                            fallback.innerText = 'bind';
                            parent.appendChild(fallback);
                        }
                    }}
                />
                
                {/* Logo İçi Işık Hareketleri */}
                <div className={`absolute inset-0 z-20 w-full h-full mix-blend-overlay pointer-events-none rounded-full overflow-hidden transition-opacity duration-1000 ${stage === 'stable' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute -inset-[50%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(222,255,144,0.4)_180deg,transparent_360deg)] animate-[spin_3s_linear_infinite] blur-2xl"></div>
                </div>
            </div>

            {/* Subtitle / Tagline */}
            <div className={`mt-4 text-center overflow-hidden transition-all duration-1000 ${stage === 'stable' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-[10px] font-display font-bold text-white/40 uppercase tracking-[0.4em]">
                    Find your lock
                </span>
            </div>

        </div>

        {/* Kenetlenme Efekti (Shockwave Ring) */}
        {stage === 'stable' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/20 rounded-full animate-[ping_1.5s_ease-out_forwards] opacity-0"></div>
        )}
      </div>

      {/* 4. Noise Kaplaması */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};
