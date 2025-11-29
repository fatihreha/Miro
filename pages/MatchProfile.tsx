
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, MoreVertical, ShieldAlert, HeartOff, Sparkles, Activity, Zap } from 'lucide-react';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { User, SportType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';
import { ReportModal } from '../components/modals/ReportModal';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { userService } from '../services/userService';

// Fallback Mock Data removed

export const MatchProfile: React.FC = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { setTabBarVisible } = useLayout();

    const [user, setUser] = useState<User | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Explicitly hide Tab Bar on Mount, Restore on Unmount
    useEffect(() => {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    useEffect(() => {
        const loadUser = async () => {
            if (location.state?.user) {
                setUser(location.state.user);
            } else if (userId) {
                const fetchedUser = await userService.getUserById(userId);
                if (fetchedUser) {
                    setUser(fetchedUser);
                }
            }
        };
        loadUser();
    }, [userId, location.state]);

    const handleMessage = () => {
        hapticFeedback.success();
        navigate(`/chat/${user?.id}`);
    };

    const handleUnmatch = () => {
        if (window.confirm("Are you sure you want to unmatch?")) {
            hapticFeedback.medium();
            notificationService.showNotification("Unmatched", { body: `You have unmatched with ${user?.name}.` });
            navigate('/matches');
        }
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

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center bg-black text-white">
                <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black font-sans overflow-hidden">
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

                <div className="relative pointer-events-auto">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition active:scale-95 shadow-lg"
                    >
                        <MoreVertical size={24} />
                    </button>
                    {/* Dropdown */}
                    {showOptions && (
                        <div className="absolute right-0 top-14 w-48 bg-[#1e1e24]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up origin-top-right backdrop-blur-xl">
                            <button onClick={() => setIsReportModalOpen(true)} className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 transition-colors">
                                <ShieldAlert size={16} /> Report
                            </button>
                            <div className="h-px bg-white/5"></div>
                            <button onClick={handleUnmatch} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                                <HeartOff size={16} /> Unmatch
                            </button>
                        </div>
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
            <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex flex-col justify-end pb-safe-bottom">

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
                            <div className="mb-8 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-blue to-transparent rounded-full"></div>
                                <p className="pl-4 text-white/80 text-sm leading-relaxed font-light line-clamp-3">
                                    {user.bio}
                                </p>
                            </div>

                            {/* Primary Action Button */}
                            <button
                                onClick={handleMessage}
                                className="w-full h-16 rounded-[24px] bg-white text-black font-display font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
                                <span>Let's Train</span>
                            </button>
                        </div>

                        {/* Decorative bottom glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neon-blue/10 to-transparent opacity-50 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
