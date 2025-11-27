
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/Glass';
import { Trophy, Medal, Zap, Crown, TrendingUp, Link, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gamificationService } from '../services/gamificationService';

export const Gamification: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'progress' | 'leaderboard'>('progress');

  const isLight = theme === 'light';

  // State for real data
  const [userXP, setUserXP] = useState(2450);
  const [currentLevel, setCurrentLevel] = useState(12);
  const [nextLevelXP, setNextLevelXP] = useState(3000);
  const [badges, setBadges] = useState([
    { id: '1', name: 'Early Bird', icon: '🌅', description: 'Joined 5 morning events', unlocked: true },
    { id: '2', name: 'Socialite', icon: '🗣️', description: 'Sent 100 messages', unlocked: true },
    { id: '3', name: 'Club Founder', icon: '🏰', description: 'Created your first club', unlocked: false },
    { id: '4', name: 'Marathoner', icon: '🏃', description: 'Logged 42km total', unlocked: true },
    { id: '5', name: 'Yogi Master', icon: '🧘', description: 'Attended 10 Yoga sessions', unlocked: false },
    { id: '6', name: 'Streak King', icon: '🔥', description: '7 day login streak', unlocked: true },
  ]);
  const [leaderboard, setLeaderboard] = useState([
    { id: '1', name: 'Jessica M.', xp: 15420, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60', rank: 1 },
    { id: '2', name: 'Mike T.', xp: 12100, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=60', rank: 2 },
    { id: '3', name: 'Sarah C.', xp: 9850, avatar: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&auto=format&fit=crop&q=60', rank: 3 },
    { id: 'me', name: 'You', xp: 2450, avatar: user?.avatarUrl, rank: 42 },
  ]);

  // Load real data from Supabase
  useEffect(() => {
    if (!user) return;

    const loadGamificationData = async () => {
      try {
        // Load user XP and level
        const xpData = await gamificationService.getUserXP(user.id);
        if (xpData) {
          setUserXP(xpData.total_xp || 2450);
          setCurrentLevel(xpData.level || 12);
        }

        // Load user badges
        const userBadges = await gamificationService.getUserBadges(user.id);
        if (userBadges.length > 0) {
          setBadges(userBadges.map(b => ({
            id: b.id,
            name: b.name,
            icon: b.icon || '🏆',
            description: b.description || '',
            unlocked: true
          })));
        }

        // Load leaderboard
        const leaders = await gamificationService.getLeaderboard('xp', 10);
        if (leaders.length > 0) {
          setLeaderboard(leaders.map((l, idx) => ({
            id: l.userId,
            name: l.userName || 'User',
            xp: l.xp,
            avatar: l.avatarUrl || 'https://i.pravatar.cc/150',
            rank: idx + 1
          })));
        }
      } catch (e) {
        console.error('Error loading gamification data:', e);
        // Keep mock data on error
      }
    };

    loadGamificationData();
  }, [user]);

  const progress = (userXP / nextLevelXP) * 100;

  return (
    <div className="min-h-full px-6 pt-6 pb-24 relative">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex justify-between items-end">
          <div>
            <h1 className={`text-3xl font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Achievements</h1>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Track your fitness journey.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-1">
            <Crown className="text-white" size={24} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl mb-8 backdrop-blur-md border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/10 border-white/10'}`}>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'progress' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
        >
          My Progress
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaderboard' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'progress' ? (
        <div className="space-y-6 animate-slide-up">
          {/* XP Card */}
          <GlassCard className={`p-6 relative overflow-hidden ${isLight ? 'bg-white border-slate-200 shadow-lg' : ''}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none ${isLight ? 'bg-blue-500/20' : 'bg-neon-blue/20'}`} />

            <div className="flex justify-between items-center mb-4">
              <div>
                <div className={`text-xs uppercase tracking-widest font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Current Level</div>
                <div className={`text-4xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentLevel}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs uppercase tracking-widest font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Total XP</div>
                <div className={`text-xl font-medium ${isLight ? 'text-blue-600' : 'text-neon-blue'}`}>{userXP.toLocaleString()}</div>
              </div>
            </div>

            <div className={`relative h-4 rounded-full overflow-hidden backdrop-blur-sm border mb-2 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/5'}`}>
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isLight ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-neon-blue to-purple-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={`text-xs text-right ${isLight ? 'text-slate-400' : 'text-white/50'}`}>{nextLevelXP - userXP} XP to Level {currentLevel + 1}</div>
          </GlassCard>

          {/* Connected Apps Section */}
          <div>
            <h3 className={`font-semibold mb-4 px-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Connected Apps</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#fc4c02] rounded-lg flex items-center justify-center text-white font-bold text-xs">S</div>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Strava</span>
                </div>
                <div className="text-green-500 text-xs font-bold flex items-center gap-1">
                  <Check size={12} /> Active
                </div>
              </div>
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-white border-slate-200 opacity-60' : 'bg-white/5 border-white/10 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">❤</div>
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Health</span>
                </div>
                <div className={`text-xs font-bold flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  <Link size={12} /> Connect
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div>
            <h3 className={`font-semibold mb-4 px-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Badges</h3>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`
                    p-3 flex flex-col items-center text-center gap-2 aspect-square justify-center rounded-2xl border transition-all
                    ${badge.unlocked
                      ? (isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/10 border-white/20')
                      : (isLight ? 'bg-slate-100 border-slate-200 opacity-60 grayscale' : 'bg-black/20 border-white/5 opacity-50 grayscale')
                    }
                  `}
                >
                  <div className="text-3xl mb-1 drop-shadow-md">{badge.icon}</div>
                  <div className={`text-xs font-medium leading-tight ${isLight ? 'text-slate-700' : 'text-white'}`}>{badge.name}</div>
                  {badge.unlocked && <div className={`text-[8px] ${isLight ? 'text-green-600' : 'text-neon-lime'}`}>Unlocked</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {leaderboard.map((user, idx) => (
            <GlassCard
              key={user.id}
              className={`
                flex items-center gap-4 p-4 
                ${user.rank <= 3 ? (isLight ? 'border-yellow-400/50 bg-yellow-50' : 'border-yellow-500/30 bg-yellow-500/5') : (isLight ? 'bg-white' : '')}
              `}
            >
              <div className={`
                w-8 h-8 flex items-center justify-center font-bold rounded-full
                ${user.rank === 1 ? 'bg-yellow-400 text-black' :
                  user.rank === 2 ? 'bg-gray-300 text-black' :
                    user.rank === 3 ? 'bg-orange-400 text-black' : (isLight ? 'text-slate-400 bg-slate-100' : 'text-white/40')}
              `}>
                {user.rank}
              </div>

              <img src={user.avatar} alt={user.name} className={`w-10 h-10 rounded-full object-cover border ${isLight ? 'border-slate-200' : 'border-white/10'}`} />

              <div className="flex-1">
                <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</div>
                <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{user.rank <= 3 ? 'Elite Athlete' : 'Rising Star'}</div>
              </div>

              <div className={`flex items-center gap-1 font-mono font-bold ${isLight ? 'text-blue-600' : 'text-neon-blue'}`}>
                <Zap size={14} fill="currentColor" />
                {user.xp.toLocaleString()}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
