
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassSelectable } from '../components/ui/Glass';
import { Heart, X, MapPin, Filter, Sparkles, ChevronUp, ChevronDown, Star, Send, Check, Zap, Clock, Crown, SlidersHorizontal, Ruler, Calendar, RotateCcw, Users, Activity, Lock } from 'lucide-react';
import { User, SportType } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateIcebreaker } from '../services/geminiService';
import { hapticFeedback } from '../services/hapticService';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { matchService } from '../services/matchService';
import { realtimeManager } from '../services/realtimeManager';

const MOCK_USERS: User[] = [
    {
        id: 'mock1',
        name: 'Sarah Connor',
        age: 28,
        gender: 'Female',
        bio: 'Training for the apocalypse. Love high intensity cardio and heavy lifting.',
        location: 'Los Angeles',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=80',
        interests: [SportType.GYM, SportType.RUNNING, SportType.BOXING],
        level: 'Pro',
        distance: '2km',
        workoutTimePreference: 'Morning',
        matchPercentage: 95
    },
    {
        id: 'mock2',
        name: 'Mike Ross',
        age: 30,
        gender: 'Male',
        bio: 'Tennis pro looking for a hitting partner. Casual games or competitive sets.',
        location: 'New York',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
        interests: [SportType.TENNIS, SportType.RUNNING],
        level: 'Pro',
        distance: '5km',
        workoutTimePreference: 'Evening',
        matchPercentage: 88
    },
    {
        id: 'mock3',
        name: 'Emily Chen',
        age: 25,
        gender: 'Female',
        bio: 'Yoga enthusiast and nature lover. Lets hike this weekend!',
        location: 'San Francisco',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
        interests: [SportType.YOGA, SportType.HIKING],
        level: 'Intermediate',
        distance: '10km',
        workoutTimePreference: 'Morning',
        matchPercentage: 82
    },
    {
        id: 'mock4',
        name: 'David Goggins',
        age: 40,
        gender: 'Male',
        bio: 'Stay hard. Ultra marathon runner. Can you keep up?',
        location: 'Unknown',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=80',
        interests: [SportType.RUNNING, SportType.GYM],
        level: 'Pro',
        distance: '15km',
        workoutTimePreference: 'Morning',
        matchPercentage: 75
    },
    {
        id: 'mock5',
        name: 'Alex Morgan',
        age: 24,
        gender: 'Female',
        bio: 'Just started tennis, looking for another beginner to learn with!',
        location: 'Chicago',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
        interests: [SportType.TENNIS],
        level: 'Beginner',
        distance: '3km',
        workoutTimePreference: 'Evening',
        matchPercentage: 60
    }
];

