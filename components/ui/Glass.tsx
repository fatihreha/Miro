import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'dark-always'; // 'dark-always' for cards that sit on images (like profile stack)
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', variant = 'default', ...props }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light' && variant !== 'dark-always';

  return (
    <div 
      {...props}
      className={`
        relative
        backdrop-filter backdrop-blur-[30px]
        rounded-[32px]
        overflow-hidden
        transition-all duration-300
        group
        ${isLight 
          ? 'bg-white/60 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-slate-900' 
          : 'bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] text-white'
        }
        ${className}
      `}
    >
      {/* Inner glow/shine */}
      <div className={`absolute inset-0 rounded-[32px] pointer-events-none ${isLight ? 'shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]' : 'shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]'}`}></div>
      
      {/* Edge highlight */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] ${isLight ? 'bg-white/80' : 'bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60'}`}></div>
      
      {children}
    </div>
  );
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  loading = false,
  ...props 
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Updated radius to rounded-[24px] for consistency
  const baseStyles = "relative px-8 py-4 rounded-[24px] font-display font-bold text-sm tracking-wide transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group";
  
  // Dynamic Styles based on Theme
  const variants = {
    primary: isLight 
      ? `bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 border border-transparent`
      : `bg-white text-black hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.15)] border-t border-white/80`,
      
    secondary: isLight
      ? `bg-white/60 hover:bg-white text-slate-900 border border-white shadow-sm`
      : `bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`,
      
    danger: isLight
      ? `bg-red-50 hover:bg-red-100 text-red-600 border border-red-100`
      : `bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-md`,
      
    ghost: isLight
      ? `bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-900`
      : `bg-transparent border-0 shadow-none hover:bg-white/5 text-white/60 hover:text-white`
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {/* Shine effect only for primary dark mode or heavy buttons */}
      {variant === 'primary' && !isLight && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {loading ? (
        <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
      ) : children}
    </button>
  );
};

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <input 
      {...props}
      // Updated radius to rounded-[24px]
      className={`
        w-full rounded-[24px] px-5 py-4 
        font-sans text-base transition-all duration-300
        focus:outline-none focus:ring-1
        ${isLight 
          ? 'bg-white/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:ring-slate-200 shadow-inner'
          : 'bg-black/20 border border-white/10 text-white placeholder-white/20 focus:bg-black/40 focus:border-white/20 focus:ring-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
        }
        backdrop-blur-xl 
        ${props.className}
      `}
    />
  );
};

interface GlassSelectableProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const GlassSelectable: React.FC<GlassSelectableProps> = ({ selected, onClick, children, className = '' }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={onClick}
      // Updated radius to rounded-[24px] to match buttons
      className={`
        px-5 py-2.5 rounded-[24px] border transition-all duration-300
        flex items-center justify-center gap-2 text-sm font-medium tracking-wide
        ${selected 
          ? (isLight 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
              : 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105')
          : (isLight 
              ? 'bg-white/40 border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900' 
              : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/10')
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};