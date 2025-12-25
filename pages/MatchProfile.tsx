
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, MessageCircle, MapPin, MoreVertical, ShieldAlert, HeartOff, Sparkles, Activity, Zap,
    X, Heart, Star, ChevronRight, HelpCircle, Check, Flag, UserX, Share2, Send, Lock, MessageSquare
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { User, SportType, PhotoComment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';
import { ReportModal } from '../components/modals/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { userService } from '../services/userService';
import { matchService } from '../services/matchService';
import { chatService } from '../services/chatService';

// Fallback Mock Data removed

export const MatchProfile: React.FC = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { setTabBarVisible } = useLayout();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [user, setUser] = useState<User | null>(null);
    const [matchId, setMatchId] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // New features state
    const [showSuperEffect, setShowSuperEffect] = useState(false);
    const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | null>(null);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showAlgoInfo, setShowAlgoInfo] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [localComments, setLocalComments] = useState<PhotoComment[]>([]);

    const isFromLikes = location.state?.isFromLikes || false;
    const source = location.state?.source;
    const isDiscoveryMode = source === 'home';
    const tier = currentUser?.subscriptionTier || 'free';
    const canCommentAtAll = tier === 'gold' || tier === 'pro';

    // Match breakdown calculation
    const breakdown = useMemo(() => [
        { label: 'Sports Synergy', value: user?.matchPercentage ? Math.max(30, Math.floor(user.matchPercentage * 0.9)) : 85, color: 'bg-brand-lime' },
        { label: 'Skill Parity', value: user?.matchPercentage ? Math.max(30, Math.floor(user.matchPercentage * 0.85)) : 78, color: 'bg-blue-400' },
        { label: 'Schedule Sync', value: user?.matchPercentage ? Math.max(30, Math.floor(user.matchPercentage * 0.95)) : 92, color: 'bg-purple-500' },
        { label: 'Intensity Match', value: user?.matchPercentage ? Math.max(30, Math.floor(user.matchPercentage * 0.8)) : 70, color: 'bg-orange-500' }
    ], [user?.matchPercentage]);

    // Explicitly hide Tab Bar on Mount, Restore on Unmount
    useEffect(() => {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    useEffect(() => {
        const loadUser = async () => {
            if (location.state?.user) {
                setUser(location.state.user);
                setLocalComments(location.state.user.photoComments || []);
                if (location.state?.matchId) {
                    setMatchId(location.state.matchId);
                }
            } else if (userId) {
                const fetchedUser = await userService.getUserById(userId);
                if (fetchedUser) {
                    setUser(fetchedUser);
                    setLocalComments(fetchedUser.photoComments || []);
                }
            }
        };
        loadUser();
    }, [userId, location.state]);

    const handleMessage = () => {
        hapticFeedback.success();
        navigate(`/chat/${user?.id}`);
    };

    const handleUnmatch = async () => {
        if (window.confirm("Are you sure you want to unmatch?")) {
            hapticFeedback.medium();

            // Persist to database
            if (matchId) {
                try {
                    await matchService.unmatch(matchId);
                } catch (error) {
                    console.error('Error unmatching:', error);
                }
            }

            notificationService.showNotification("Unmatched", { body: `You have unmatched with ${user?.name}.` });
            navigate('/matches');
        }
    };

    const handleAction = async (type: 'left' | 'right' | 'up') => {
        if (exitDirection || !user || !currentUser) return;

        // RESTRICT SUPER LIKE FOR NON-PREMIUM
        if (type === 'up' && !currentUser?.isPremium) {
            hapticFeedback.error();
            navigate('/premium');
            return;
        }

        if (type === 'up') {
            hapticFeedback.success();
            setShowSuperEffect(true);

            // Persist super like to database
            try {
                if (currentUser) {
                    await matchService.swipeUser(currentUser.id, user.id, 'superlike');
                }
            } catch (error) {
                console.error('Error super liking:', error);
            }

            setTimeout(() => {
                setExitDirection('up');
                setTimeout(() => navigate('/', { state: { action: 'super', userId: user?.id, skipAnimation: true }, replace: true }), 400);
            }, 800);
            return;
        }

        hapticFeedback.medium();
        setExitDirection(type === 'right' ? 'right' : 'left');

        // Persist like/dislike to database
        try {
            if (currentUser) {
                await matchService.swipeUser(currentUser.id, user.id, type === 'right' ? 'like' : 'pass');
            }
        } catch (error) {
            console.error('Error swiping:', error);
        }

        setTimeout(() => navigate('/', { state: { action: type === 'right' ? 'like' : 'dislike', userId: user?.id }, replace: true }), 500);
    };

    const handleApproveLike = async () => {
        if (!user || !currentUser) return;
        hapticFeedback.success();
        setIsApproved(true);

        // Create match in database
        try {
            await matchService.createMatch(currentUser.id, user.id);
        } catch (error) {
            console.error('Error creating match:', error);
        }

        notificationService.showNotification("It's a Match!", { body: `You and ${user?.name} are now connected.` });
    };

    const handleDeclineLike = () => {
        hapticFeedback.medium();
        setExitDirection('left');
        setTimeout(() => navigate('/matches', { replace: true }), 400);
    };

    const handlePostComment = async (photoIndex: number) => {
        const text = commentInputs[photoIndex];
        if (!text?.trim() || !currentUser || !user) return;

        hapticFeedback.success();
        const newComment: PhotoComment = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            text,
            timestamp: new Date(),
            photoIndex
        };

        setLocalComments(prev => [...prev, newComment]);

        // Persist comment via chat service
        await chatService.sendMessage(
            currentUser.id,
            user.id,
            `Commented on your photo: "${text}"`,
            'photo_comment',
            { photoIndex, image: user.photos?.[photoIndex] }
        );

        setCommentInputs(prev => ({ ...prev, [photoIndex]: '' }));
    };

    const getPhotos = () => {
        if (user?.photos && user.photos.length > 0) return user.photos;
        return user?.avatarUrl ? [user.avatarUrl] : [];
    };

    const photos = getPhotos();

    const nextPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentPhotoIndex < photos.length - 1) {
            hapticFeedback.light();
            setCurrentPhotoIndex(prev => prev + 1);
        } else {
            hapticFeedback.error();
        }
    };

    const prevPhoto = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentPhotoIndex > 0) {
            hapticFeedback.light();
            setCurrentPhotoIndex(prev => prev - 1);
        } else {
            hapticFeedback.error();
        }
    };

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const width = e.currentTarget.offsetWidth;
        const x = e.nativeEvent.offsetX;
        if (x < width * 0.3) {
            prevPhoto();
        } else {
            nextPhoto();
        }
    };

    const renderCommentBox = (index: number) => {
        const myComment = localComments.find(c => c.senderId === currentUser?.id && c.photoIndex === index);
        const hasCommented = !!myComment;

        return (
            <GlassCard className={`p-4 relative overflow-hidden ${!canCommentAtAll ? 'grayscale-[0.5]' : ''}`}>
                {!canCommentAtAll && (
                    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[4px] flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-lime flex items-center justify-center text-black shadow-lg">
                            <Lock size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-white font-display text-sm uppercase tracking-wider">Unlock Interaction</p>
                            <button
                                onClick={() => navigate('/premium')}
                                className="text-brand-lime text-[10px] font-bold uppercase hover:underline"
                            >
                                Get Gold or Pro
                            </button>
                        </div>
                    </div>
                )}

                <div className={`flex flex-col gap-3 ${!canCommentAtAll ? 'opacity-30' : ''}`}>
                    <div className="flex justify-between items-center">
                        <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/40'
                            }`}>
                            <MessageSquare size={12} className="text-brand-indigo" />
                            {hasCommented ? 'Your Reaction' : 'Quick Reply'}
                        </h4>
                    </div>

                    {hasCommented ? (
                        <div className={`p-3 rounded-2xl border ${isLight
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                                : 'bg-brand-indigo/10 border-brand-indigo/20 text-indigo-100'
                            }`}>
                            <p className="text-sm italic font-medium">"{myComment.text}"</p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <GlassInput
                                placeholder="Leave a note..."
                                value={commentInputs[index] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [index]: e.target.value })}
                                className="!py-3 !text-sm !bg-white/5 border-white/10"
                                disabled={!canCommentAtAll}
                            />
                            <button
                                onClick={() => handlePostComment(index)}
                                disabled={!commentInputs[index]?.trim()}
                                className="w-12 h-12 rounded-2xl bg-brand-lime text-black flex items-center justify-center shadow-lg transition-transform active:scale-90 disabled:opacity-30"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>
        );
    };

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white">
                <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-50 font-sans overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${isLight ? 'bg-white' : 'bg-black'
            } ${exitDirection === 'left' ? '-translate-x-[120%] -rotate-[15deg] opacity-0' : ''} ${exitDirection === 'right' ? 'translate-x-[120%] rotate-[15deg] opacity-0' : ''
            } ${exitDirection === 'up' ? '-translate-y-[120%] scale-90 opacity-0' : ''}`}>

            {/* Report Modal */}
            {currentUser && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={user.id}
                    reportedUserName={user.name}
                    reporterId={currentUser.id}
                />
            )}

            {/* Super Like Effect */}
            {showSuperEffect && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-brand-indigo/40 animate-fade-in opacity-90 backdrop-blur-3xl" />
                    <div className="relative flex flex-col items-center animate-super-blast">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-brand-lime blur-[100px] opacity-60 animate-pulse" />
                            <div className="relative w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.8)] animate-kinetic-pulse">
                                <Star size={80} className="text-brand-indigo animate-star-spin" fill="currentColor" />
                            </div>
                        </div>
                        <h2 className="text-8xl font-display font-black text-white italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            SUPER
                        </h2>
                        <h2 className="text-7xl font-display font-black text-brand-lime tracking-widest -mt-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            LIKE
                        </h2>
                    </div>
                </div>
            )}

            {/* Match Breakdown Modal */}
            {showBreakdown && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in backdrop-blur-2xl bg-black/60">
                    <div className="absolute inset-0" onClick={() => { setShowBreakdown(false); setShowAlgoInfo(false); }} />
                    <GlassCard className="w-full max-w-sm relative z-10 p-6 animate-pop border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Zap size={18} className="text-brand-lime animate-pulse" fill="currentColor" />
                                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Match Intel</h3>
                            </div>
                            <button onClick={() => { setShowBreakdown(false); setShowAlgoInfo(false); }} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 mb-8">
                            {breakdown.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
                                        <span>{item.label}</span>
                                        <span className="text-white">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                            style={{ width: showBreakdown ? `${item.value}%` : '0%', transitionDelay: `${i * 100}ms` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            {showAlgoInfo && (
                                <div className="absolute bottom-full mb-3 left-0 right-0 p-4 rounded-2xl bg-brand-indigo border border-brand-indigo/50 shadow-2xl animate-slide-up text-xs leading-relaxed text-indigo-50 italic">
                                    <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-brand-indigo border-r border-b border-brand-indigo/50 rotate-45" />
                                    Our AI agent analyzes training history, skill level disparity, intensity preferences, and bio sentiment to calculate your true compatibility.
                                </div>
                            )}
                            <button
                                onClick={() => { hapticFeedback.light(); setShowAlgoInfo(!showAlgoInfo); }}
                                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${showAlgoInfo ? 'text-brand-lime' : 'text-white/40 hover:text-white'
                                    }`}
                            >
                                <HelpCircle size={14} /> How it works?
                            </button>
                        </div>

                        <GlassButton onClick={() => setShowBreakdown(false)} className="w-full mt-6 h-12 text-sm !bg-white !text-black border-0">
                            Back to Athlete
                        </GlassButton>
                    </GlassCard>
                </div>
            )}

            {/* --- PROGRESS BARS (STORY STYLE) --- */}
            <div className="absolute top-0 left-0 right-0 z-50 pt-safe-top px-2 flex gap-1.5 pointer-events-none mt-2">
                {photos.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden backdrop-blur-md">
                        <div
                            className={`h-full bg-white shadow-glow transition-all duration-300 ${idx === currentPhotoIndex ? 'opacity-100' : (idx < currentPhotoIndex ? 'opacity-100' : 'opacity-0')}`}
                        />
                    </div>
                ))}
            </div>

            {/* --- TOP NAVIGATION --- */}
            <div className="absolute top-0 left-0 right-0 z-40 pt-safe-top p-4 flex justify-between items-center pointer-events-none mt-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition active:scale-95 pointer-events-auto shadow-lg"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Match Percentage Badge */}
                {user.matchPercentage && (
                    <button
                        onClick={() => { hapticFeedback.medium(); setShowBreakdown(true); }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-brand-lime/40 shadow-[0_0_20px_rgba(222,255,144,0.25)] active:scale-95 transition-transform group pointer-events-auto"
                    >
                        <Zap size={14} className="text-brand-lime animate-pulse" fill="currentColor" />
                        <span className="text-brand-lime font-display font-bold text-lg leading-none pt-0.5">
                            {user.matchPercentage}% Match
                        </span>
                        <ChevronRight size={14} className="text-brand-lime/40 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                <div className="relative pointer-events-auto">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition active:scale-95 shadow-lg"
                    >
                        <MoreVertical size={24} />
                    </button>

                    {/* Enhanced Dropdown Menu */}
                    {showOptions && (
                        <>
                            <div className="absolute right-0 top-14 w-48 bg-[#1e1e24]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up origin-top-right backdrop-blur-xl">
                                <button
                                    onClick={() => { setIsReportModalOpen(true); setShowOptions(false); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                    <Flag size={16} /> Report User
                                </button>
                                <button
                                    onClick={() => {
                                        hapticFeedback.heavy();
                                        notificationService.showNotification("User Blocked", { body: "You will no longer see this athlete." });
                                        setShowOptions(false);
                                        navigate(-1);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                    <UserX size={16} /> Block User
                                </button>
                                <div className="h-px bg-white/5"></div>
                                <button
                                    onClick={handleUnmatch}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                    <HeartOff size={16} /> Unmatch
                                </button>
                                <div className="h-px bg-white/5"></div>
                                <button
                                    onClick={() => {
                                        hapticFeedback.light();
                                        setShowOptions(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                    <Share2 size={16} /> Share Profile
                                </button>
                            </div>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowOptions(false)} />
                        </>
                    )}
                </div>
            </div>

            {/* --- MAIN IMAGE LAYER --- */}
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={handleTap}>
                {photos.map((photo, idx) => (
                    <img
                        key={idx}
                        src={photo}
                        alt={`${user.name}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === currentPhotoIndex ? 'opacity-100' : 'opacity-0'}`}
                    />
                ))}

                {/* Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
            </div>

            {/* --- CONTENT SHEET (BOTTOM) --- */}
            <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex flex-col justify-end pb-safe-bottom max-h-[75vh] overflow-y-auto">

                <div className="w-full pointer-events-auto px-4 pb-4">
                    {/* Compatibility Badge */}
                    {user.matchPercentage && (
                        <div className="mb-4 flex justify-start animate-slide-up">
                            <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-neon-blue/40 shadow-[0_0_20px_rgba(0,242,255,0.2)] flex items-center gap-2">
                                <Sparkles size={16} className="text-neon-blue animate-pulse" fill="currentColor" />
                                <span className="text-neon-blue font-bold text-sm tracking-wide">{user.matchPercentage}% Match</span>
                            </div>
                        </div>
                    )}

                    {/* Glass Info Sheet */}
                    <div className="relative rounded-[40px] bg-white/[0.07] backdrop-blur-[40px] border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                        {/* Inner content */}
                        <div className="p-6 sm:p-8 relative z-10">

                            {/* Header Info */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h1 className="text-4xl font-display font-black text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                                        {user.name}, <span className="font-light opacity-70">{user.age}</span>
                                    </h1>
                                    <div className="flex items-center gap-3 text-white/70 text-sm font-medium">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-neon-blue" /> {user.location}
                                        </div>
                                        {user.distance && (
                                            <>
                                                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                                                <span>{user.distance} away</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Level Badge */}
                                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md shadow-inner">
                                    <Activity size={18} className={user.level === 'Pro' ? 'text-amber-400' : 'text-white'} />
                                    <span className="text-[8px] font-bold uppercase mt-1 text-white/80">{user.level}</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 my-6">
                                {user.interests.map(sport => (
                                    <span key={sport} className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                                        {sport}
                                    </span>
                                ))}
                            </div>

                            {/* Bio Snippet */}
                            <div className="mb-6 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-blue to-transparent rounded-full"></div>
                                <p className="pl-4 text-white/80 text-sm leading-relaxed font-light">
                                    {user.bio}
                                </p>
                            </div>

                            {/* Photo Comments for displayed photo */}
                            {photos.length > 0 && (
                                <div className="mb-6">
                                    {renderCommentBox(currentPhotoIndex)}
                                </div>
                            )}

                            {/* Additional Photos with Comments */}
                            {photos.length > 1 && (
                                <div className="mb-8 space-y-6">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
                                        <Sparkles size={14} className="text-brand-lime" />
                                        More Photos
                                    </div>
                                    {photos.slice(1).map((photo, idx) => {
                                        const photoIndex = idx + 1;
                                        return (
                                            <div key={photoIndex} className="space-y-4">
                                                <div className="w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                                                    <img src={photo} className="w-full h-full object-cover" alt={`${user.name} photo ${photoIndex + 1}`} />
                                                </div>
                                                {renderCommentBox(photoIndex)}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Primary Action Buttons - Conditional based on mode */}
                            {isFromLikes && !isApproved ? (
                                <div className="flex gap-4 animate-slide-up">
                                    <button
                                        onClick={handleDeclineLike}
                                        className={`flex-1 h-16 rounded-[24px] border flex items-center justify-center gap-2 font-bold uppercase text-xs transition-all active:scale-95 ${isLight
                                                ? 'bg-white border-slate-200 text-red-500 shadow-sm'
                                                : 'bg-white/5 border-white/10 text-red-400'
                                            }`}
                                    >
                                        <X size={20} strokeWidth={2.5} /> Pass
                                    </button>
                                    <button
                                        onClick={handleApproveLike}
                                        className="flex-[2] h-16 rounded-[24px] flex items-center justify-center gap-2 font-display font-bold text-lg uppercase shadow-xl transition-all active:scale-95 bg-brand-lime text-black shadow-brand-lime/20"
                                    >
                                        <Check size={24} strokeWidth={3} /> Approve
                                    </button>
                                </div>
                            ) : (isDiscoveryMode && !isApproved) ? (
                                <div className="flex items-center justify-between gap-4">
                                    <button
                                        onClick={() => handleAction('left')}
                                        className={`flex-1 aspect-square max-h-16 rounded-[24px] border flex items-center justify-center active:scale-90 transition-all ${isLight
                                                ? 'bg-white border-slate-200 text-red-500 shadow-sm'
                                                : 'bg-white/5 border-white/10 text-red-400'
                                            }`}
                                    >
                                        <X size={28} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleAction('up')}
                                        className={`flex-1 aspect-square max-h-20 -mt-2 rounded-[28px] border flex items-center justify-center active:scale-90 transition-all ${isLight
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                                : 'bg-brand-indigo border-brand-indigo text-white shadow-[0_0_25px_rgba(75,41,255,0.4)]'
                                            }`}
                                    >
                                        <Star size={32} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={() => handleAction('right')}
                                        className={`flex-1 aspect-square max-h-16 rounded-[24px] flex items-center justify-center active:scale-90 transition-all ${isLight
                                                ? 'bg-slate-900 text-brand-lime shadow-lg shadow-slate-200'
                                                : 'bg-brand-lime text-black shadow-[0_0_25px_rgba(222,255,144,0.3)]'
                                            }`}
                                    >
                                        <Heart size={32} fill="currentColor" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleMessage}
                                    className="w-full h-16 rounded-[24px] bg-white text-black font-display font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                >
                                    <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
                                    <span>Let's Train</span>
                                </button>
                            )}
                        </div>

                        {/* Decorative bottom glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neon-blue/10 to-transparent opacity-50 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