interface ProfileCardProps {
    user: User;
    currentUser?: User | null;
    onSwipe?: (dir: 'left' | 'right' | 'up') => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, currentUser, onSwipe }) => {
    const [expanded, setExpanded] = useState(false);
    const { theme } = useTheme();

    // Calculate shared interests
    const sharedInterests = currentUser ? user.interests.filter(i => currentUser.interests.includes(i)) : [];

    // Determine if we have AI data
    const hasAiData = user.matchPercentage !== undefined;

    return (
        <GlassCard
            variant="dark-always"
            onClick={() => setExpanded(!expanded)}
            // Updated radius to [32px] standard
            className="w-full h-full relative shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-white/20 rounded-[32px] overflow-hidden cursor-pointer transition-all duration-300 group ring-1 ring-white/10 select-none"
        >
            {/* Background Image */}
            <img
                src={user.avatarUrl || 'https://i.pravatar.cc/600'}
                alt={user.name}
                className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                draggable={false}
            />

            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

            {/* AI Match Badge - Top Right */}
            {hasAiData && (
                <div className="absolute top-6 right-6 z-20 animate-fade-in">
                    <div className="relative group/badge">
                        <div className="absolute inset-0 bg-neon-blue rounded-full blur-md opacity-40 animate-pulse-slow group-hover/badge:opacity-60 transition-opacity"></div>
                        <div className="relative px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                            <div className="relative w-3 h-3">
                                <div className="absolute inset-0 bg-neon-blue rounded-full animate-ping opacity-50"></div>
                                <div className="relative w-full h-full bg-neon-blue rounded-full shadow-[0_0_10px_rgba(0,242,255,0.8)]"></div>
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="text-[13px] font-black text-white tracking-tighter">{user.matchPercentage}%</span>
                                <span className="text-[7px] font-bold text-neon-blue uppercase tracking-wider">Compatibility</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Badge - Top Left */}
            <div className="absolute top-6 left-6 z-20">
                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                    {user.level === 'Pro' && <Star size={10} className="text-amber-400 fill-amber-400" />}
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{user.level}</span>
                </div>
            </div>

            {/* Bottom Content Info */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-8 z-20 flex flex-col justify-end">

                {/* Main Details */}
                <div className={`transition-all duration-500 ease-out origin-bottom ${expanded ? 'translate-y-[-10px]' : 'translate-y-0'}`}>
                    <div className="flex items-end gap-3 mb-1">
                        <h2 className="text-3xl text-white leading-none font-display font-bold tracking-tight drop-shadow-2xl">
                            {user.name}
                        </h2>
                        <span className="text-white/60 text-xl font-light pb-1 font-display">{user.age}</span>
                    </div>

                    <div className="flex items-center gap-3 text-white/80 mb-4 text-xs font-medium">
                        <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-neon-blue" />
                            <span>{user.location}</span>
                        </div>
                        {user.distance && (
                            <>
                                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                                <span>{user.distance} away</span>
                            </>
                        )}
                    </div>

                    {/* Interests Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {user.interests?.slice(0, 4).map(sport => {
                            const isShared = sharedInterests.includes(sport);
                            return (
                                <span
                                    key={sport}
                                    className={`
                                    px-3 py-1.5 rounded-[16px] backdrop-blur-md text-[9px] font-bold uppercase tracking-wider border shadow-sm transition-all
                                    ${isShared
                                            ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-neon-blue/10 scale-105'
                                            : 'bg-white/10 text-white/90 border-white/20'
                                        }
                                `}
                                >
                                    {isShared && <Check size={10} className="inline mr-1 -mt-0.5" strokeWidth={3} />}
                                    {sport}
                                </span>
                            );
                        })}
                    </div>

                    {/* Bio Snippet (Collapsed) */}
                    <p className={`text-white/80 text-xs leading-relaxed border-l-2 border-neon-blue/50 pl-3 line-clamp-2 transition-opacity duration-300 ${expanded ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 mb-2'}`}>
                        {user.bio}
                    </p>
                </div>

                {/* Expanded Content - AI & Actions */}
                <div
                    className={`
                    overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${expanded ? 'max-h-[60vh] opacity-100 mt-0' : 'max-h-0 opacity-0 mt-0'}
                `}
                >
                    <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-5 border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Glass Reflection */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

                        {/* Full Bio */}
                        <p className="text-white/90 text-xs leading-relaxed mb-5 font-light">
                            "{user.bio}"
                        </p>

                        {/* AI Insights Block */}
                        {(user.matchReason || (user.keyFactors && user.keyFactors.length > 0)) && (
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles size={14} className="text-neon-blue" />
                                    <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">Gemini Analysis</span>
                                </div>

                                {user.keyFactors && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {user.keyFactors.map((factor, i) => (
                                            <div key={i} className="px-2 py-1 rounded-[12px] bg-black/30 border border-white/5 text-[9px] text-white/80 flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
                                                {factor}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {user.matchReason && (
                                    <div className="p-3 rounded-[16px] bg-black/20 border border-white/5 text-[10px] text-white/70 italic leading-relaxed">
                                        {user.matchReason}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Expansion Indicator */}
                <div className="w-full flex justify-center pt-4 opacity-60">
                    {expanded ? (
                        <ChevronDown size={20} className="text-white animate-bounce" />
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">Details</span>
                            <ChevronUp size={20} className="text-white animate-bounce" />
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}

// Redesigned Enhanced Filter Modal
interface Filters {
    maxDistance: number;
    maxAge: number;
    sports: SportType[];
    gender: 'Male' | 'Female' | 'Everyone';
    levels: ('Beginner' | 'Intermediate' | 'Pro')[];
}

const FilterModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    isLight: boolean,
    filters: Filters,
    setFilters: (f: Filters) => void,
    matchCount: number,
    isPremium?: boolean
}> = ({ isOpen, onClose, isLight, filters, setFilters, matchCount, isPremium }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const toggleSport = (sport: SportType) => {
        if (filters.sports.includes(sport)) {
            setFilters({ ...filters, sports: filters.sports.filter(s => s !== sport) });
        } else {
            setFilters({ ...filters, sports: [...filters.sports, sport] });
        }
    };

    const toggleLevel = (lvl: 'Beginner' | 'Intermediate' | 'Pro') => {
        if (filters.levels.includes(lvl)) {
            setFilters({ ...filters, levels: filters.levels.filter(l => l !== lvl) });
        } else {
            setFilters({ ...filters, levels: [...filters.levels, lvl] });
        }
    };

    const getTrackBackground = (val: number, min: number, max: number, color: string) => {
        const percentage = ((val - min) / (max - min)) * 100;
        const bg = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)';
        return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, ${bg} ${percentage}%, ${bg} 100%)`;
    };

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col animate-fade-in font-sans overflow-hidden ${isLight ? 'bg-[#f8fafc]' : 'bg-black'}`}>

            {/* REPLICATED LIQUID ATMOSPHERE */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-br from-slate-50 via-blue-50/20 to-white' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#000000] to-[#000000]'}`}></div>
                <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-opacity duration-700 opacity-40 ${isLight ? 'bg-blue-300/30' : 'bg-indigo-900/30'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-opacity duration-700 opacity-40 ${isLight ? 'bg-purple-300/30' : 'bg-purple-900/20'}`} style={{ animationDelay: '2s' }}></div>
                <div className={`absolute inset-0 opacity-[0.04] ${isLight ? 'mix-blend-multiply' : 'mix-blend-overlay'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">

                {/* Header */}
                <div className="px-6 pt-12 pb-6 flex items-center justify-between">
                    <div>
                        <h2 className={`text-3xl font-display font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Refine Feed</h2>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Find your perfect training partner.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                hapticFeedback.medium();
                                setFilters({
                                    maxDistance: 50,
                                    maxAge: 40,
                                    sports: [],
                                    gender: 'Everyone',
                                    levels: ['Beginner', 'Intermediate', 'Pro']
                                });
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border backdrop-blur-xl ${isLight ? 'bg-white/80 text-slate-400 border-slate-200 hover:text-slate-900' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={() => { hapticFeedback.medium(); onClose(); }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-sm backdrop-blur-xl ${isLight ? 'bg-white/80 text-slate-900 border-slate-200' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Filter Options */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-10 no-scrollbar">

                    {/* Gender */}
                    <section>
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                            <Users size={14} className="text-pink-500" /> Show Me
                        </div>
                        <div className={`flex p-1 rounded-[24px] border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            {['Everyone', 'Female', 'Male'].map((g) => {
                                const isLocked = !isPremium && g !== 'Everyone';
                                return (
                                    <button
                                        key={g}
                                        onClick={() => {
                                            if (isLocked) {
                                                hapticFeedback.medium();
                                                navigate('/premium');
                                                return;
                                            }
                                            hapticFeedback.light();
                                            setFilters({ ...filters, gender: g as any });
                                        }}
                                        className={`
                                            flex-1 py-3 rounded-[20px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative overflow-hidden
                                            ${filters.gender === g
                                                ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-lg')
                                                : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white')
                                            }
                                        `}
                                    >
                                        {g}
                                        {isLocked && <Lock size={10} className="text-amber-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Skill Level */}
                    <section>
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                            <Activity size={14} className="text-green-400" /> Skill Level
                        </div>
                        <div className="flex gap-3">
                            {['Beginner', 'Intermediate', 'Pro'].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => {
                                        hapticFeedback.light();
                                        toggleLevel(lvl as any);
                                    }}
                                    className={`
                                        flex-1 py-3 rounded-[24px] text-xs font-bold border transition-all
                                        ${filters.levels.includes(lvl as any)
                                            ? 'bg-neon-blue text-black border-neon-blue shadow-lg shadow-neon-blue/20'
                                            : (isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-white/5 text-white/50 border-white/10')
                                        }
                                    `}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Distance Control */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                                <MapPin size={14} className="text-neon-blue" /> Max Distance
                            </div>
                            <div className={`text-xl font-black font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {filters.maxDistance} <span className="text-sm font-medium opacity-50">km</span>
                            </div>
                        </div>
                        <div className="relative h-10 flex items-center px-1">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={filters.maxDistance}
                                onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                                className="w-full h-2 bg-transparent appearance-none cursor-pointer relative z-20 focus:outline-none"
                                style={{
                                    background: getTrackBackground(filters.maxDistance, 1, 100, isLight ? '#0f172a' : '#00f2ff'),
                                    borderRadius: '999px'
                                }}
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    height: 24px;
                                    width: 24px;
                                    border-radius: 50%;
                                    background: #ffffff;
                                    border: 3px solid ${isLight ? '#0f172a' : '#00f2ff'};
                                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                                    margin-top: -11px; 
                                    transform: translateY(11px);
                                }
                            `}</style>
                        </div>
                    </section>

                    {/* Age Control */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                                <Calendar size={14} className="text-purple-500" /> Max Age
                            </div>
                            <div className={`text-xl font-black font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {filters.maxAge}
                            </div>
                        </div>
                        <div className="relative h-10 flex items-center px-1">
                            <input
                                type="range"
                                min="18"
                                max="65"
                                value={filters.maxAge}
                                onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                                className="w-full h-2 bg-transparent appearance-none cursor-pointer relative z-20 focus:outline-none"
                                style={{
                                    background: getTrackBackground(filters.maxAge, 18, 65, isLight ? '#0f172a' : '#bd00ff'),
                                    borderRadius: '999px'
                                }}
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    border-color: ${isLight ? '#0f172a' : '#bd00ff'};
                                }
                            `}</style>
                        </div>
                    </section>

                    {/* Interest Grid */}
                    <section>
                        <div className={`flex items-center justify-between mb-6`}>
                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/60'}`}>
                                <Ruler size={14} className="text-amber-400" /> Activities
                            </div>
                            {filters.sports.length > 0 && (
                                <button onClick={() => setFilters({ ...filters, sports: [] })} className="text-[10px] font-bold text-red-400 hover:text-red-300">Clear</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.values(SportType).map(s => {
                                const isSelected = filters.sports.includes(s);
                                return (
                                    <button
                                        key={s}
                                        onClick={() => { hapticFeedback.light(); toggleSport(s); }}
                                        className={`
                                            h-14 rounded-[24px] font-bold text-xs transition-all duration-200 active:scale-95 border flex items-center justify-center gap-2 backdrop-blur-md
                                            ${isSelected
                                                ? (isLight ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]')
                                                : (isLight ? 'bg-white/60 text-slate-500 border-slate-200 hover:bg-slate-50' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10')
                                            }
                                        `}
                                    >
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Bottom Action */}
                <div className={`p-6 pb-10 border-t backdrop-blur-2xl z-20 ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/80 border-white/10'}`}>
                    <GlassButton
                        onClick={() => { hapticFeedback.success(); onClose(); }}
                        className={`w-full h-14 text-lg font-bold shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] ${isLight ? 'shadow-slate-300' : 'shadow-neon-blue/20'}`}
                    >
                        Show {matchCount} Matches
                    </GlassButton>
                </div>
            </div>
        </div>
    );
};

// Component for Out of Swipes Modal
const LimitReachedModal: React.FC<{ isOpen: boolean, onClose: () => void, navigate: any, isLight: boolean }> = ({ isOpen, onClose, navigate, isLight }) => {
    if (!isOpen) return null;

    // Calculate renewal time (end of day)
    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0);

    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const diff = nextReset.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard className={`w-full max-w-xs relative z-10 animate-slide-up text-center p-8 ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/30 relative">
                    <Crown size={40} className="text-white" fill="currentColor" />
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[#18181b]">0 Left</div>
                </div>

                <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Out of Swipes</h2>
                <p className={`text-sm mb-6 leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    You've hit your daily limit of 10 swipes.
                </p>

                <div className={`p-4 rounded-[24px] mb-6 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                    <div className={`text-xs uppercase tracking-widest font-bold mb-2 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Swipes Renew In</div>
                    <div className={`text-2xl font-mono font-bold flex items-center justify-center gap-2 ${isLight ? 'text-slate-900' : 'text-neon-blue'}`}>
                        <Clock size={20} /> {timeLeft}
                    </div>
                </div>

                <GlassButton onClick={() => navigate('/premium')} className="w-full shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-orange-600 border-0 text-white">
                    Get Unlimited Swipes
                </GlassButton>

                <button onClick={onClose} className={`mt-4 text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'}`}>
                    Wait for tomorrow
                </button>
            </GlassCard>
        </div>
    );
};

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user: currentUser, consumeSwipe } = useAuth();
    const { t, theme } = useTheme();
    const { setTabBarVisible } = useLayout();
    const isLight = theme === 'light';

    const [allFetchedUsers, setAllFetchedUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);
    const [matchOverlay, setMatchOverlay] = useState<{ show: boolean, user: User | null, isSuper: boolean }>({ show: false, user: null, isSuper: false });
    const [aiIcebreaker, setAiIcebreaker] = useState<string | null>(null);
    const [isGeneratingIcebreaker, setIsGeneratingIcebreaker] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        maxDistance: 50,
        maxAge: 40,
        sports: [], // Empty means ALL
        gender: 'Everyone',
        levels: ['Beginner', 'Intermediate', 'Pro']
    });

    // Swipe Limiting State
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Hide/Show Tab Bar based on Filter Visibility
    useEffect(() => {
        setTabBarVisible(!showFilters);
        return () => setTabBarVisible(true); // Safety reset
    }, [showFilters, setTabBarVisible]);

    // Fetch Users from Supabase with Filters
    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) {
                setAllFetchedUsers(MOCK_USERS); // Fallback to mock if not logged in
                setIsLoadingUsers(false);
                return;
            }

            setIsLoadingUsers(true);
            try {
                const users = await matchService.getPotentialMatches(currentUser.id, {
                    maxDistance: filters.maxDistance,
                    maxAge: filters.maxAge,
                    minAge: 18,
                    gender: filters.gender !== 'Everyone' ? filters.gender : undefined,
                    sports: filters.sports.length > 0 ? filters.sports : undefined,
                    levels: filters.levels
                });

                if (users.length > 0) {
                    setAllFetchedUsers(users);
                } else {
                    // Fallback to mock if no users found
                    setAllFetchedUsers(MOCK_USERS);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                // Silent fail to mock data
                setAllFetchedUsers(MOCK_USERS);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [currentUser, filters]);

    // Enhanced Filter Logic
    const visibleUsers = useMemo(() => {
        return allFetchedUsers.filter(candidate => {
            // Distance Parsing (Mock data sometimes has "km" string)
            const candidateDistance = candidate.distance
                ? parseFloat(candidate.distance.replace(/[^0-9.]/g, ''))
                : 0;

            if (candidateDistance > filters.maxDistance) return false;
            if (candidate.age > filters.maxAge) return false;

            // Gender Filter
            if (filters.gender !== 'Everyone' && candidate.gender !== filters.gender) return false;

            // Level Filter
            if (!filters.levels.includes(candidate.level)) return false;

            // Sports Filter (Match ANY of the selected sports)
            // If filters.sports is empty, show all.
            if (filters.sports.length > 0) {
                const hasSharedInterest = candidate.interests.some(interest =>
                    filters.sports.includes(interest)
                );
                if (!hasSharedInterest) return false;
            }

            return true;
        });
    }, [allFetchedUsers, filters]);

    const currentUserCard = visibleUsers[currentIndex];
    const nextIndex = (currentIndex + 1) % visibleUsers.length;
    const nextUserCard = visibleUsers[nextIndex];

    const handleSwipe = async (dir: 'left' | 'right' | 'up') => {
        if (direction) return;
        if (!currentUser || !currentUserCard) return;

        // CHECK SWIPE LIMIT for Likes (Right/Up)
        // Note: 10 swipes limit per day for non-premium
        if ((dir === 'right' || dir === 'up') && !currentUser?.isPremium) {
            const swipesLeft = currentUser?.dailySwipes ?? 10;

            if (swipesLeft <= 0) {
                hapticFeedback.error();
                setShowLimitModal(true);
                return;
            }

            // Consume a swipe if allowed
            consumeSwipe();
        }

        hapticFeedback.medium();

        // Record swipe in Supabase and check for match
        if (dir === 'right' || dir === 'up') {
            const action = dir === 'up' ? 'superlike' : 'like';

            try {
                const { matched, matchData } = await matchService.swipeUser(
                    currentUser.id,
                    currentUserCard.id,
                    action
                );

                // If it's a match, show overlay with real data
                if (matched && matchData) {
                    setTimeout(() => {
                        setMatchOverlay({
                            show: true,
                            user: {
                                ...currentUserCard,
                                matchPercentage: matchData.compatibility_score,
                                matchReason: matchData.match_reason,
                                keyFactors: matchData.key_factors
                            },
                            isSuper: dir === 'up'
                        });
                    }, 300);
                }
            } catch (error) {
                console.error('Error recording swipe:', error);
                // Continue with visual feedback even if DB fails
            }
        } else if (dir === 'left') {
            // Record pass
            try {
                await matchService.swipeUser(currentUser.id, currentUserCard.id, 'pass');
            } catch (error) {
                console.error('Error recording pass:', error);
            }
        }

        // Visual animation
        setDirection(dir);
        setTimeout(() => {
            setDirection(null);
            if (currentIndex < visibleUsers.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setCurrentIndex(0); // Loop for demo
            }
        }, 500);
    };

    const handleGenerateIcebreaker = async () => {
        if (!currentUser || !matchOverlay.user) return;
        setIsGeneratingIcebreaker(true);
        const text = await generateIcebreaker(currentUser, matchOverlay.user);
        setAiIcebreaker(text);
        setIsGeneratingIcebreaker(false);
    };

    const handleSendIcebreaker = () => {
        if (matchOverlay.user) {
            hapticFeedback.success();
            navigate(`/chat/${matchOverlay.user.id}`);
        }
    };

    if (visibleUsers.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-fade-in">
                <FilterModal
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    isLight={isLight}
                    filters={filters}
                    setFilters={setFilters}
                    matchCount={visibleUsers.length}
                    isPremium={currentUser?.isPremium}
                />

                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                    <Filter size={40} className="opacity-40" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>No matches found</h3>
                <p className={`text-sm mb-8 max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    We couldn't find anyone matching your specific criteria. Try widening your search.
                </p>
                <GlassButton onClick={() => setShowFilters(true)} variant="secondary" className="min-w-[200px]">
                    Adjust Filters
                </GlassButton>
            </div>
        );
    }

    const swipesRemaining = currentUser?.dailySwipes ?? 10;
    const isOutOfSwipes = !currentUser?.isPremium && swipesRemaining <= 0;

    return (
        <div className="flex flex-col h-full relative font-sans overflow-hidden">
            <LimitReachedModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} navigate={navigate} isLight={isLight} />
            <FilterModal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                isLight={isLight}
                filters={filters}
                setFilters={setFilters}
                matchCount={visibleUsers.length}
                isPremium={currentUser?.isPremium}
            />

            {/* Header Section */}
            <div className="flex-none px-6 pt-4 pb-1 z-30 relative animate-fade-in">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className={`text-2xl sm:text-3xl mb-0.5 tracking-tight font-display font-bold drop-shadow-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('good_morning')}</h1>
                        <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            <span>{t('daily_picks')}</span>
                            <span className={`w-1 h-1 rounded-full ${isLight ? 'bg-slate-400' : 'bg-white/40'}`}></span>
                            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Remaining Swipes Indicator */}
                        {!currentUser?.isPremium && (
                            <button
                                onClick={() => setShowLimitModal(true)}
                                className={`h-10 px-3 rounded-[24px] flex items-center gap-1.5 justify-center backdrop-blur-xl border transition shadow-lg ${isOutOfSwipes
                                    ? 'bg-red-500 text-white border-red-600 animate-pulse'
                                    : (isLight ? 'bg-white/60 text-slate-900 border-white hover:bg-white' : 'bg-white/[0.05] text-white border-white/10 hover:bg-white/10')
                                    }`}
                            >
                                {isOutOfSwipes ? (
                                    <Clock size={16} />
                                ) : (
                                    <Zap size={16} className={swipesRemaining < 3 ? 'text-red-500' : 'text-neon-blue'} fill="currentColor" />
                                )}
                                <span className="text-xs font-bold">{swipesRemaining}</span>
                            </button>
                        )}

                        {/* Filter Button - Opens Modal, Does NOT Navigate */}
                        <button onClick={() => setShowFilters(true)} className={`w-10 h-10 rounded-[24px] flex items-center justify-center backdrop-blur-xl border transition shadow-lg active:scale-95 ${isLight ? 'bg-white/60 text-slate-900 border-white shadow-black/5 hover:bg-white' : 'bg-white/[0.05] text-white border-white/10 hover:bg-white/10'}`}>
                            <SlidersHorizontal size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Match Overlay - REDESIGNED for SportPulse Liquid Glass */}
            {matchOverlay.show && matchOverlay.user && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
                    {/* Liquid Atmosphere Background */}
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-0">
                        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-blue/30 rounded-full blur-[100px] animate-pulse-slow"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-blob"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                    </div>

                    <div className="w-full max-w-sm text-center relative z-10 px-6">
                        {/* Title */}
                        <div className="mb-10 relative">
                            <div className="text-6xl font-black italic font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] animate-slide-up">
                                {t('match_title')}
                            </div>
                            <p className="text-white/70 text-sm font-medium mt-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                                {t('you_and')} <span className="text-neon-blue font-bold">{matchOverlay.user.name}</span> {t('like_each_other')}
                            </p>
                        </div>

                        {/* Avatars Connection */}
                        <div className="flex justify-center items-center gap-4 mb-12 relative h-32">
                            {/* User 1 */}
                            <div className="absolute left-[15%] w-32 h-32 rounded-full p-1 bg-gradient-to-br from-neon-blue to-blue-600 shadow-[0_0_40px_rgba(0,242,255,0.3)] animate-slide-up" style={{ animationDelay: '200ms' }}>
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-black">
                                    <img src={currentUser?.avatarUrl} alt="You" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Connection Icon */}
                            <div className="absolute z-20 w-14 h-14 rounded-full bg-black border-2 border-white/20 flex items-center justify-center shadow-2xl animate-pop" style={{ animationDelay: '600ms' }}>
                                <Zap fill="currentColor" size={28} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                            </div>

                            {/* User 2 */}
                            <div className="absolute right-[15%] w-32 h-32 rounded-full p-1 bg-gradient-to-br from-purple-500 to-pink-600 shadow-[0_0_40px_rgba(192,38,211,0.3)] animate-slide-up" style={{ animationDelay: '400ms' }}>
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-black">
                                    <img src={matchOverlay.user.avatarUrl} alt={matchOverlay.user.name} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '600ms' }}>
                            {!aiIcebreaker ? (
                                <>
                                    <GlassButton
                                        onClick={handleGenerateIcebreaker}
                                        disabled={isGeneratingIcebreaker}
                                        className="w-full h-16 text-lg font-bold shadow-[0_0_30px_rgba(0,242,255,0.3)] bg-neon-blue text-black border-0 hover:scale-[1.02]"
                                    >
                                        {isGeneratingIcebreaker ? (
                                            <span className="flex items-center gap-2"><Sparkles size={20} className="animate-spin" /> Drafting...</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2"><Sparkles size={20} /> {t('suggest_icebreaker')}</span>
                                        )}
                                    </GlassButton>

                                    <button
                                        onClick={() => setMatchOverlay({ show: false, user: null, isSuper: false })}
                                        className="w-full py-4 rounded-[24px] font-bold text-xs uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        {t('say_hi_later')}
                                    </button>
                                </>
                            ) : (
                                <div className="animate-slide-up">
                                    <div className="relative mb-6 group">
                                        <div className="absolute inset-0 bg-white/10 blur-xl rounded-full transform scale-90 group-hover:scale-100 transition-transform"></div>
                                        <GlassCard className="p-6 relative bg-black/40 border-white/20 backdrop-blur-xl">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue rounded-l-2xl"></div>
                                            <p className="font-medium text-lg italic text-white leading-relaxed">"{aiIcebreaker}"</p>
                                        </GlassCard>
                                    </div>
                                    <GlassButton onClick={handleSendIcebreaker} className="w-full h-16 text-lg bg-white text-black border-0 shadow-xl hover:scale-[1.02]">
                                        {t('send_message')} <Send size={20} className="ml-2" />
                                    </GlassButton>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Wrapper - Optimized Layout for Height */}
            <div className="flex-1 flex flex-col w-full max-w-[520px] mx-auto relative z-10 px-4 pb-4 h-full">
                {/* Card Stack Container - Maximized height by using flex-1 */}
                <div className="flex-1 relative w-full perspective-[1000px] min-h-0 mt-2 mb-4">
                    {visibleUsers.length > 1 && (
                        <div className={`absolute inset-0 z-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${direction ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.95] opacity-60 translate-y-4'}`}>
                            <ProfileCard key={nextUserCard?.id || 'next'} user={nextUserCard} currentUser={currentUser} onSwipe={() => { }} />
                        </div>
                    )}
                    <div className={`absolute inset-0 z-10 transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] origin-bottom h-full
                  ${direction === 'left' ? '-translate-x-[120%] -rotate-[15deg] opacity-0' : ''}
                  ${direction === 'right' ? 'translate-x-[120%] rotate-[15deg] opacity-0' : ''}
                  ${direction === 'up' ? '-translate-y-[120%] scale-90 opacity-0' : ''}
                  ${!direction ? 'translate-x-0 rotate-0 opacity-100' : ''}
                `}>
                        <ProfileCard key={currentUserCard.id} user={currentUserCard} currentUser={currentUser} onSwipe={handleSwipe} />
                    </div>
                </div>

                {/* Swipe Action Buttons */}
                <div className="flex-none flex items-center justify-center gap-6 z-20 h-20">
                    <button
                        onClick={() => handleSwipe('left')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition duration-200 hover:scale-110 active:scale-95 backdrop-blur-xl shadow-2xl ${isLight ? 'bg-white/90 text-red-500 border border-red-100 hover:bg-red-50' : 'bg-black/60 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500'}`}
                    >
                        <X size={32} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={() => handleSwipe('up')}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition duration-200 hover:scale-110 active:scale-95 backdrop-blur-xl shadow-2xl ${isLight ? 'bg-white/90 text-blue-500 border border-blue-100 hover:bg-blue-50' : 'bg-black/60 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue hover:text-black hover:border-neon-blue'}`}
                    >
                        <Star size={24} fill="currentColor" />
                    </button>

                    <button
                        onClick={() => handleSwipe('right')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition duration-200 hover:scale-110 active:scale-95 shadow-2xl ${isLight ? 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800' : 'bg-white text-black border border-white hover:bg-gray-200'} ${isOutOfSwipes ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        <Heart size={32} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};
