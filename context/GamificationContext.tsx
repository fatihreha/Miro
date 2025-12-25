import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { hapticFeedback } from '../services/hapticService';

interface GamificationContextType {
  xp: number;
  level: number;
  streak: number;
  awardXP: (amount: number, reason: string) => void;
  checkStreak: () => void;
  notification: { amount: number; reason: string; visible: boolean };
  hideNotification: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  
  const [notification, setNotification] = useState({ amount: 0, reason: '', visible: false });

  // Sync state with User object
  useEffect(() => {
    if (user) {
      setXp(user.xp || 0);
      setLevel(user.userLevel || 1);
      setStreak(user.streak || 0);
    }
  }, [user]);

  const awardXP = (amount: number, reason: string) => {
    if (!user) return;

    const newXP = xp + amount;
    // Simple leveling formula: Level up every 1000 XP
    const newLevel = Math.floor(newXP / 1000) + 1;
    const isLevelUp = newLevel > level;

    // Optimistic Update
    setXp(newXP);
    setLevel(newLevel);

    // Update persistence
    updateUser({ xp: newXP, userLevel: newLevel });

    // Trigger Notification
    setNotification({ amount, reason, visible: true });
    hapticFeedback.success();

    if (isLevelUp) {
        // Chain level up notification
        setTimeout(() => {
             setNotification({ amount: 0, reason: `Level Up! You are now Lvl ${newLevel}`, visible: true });
             hapticFeedback.heavy();
        }, 3500);
    }
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  const checkStreak = () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const lastActiveStr = user.lastActiveDate;
    
    // If first time or no record
    if (!lastActiveStr) {
        const newStreak = 1;
        updateUser({ streak: newStreak, lastActiveDate: new Date().toISOString() });
        setStreak(newStreak);
        awardXP(10, 'First Day Streak!');
        return;
    }

    const lastActive = new Date(lastActiveStr);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Already active today, do nothing
        return;
    } else if (diffDays === 1) {
        // Consecutive day
        const newStreak = (user.streak || 0) + 1;
        updateUser({ streak: newStreak, lastActiveDate: new Date().toISOString() });
        setStreak(newStreak);
        
        // Bonus XP for streaks
        const bonus = Math.min(newStreak * 10, 100); // Cap bonus at 100
        awardXP(bonus, `${newStreak} Day Streak!`);
    } else {
        // Streak broken
        const newStreak = 1;
        updateUser({ streak: newStreak, lastActiveDate: new Date().toISOString() });
        setStreak(newStreak);
        awardXP(10, 'Streak Reset'); // Pity points
    }
  };

  return (
    <GamificationContext.Provider value={{ xp, level, streak, awardXP, checkStreak, notification, hideNotification }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
