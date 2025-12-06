
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, User, Compass, Users, Map as MapIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLayout } from '../../context/LayoutContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isTabBarVisible } = useLayout();
  
  // Check for detail pages to hide nav
  const isDetail = location.pathname.startsWith('/clubs/') || 
                   location.pathname.startsWith('/trainers/') ||
                   (location.pathname.startsWith('/matches/') && location.pathname !== '/matches'); // Hide on match detail, show on list
  
  const isMap = location.pathname === '/map';

  // Hide nav on specific paths AND any path starting with /chat
  const hideNav = [
    '/welcome', 
    '/auth', 
    '/onboarding', 
    '/analysis', 
    '/premium', 
    '/settings', 
    '/gamification',
    '/events',   // Added
    '/trainers'  // Added
  ].includes(location.pathname) 
  || location.pathname.startsWith('/chat') 
  || isDetail;

  const isLight = theme === 'light';

  const NavItem = ({ path, icon: Icon, isCenter = false }: { path: string, icon: any, isCenter?: boolean }) => {
    const isActive = location.pathname === path;
    
    // Nav Item Styles based on theme
    const activeColor = isLight ? 'text-slate-900' : 'text-brand-lime drop-shadow-[0_0_8px_rgba(222,255,144,0.5)]';
    const inactiveColor = isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white';
    const activeBg = isLight ? 'bg-white/50' : 'bg-white/5';

    if (isCenter) {
       return (
         <button 
          onClick={() => navigate(path)}
          className={`
            relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 -mt-6 shadow-lg
            ${isActive 
                ? (isLight ? 'bg-slate-900 text-white shadow-slate-900/30' : 'bg-brand-lime text-black shadow-[0_0_20px_rgba(222,255,144,0.4)]') 
                : (isLight ? 'bg-white/80 border border-slate-200 text-slate-400' : 'bg-[#18181b] border border-white/10 text-white/60')
            }
          `}
        >
           <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </button>
       )
    }

    return (
      <button 
        onClick={() => navigate(path)}
        className={`
          relative flex items-center justify-center w-10 h-12 rounded-[20px] transition-all duration-500
          ${isActive ? activeColor : inactiveColor}
        `}
      >
        {isActive && (
          <div className={`absolute inset-0 ${activeBg} rounded-[20px] blur-lg animate-pulse-slow`} />
        )}
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
      </button>
    );
  };

  return (
    <div className={`relative w-full h-full overflow-hidden flex flex-col selection:bg-brand-lime/30 font-sans transition-colors duration-500 ${isLight ? 'bg-[#f0f4f8] text-slate-900' : 'bg-black text-white'}`}>
      {/* Deep Liquid Atmosphere - The Single Design Source */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Base Background */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-[#f0f4f8]' : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0f0f11] via-[#000000] to-[#000000]'}`}></div>
        
        {/* Vibrant Liquid Blobs - Unified Design Language */}
        <div className={`absolute top-[-20%] left-[-20%] w-[900px] h-[900px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-opacity duration-700 ${isLight ? 'mix-blend-multiply bg-indigo-300/50 opacity-60' : 'mix-blend-screen bg-[#4b29ff]/20'}`} style={{ animationDuration: '25s' }}></div>
        <div className={`absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-opacity duration-700 ${isLight ? 'mix-blend-multiply bg-lime-300/50 opacity-60' : 'mix-blend-screen bg-[#deff90]/15'}`} style={{ animationDelay: '-5s', animationDuration: '20s' }}></div>
        <div className={`absolute top-[30%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[80px] animate-blob transition-opacity duration-700 ${isLight ? 'mix-blend-multiply bg-sky-300/50 opacity-50' : 'mix-blend-screen bg-[#6d28d9]/10'}`} style={{ animationDelay: '-10s', animationDuration: '30s' }}></div>
        
        {/* Noise Texture Overlay */}
        <div className={`absolute inset-0 opacity-[0.04] pointer-events-none ${isLight ? 'mix-blend-multiply' : 'mix-blend-overlay'}`} 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      </div>

      {/* Main Content Area - Transparent to show the liquid background */}
      {/* Added pb-safe-bottom class to ensure content isn't hidden by home bar */}
      <main className={`relative z-10 flex-1 w-full overflow-y-auto no-scrollbar ${!hideNav && !isMap ? 'pb-32' : ''} pb-safe-bottom`}>
        {children}
      </main>

      {/* Floating Glass Dock - Added mb-safe-bottom to push above home bar */}
      {!hideNav && isTabBarVisible && (
        <div className="fixed bottom-8 left-0 right-0 mx-auto z-50 w-[95%] max-w-[380px] flex justify-center animate-slide-up mb-safe-bottom">
          <div className={`
            px-6 py-3 
            backdrop-filter backdrop-blur-[30px] 
            rounded-[32px] 
            flex items-center justify-between w-full
            transition-all duration-500
            ${isLight 
              ? 'bg-white/70 border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.05)] shadow-indigo-100/50' 
              : 'bg-[#0f0f11]/90 border border-white/10 shadow-[0_10px_40px_0_rgba(0,0,0,0.8)] ring-1 ring-white/5'
            }
          `}>
            {/* Inner shine/border effect */}
            <div className={`absolute inset-0 rounded-[32px] pointer-events-none ${isLight ? 'border border-white/40' : 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'}`} />
            
            <NavItem path="/" icon={Compass} />
            <NavItem path="/matches" icon={Flame} />
            <NavItem path="/map" icon={MapIcon} />
            <NavItem path="/clubs" icon={Users} />
            <NavItem path="/profile" icon={User} />
          </div>
        </div>
      )}
    </div>
  );
};
