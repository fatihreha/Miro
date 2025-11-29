
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassSelectable, GlassCard, GlassButton } from '../components/ui/Glass';
import { ChevronRight, MapPin, Calendar, Check, Clock, Activity, ArrowRight, Bell, Crown, Lock, Heart, Zap } from 'lucide-react';
import { User, SportType, ActivityRequest } from '../types';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import { matchService } from '../services/matchService';
import { realtimeManager } from '../services/realtimeManager';

// Mock data removed

export const Matches: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
    const [activeTab, setActiveTab] = useState<'matches' | 'requests'>('matches');
    const [requests, setRequests] = useState<ActivityRequest[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [whoLikesYou, setWhoLikesYou] = useState<User[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);

    const isLight = theme === 'light';
    const isPremium = user?.isPremium;

    // Fetch and subscribe to real-time matches
    useEffect(() => {
        if (!user) return;

        const fetchMatches = async () => {
            setIsLoadingMatches(true);
            try {
                const matchList = await matchService.getMatches(user.id);
                setMatches(matchList);

                // Get "Who Likes You" if premium
                if (isPremium) {
                    const likes = await matchService.getWhoLikesYou(user.id);
                    setWhoLikesYou(likes);
                }
            } catch (error) {
                console.error('Error fetching matches:', error);
                setMatches([]);
                setWhoLikesYou([]);
            } finally {
                setIsLoadingMatches(false);
            }
        };

        // Initial fetch
        fetchMatches();

        // Subscribe to real-time match updates
        const subscriptionKey = realtimeManager.subscribeToMatches(user.id, (newMatches) => {
            setMatches(newMatches);
            hapticFeedback.success(); // Haptic feedback on new match
            notificationService.showNotification("New Match! 🎉", { body: "You have a new training partner!" });
        });

        return () => {
            realtimeManager.unsubscribe(subscriptionKey);
        };
    }, [user, isPremium]);

    // Fetch and subscribe to requests
    useEffect(() => {
        if (!user) return;

        // Subscribe to real-time requests
        const subscriptionKey = realtimeManager.subscribeToRequests(user.id, (newRequests) => {
            setRequests(newRequests);
        });

        return () => {
            realtimeManager.unsubscribe(subscriptionKey);
        };
    }, [user]);

    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            if (sortBy === 'name') {
                return (a.partner?.name || '').localeCompare(b.partner?.name || '');
            } else {
                // Sort by match date (newest first)
                return new Date(b.matchedAt || 0).getTime() - new Date(a.matchedAt || 0).getTime();
            }
        });
    }, [matches, sortBy]);

    const handleAcceptRequest = (reqId: string) => {
        hapticFeedback.success();
        // Update local state
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'accepted' } : r));
        // Update service persistence
        requestService.updateRequestStatus(reqId, 'accepted');
        notificationService.showNotification("Activity Accepted!", { body: "Added to your calendar." });
    };

    const handleDeclineRequest = (reqId: string) => {
        hapticFeedback.medium();
        // Remove from UI
        setRequests(prev => prev.filter(r => r.id !== reqId));
        // Update service persistence
        requestService.updateRequestStatus(reqId, 'rejected');
    };

    const handleSetReminder = (req: ActivityRequest) => {
        hapticFeedback.success();
        notificationService.showNotification("Reminder Set ⏰", {
            body: `Alarm set for ${req.time} on ${req.date}. We'll remind you beforehand!`
        });
    };

    const handleLikeClick = (likedUser: User) => {
        if (!isPremium) {
            hapticFeedback.medium();
            navigate('/premium');
        } else {
            // Logic to match (open profile for now)
            navigate(`/matches/${likedUser.id}`, { state: { user: likedUser } });
        }
    };

    return (
        <div className="px-6 pt-10 pb-24 min-h-full relative">
            {/* Header */}
            <div className="flex items-end gap-3 mb-6">
                <h2 className={`text-3xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Connections</h2>
            </div>

            {/* Tabs */}
            <div className={`flex p-1 rounded-[24px] mb-6 backdrop-blur-md border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/10 border-white/10'}`}>
                <button
                    onClick={() => setActiveTab('matches')}
                    className={`flex-1 py-2.5 rounded-[20px] text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'matches' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
                >
                    Profiles ({matches.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-2.5 rounded-[20px] text-xs font-bold uppercase tracking-wide transition-all relative ${activeTab === 'requests' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
                >
                    Requests
                    {requests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            </div>

            {activeTab === 'matches' && (
                <div className="animate-slide-up space-y-6">

                    {/* READY TO TRAIN SECTION (Formerly Likes You) */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Ready to Train</h3>
                            <div className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                                <Crown size={10} fill="currentColor" /> {whoLikesYou.length}
                            </div>
                        </div>

                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                            {whoLikesYou.map((likeUser, idx) => (
                                <div
                                    key={likeUser.id}
                                    onClick={() => handleLikeClick(likeUser)}
                                    className={`
                                relative flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-95
                                ${!isPremium ? 'border border-amber-500/50' : 'border border-white/10'}
                            `}
                                >
                                    {/* Image with conditional Blur */}
                                    <img
                                        src={likeUser.avatarUrl}
                                        className={`w-full h-full object-cover transition-all duration-500 ${!isPremium ? 'blur-md scale-110 brightness-50' : ''}`}
                                        alt="Hidden User"
                                    />

                                    {/* Overlay for Non-Premium */}
                                    {!isPremium && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/50 mb-1">
                                                <Lock size={14} className="text-black" fill="currentColor" />
                                            </div>
                                            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">Gold</span>
                                        </div>
                                    )}

                                    {/* Info for Premium */}
                                    {isPremium && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                            <span className="text-xs font-bold text-white truncate">{likeUser.name}</span>
                                            <span className="text-[9px] text-white/70">{likeUser.age} • {likeUser.interests[0]}</span>
                                        </div>
                                    )}

                                    {/* Match indicator if Premium */}
                                    {isPremium && (
                                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Zap size={10} className="text-neon-blue fill-neon-blue" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Upsell Card (Always last if not premium, or if list is short) */}
                            {!isPremium && (
                                <div
                                    onClick={() => navigate('/premium')}
                                    className={`flex-shrink-0 w-24 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer border border-dashed ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg">
                                        <Crown size={16} className="text-white" fill="currentColor" />
                                    </div>
                                    <div className={`text-[9px] font-bold text-center leading-tight ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                                        See who is<br />Ready
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MATCHES LIST */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Your Matches</h3>

                            {/* Sorting Controls */}
                            <div className="flex items-center gap-2">
                                <GlassSelectable
                                    selected={sortBy === 'distance'}
                                    onClick={() => setSortBy('distance')}
                                    className="!py-1 !px-2 !text-[9px] uppercase tracking-wide"
                                >
                                    Distance
                                </GlassSelectable>
                                <GlassSelectable
                                    selected={sortBy === 'name'}
                                    onClick={() => setSortBy('name')}
                                    className="!py-1 !px-2 !text-[9px] uppercase tracking-wide"
                                >
                                    Name
                                </GlassSelectable>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {sortedMatches.map((match, index) => {
                                const partner = match.partner; // Partner user object from Supabase
                                if (!partner) return null; return (
                                    <div
                                        key={match.id}
                                        onClick={() => navigate(`/chat/${partner.id}`, { state: { user: partner } })}
                                        className={`
                            group p-4 rounded-[32px] border transition-all duration-300 cursor-pointer flex items-center gap-4
                            ${isLight
                                                ? 'bg-white/60 hover:bg-white border-slate-200 shadow-sm hover:shadow-md'
                                                : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                                            }
                            `}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="relative">
                                            <img
                                                src={partner.avatarUrl || 'https://i.pravatar.cc/150'}
                                                alt={partner.name}
                                                className={`w-14 h-14 rounded-full object-cover border ${isLight ? 'border-slate-200' : 'border-white/10'}`}
                                            />
                                            {match.compatibilityScore && match.compatibilityScore > 85 && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-blue rounded-full flex items-center justify-center text-[8px] font-bold text-black border-2 border-black">
                                                    {match.compatibilityScore}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h3 className={`font-medium text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{partner.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-[12px] flex items-center gap-1 ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60'}`}>
                                                    <Heart size={10} className="fill-current" />
                                                    Match
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                                                {partner.bio || match.matchReason || 'Tap to start chatting!'}
                                            </p>
                                        </div>

                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-900' : 'bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black'}`}>
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                )
                            })}

                            {sortedMatches.length === 0 && !isLoadingMatches && (
                                <div className={`text-center mt-10 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                    <p>No matches yet.</p>
                                    <p className="text-xs mt-2">Keep swiping to find your training partners!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="space-y-4 animate-slide-up">
                    {requests.length === 0 ? (
                        <div className={`text-center mt-20 flex flex-col items-center ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                            <Calendar size={40} className="mb-4 opacity-50" />
                            <p>No activity requests.</p>
                            <p className="text-xs mt-2">Propose a workout from a user's profile!</p>
                        </div>
                    ) : (
                        requests.map((req, idx) => (
                            <GlassCard
                                key={req.id}
                                variant={isLight ? 'default' : 'dark-always'}
                                className={`p-5 relative overflow-hidden transition-all duration-500 ${req.status === 'accepted' ? 'border-neon-blue/50' : ''}`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Status Badge */}
                                {req.status === 'accepted' && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-neon-blue to-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
                                        <Check size={10} strokeWidth={3} /> ACCEPTED
                                    </div>
                                )}

                                <div className="flex gap-4 mb-5">
                                    <div className="relative">
                                        <img src={req.senderAvatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10" alt="" />
                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#121212] bg-neon-blue text-black`}>
                                            <Activity size={12} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-neon-blue'}`}>Request</span>
                                            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                            <span className="text-[10px] opacity-60">
                                                {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className={`text-lg font-display font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                            {req.sport} <span className="font-light opacity-70">with {req.senderName}</span>
                                        </h3>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className={`flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                        <Calendar size={14} className="text-neon-blue shrink-0" />
                                        <span className="truncate">{req.date}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                        <Clock size={14} className="text-neon-blue shrink-0" />
                                        <span className="truncate">{req.time}</span>
                                    </div>
                                    <div className={`col-span-2 flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                        <MapPin size={14} className="text-neon-blue shrink-0" />
                                        <span className="truncate">{req.location}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {req.status === 'pending' ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDeclineRequest(req.id)}
                                            className={`
                                        flex-1 h-12 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-all border
                                        ${isLight
                                                    ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}
                                    `}
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleAcceptRequest(req.id)}
                                            className={`
                                        flex-1 h-12 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 group
                                        bg-gradient-to-r from-neon-blue to-purple-600 text-white border-0
                                        hover:shadow-neon-blue/20 hover:scale-[1.02] active:scale-[0.98]
                                    `}
                                        >
                                            Accept <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                ) : (
                                    <GlassButton
                                        onClick={() => handleSetReminder(req)}
                                        className="w-full h-12 text-sm font-bold shadow-lg shadow-neon-blue/10 bg-white/5 border-white/10 hover:bg-white/10"
                                    >
                                        <Bell size={16} className="mr-2 text-neon-blue" /> Set Reminder
                                    </GlassButton>
                                )}
                            </GlassCard>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
