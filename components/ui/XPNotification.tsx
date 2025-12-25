import React, { useEffect } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { Zap, Star, TrendingUp } from 'lucide-react';

export const XPNotification: React.FC = () => {
  const { notification, hideNotification } = useGamification();

  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible, hideNotification]);

  if (!notification.visible) return null;

  const isLevelUp = notification.reason.includes('Level Up');
  const isStreak = notification.reason.includes('Streak');

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
      <div 
        className={`
          flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border
          ${isLevelUp 
            ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 border-amber-400/50' 
            : isStreak
              ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 border-purple-400/50'
              : 'bg-gradient-to-r from-cyan-500/90 to-blue-500/90 border-cyan-400/50'
          }
        `}
      >
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isLevelUp 
            ? 'bg-amber-400/30' 
            : isStreak 
              ? 'bg-purple-400/30' 
              : 'bg-cyan-400/30'
          }
        `}>
          {isLevelUp ? (
            <Star size={20} className="text-white" fill="currentColor" />
          ) : isStreak ? (
            <TrendingUp size={20} className="text-white" />
          ) : (
            <Zap size={20} className="text-white" fill="currentColor" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {notification.amount > 0 && (
            <span className="text-white font-bold text-lg leading-tight">
              +{notification.amount} XP
            </span>
          )}
          <span className="text-white/90 text-sm font-medium">
            {notification.reason}
          </span>
        </div>

        {/* Sparkle effect for level up */}
        {isLevelUp && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-ping delay-100" />
            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-ping delay-200" />
          </div>
        )}
      </div>
    </div>
  );
};

export default XPNotification;
