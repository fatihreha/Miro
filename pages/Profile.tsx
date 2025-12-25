
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { MapPin, Edit2, Sparkles, Camera, Save, X, Settings, Activity, Target, Crown, ChevronRight, Share2, Zap, Briefcase, Calendar, Dumbbell, Navigation, Loader2, Utensils, Clock, Home, Info, Image as ImageIcon, Flame, Fingerprint, Star, UserPlus, ArrowRight } from 'lucide-react';
import { enhanceBio } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { SportType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { userService } from '../services/userService';
import { compressImage } from '../utils/imageCompression';
import { notificationService } from '../services/notificationService';
import { locationService } from '../services/locationService';
import { PhotoManager } from './PhotoManager';
import { useGamification } from '../context/GamificationContext';

const DIET_OPTIONS = [
    'Flexible', 'High Protein', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Fasting'
];

const SUPPLEMENT_OPTIONS = [
    'Whey Protein', 'Creatine', 'BCAA', 'Pre-Workout',
    'Multivitamins', 'Omega-3', 'Casein', 'Magnesium',
    'Collagen', 'Glutamine', 'None / Natural'
];

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { xp, level, streak } = useGamification();
    const { t, theme } = useTheme();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const isLight = theme === 'light';

    const [name, setName] = useState('');
    const [age, setAge] = useState<string | number>('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [interests, setInterests] = useState<SportType[]>([]);

    const [gender, setGender] = useState<any>('');
    const [fitnessGoal, setFitnessGoal] = useState<any>('');
    const [workoutTime, setWorkoutTime] = useState<any>('');
    const [diet, setDiet] = useState('');
    const [workoutEnvironment, setWorkoutEnvironment] = useState<string[]>([]);
    const [supplements, setSupplements] = useState<string[]>([]);
    const [funFact, setFunFact] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [showPhotoManager, setShowPhotoManager] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [userStats, setUserStats] = useState<any>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationCoords, setLocationCoords] = useState<{ latitude?: number; longitude?: number }>({});

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAge(user.age || '');
            setLocation(user.location || '');
            setBio(user.bio || '');
            setInterests(user.interests || []);
            setGender(user.gender || '');
            setFitnessGoal(user.fitnessGoal || '');
            setWorkoutTime(user.workoutTimePreference || '');
            setDiet(user.diet || '');
            setWorkoutEnvironment(user.workoutEnvironment || []);
            setSupplements(user.supplements || []);
            setFunFact(user.funFact || '');
            setPhotos(user.photos || (user.avatarUrl ? [user.avatarUrl] : []));

            // Load user stats
            userService.getUserStats(user.id).then(stats => setUserStats(stats));
        }
    }, [user]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;

        setIsUploadingPhoto(true);
        hapticFeedback.light();

        try {
            const file = e.target.files[0];
            const compressed = await compressImage(file);
            const url = await userService.uploadPhoto(user.id, compressed);

            if (url) {
                await updateUser({ avatarUrl: url });
                hapticFeedback.success();
                notificationService.showNotification("Photo Updated!", { body: "Your profile photo has been updated." });
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            hapticFeedback.error();
            notificationService.showNotification("Upload Failed", { body: "Could not upload photo. Try again." });
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        hapticFeedback.success();

        // Prepare update data
        const updateData: any = {
            name,
            age: Number(age),
            location,
            bio,
            interests,
            gender,
            fitnessGoal,
            workoutTimePreference: workoutTime,
            diet,
            workoutEnvironment,
            supplements,
            funFact,
            photos,
            avatarUrl: photos[0]
        };

        // Add coordinates if updated
        if (locationCoords.latitude && locationCoords.longitude) {
            updateData.latitude = locationCoords.latitude;
            updateData.longitude = locationCoords.longitude;
            updateData.location_updated_at = new Date().toISOString();
        }

        // Update via userService for better sync
        await userService.updateProfile(user.id, updateData);

        // Also update local auth context
        updateUser(updateData);

        setIsEditing(false);
        notificationService.showNotification("Profil Güncellendi!", { body: "Değişiklikler kaydedildi." });
    };

    const handleCancel = () => {
        hapticFeedback.medium();
        if (user) {
            setName(user.name);
            setAge(user.age);
            setLocation(user.location);
            setBio(user.bio);
            setInterests(user.interests || []);
            setGender(user.gender || '');
            setFitnessGoal(user.fitnessGoal || '');
            setWorkoutTime(user.workoutTimePreference || '');
            setDiet(user.diet || '');
            setWorkoutEnvironment(user.workoutEnvironment || []);
            setSupplements(user.supplements || []);
            setFunFact(user.funFact || '');
        }
        setIsEditing(false);
    };

    const handleEnhanceBio = async () => {
        if (!user) return;
        hapticFeedback.light();
        setIsEnhancing(true);

        const newBio = await enhanceBio(bio, interests);

        setBio(newBio);
        setIsEnhancing(false);
        hapticFeedback.success();
    };

    const handleGetLocation = async () => {
        setIsGettingLocation(true);
        hapticFeedback.medium();

        try {
            const locationData = await locationService.getCurrentLocationWithCity();

            setLocation(locationData.cityName);
            setLocationCoords({
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });

            hapticFeedback.success();
            notificationService.showNotification("Konum Güncellendi!", { body: locationData.cityName });
        } catch (error: any) {
            console.error('Location error:', error);
            hapticFeedback.error();
            notificationService.showNotification("Konum Hatası", { body: error.message || "Konum alınamadı" });
        } finally {
            setIsGettingLocation(false);
        }
    };

    const toggleInterest = (sport: SportType) => {
        hapticFeedback.light();
        if (interests.includes(sport)) {
            setInterests(interests.filter(i => i !== sport));
        } else {
            setInterests([...interests, sport]);
        }
    };

    const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], item: string) => {
        hapticFeedback.light();
        if (current.includes(item)) {
            setter(current.filter(i => i !== item));
        } else {
            setter([...current, item]);
        }
    };

    const handleRateApp = () => {
        if (user?.hasRatedApp) {
            notificationService.showNotification("Already Rated", { body: "You have already claimed this reward." });
            return;
        }
        hapticFeedback.success();
        updateUser({ isPremium: true, hasRatedApp: true });
        notificationService.showNotification("Gold Unlocked!", { body: "Enjoy 1 day of premium access." });
    };

    const handleInviteFriend = async () => {
        hapticFeedback.medium();
        const shareUrl = 'https://bind.app';
        const shareData = { title: 'Bind', text: 'Find your perfect training partner on Bind!', url: shareUrl };
        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                updateUser({ isPremium: true });
                notificationService.showNotification("Referral Sent", { body: "You get 3 days Gold when they join!" });
            } else { throw new Error("Share not supported"); }
        } catch (err) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                notificationService.showNotification("Link Copied", { body: "Share link to earn rewards." });
            } catch (e) { console.error("Clipboard failed"); }
        }
    };

    // Show loading spinner provided by AuthContext or if still initializing
    const { isLoading, logout } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-neon-blue" size={48} />
            </div>
        );
    }

    // If not loading but user is still null, we have an error state
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <Activity size={32} className="text-red-500" />
                </div>
                <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Profile Error</h2>
                <p className={`text-sm mb-6 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    We couldn't load your profile data. Please try logging in again.
                </p>
                <GlassButton onClick={() => logout()} className="min-w-[120px]">
                    Sign Out
                </GlassButton>
            </div>
        );
    }

    // Define specific Gold frame styling if Premium
    const profileFrameClass = user.isPremium
        ? 'bg-gradient-to-tr from-brand-indigo via-white to-brand-lime p-[3px] shadow-[0_0_30px_rgba(75,41,255,0.4)]'
        : (isLight ? 'bg-white shadow-xl p-1.5 border border-slate-100' : 'bg-black/40 border border-white/10 shadow-2xl p-1.5');

    return (
        <div className="min-h-full pb-32 relative">
            {/* Top Navigation */}
            <div className="px-6 pt-6 flex justify-between items-center mb-4 relative z-20">
                <h2 className={`text-3xl font-display font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('my_profile')}</h2>
                <div className="flex gap-3">
                    {!isEditing && (
                        <button
                            onClick={() => navigate('/settings')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border ${isLight ? 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Settings size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border ${isLight ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : 'bg-white border-white text-black hover:bg-gray-200'}`}
                    >
                        {isEditing ? <X size={20} /> : <Edit2 size={18} />}
                    </button>
                </div>
            </div>

            <div className="px-6 space-y-5 animate-slide-up">

                {/* Main Identity Card */}
                <GlassCard className={`p-6 flex flex-col items-center relative overflow-hidden ${isLight ? 'bg-white/80' : ''}`}>
                    {/* Decor */}
                    <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${isLight ? 'from-blue-100/50' : 'from-blue-500/10'} to-transparent pointer-events-none`} />

                    {/* Avatar with Gold Frame Logic */}
                    <div className="relative mb-4 z-10">
                        <div
                            className={`w-28 h-28 rounded-full ${profileFrameClass} ${isEditing || photos.length > 1 ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (isEditing) {
                                    setShowPhotoManager(true);
                                } else if (photos.length > 1) {
                                    navigate('/photo-gallery', { state: { photos, initialIndex: 0 } });
                                }
                            }}
                        >
                            <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                <img src={photos[0] || user.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                        </div>

                        {/* Photo Count Badge */}
                        {photos.length > 1 && !isEditing && (
                            <div className="absolute bottom-0 left-0 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[10px] text-white rounded-full border border-white/20">
                                {photos.length} fotoğraf
                            </div>
                        )}

                        {isEditing && (
                            <button
                                onClick={() => setShowPhotoManager(true)}
                                className="absolute bottom-1 right-1 p-2 rounded-full shadow-lg cursor-pointer transition-transform bg-neon-blue hover:scale-110 text-black"
                            >
                                <Camera size={16} />
                            </button>
                        )}

                        {!isEditing && (
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-md" />
                        )}

                        {/* Gold Badge Icon if Premium */}
                        {user.isPremium && !isEditing && (
                            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-lime flex items-center justify-center shadow-[0_0_15px_rgba(222,255,144,0.5)] border-2 border-white dark:border-black animate-pop text-black">
                                <Crown size={14} fill="currentColor" strokeWidth={2.5} />
                            </div>
                        )}
                    </div>

                    {/* Name & Location */}
                    <div className="text-center w-full z-10">
                        {isEditing ? (
                            <div className="space-y-2 w-full max-w-xs mx-auto">
                                <GlassInput value={name} onChange={(e) => setName(e.target.value)} className="text-center text-lg font-bold !py-2" placeholder="Name" />
                                <div className="flex gap-2 justify-center">
                                    <GlassInput value={age} onChange={(e) => setAge(e.target.value)} className="text-center w-20 !py-2" placeholder="Age" type="number" />
                                    <div className="flex-1 flex gap-1">
                                        <GlassInput value={location} onChange={(e) => { setLocation(e.target.value); setLocationCoords({}); }} className="text-center flex-1 !py-2" placeholder="Location" />
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={isGettingLocation}
                                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isGettingLocation
                                                    ? 'bg-neon-blue/20 cursor-wait'
                                                    : 'bg-neon-blue hover:bg-neon-blue/80 active:scale-95'
                                                }`}
                                            title="Konumumu Kullan"
                                        >
                                            {isGettingLocation ? (
                                                <Loader2 size={16} className="text-neon-blue animate-spin" />
                                            ) : (
                                                <Navigation size={16} className="text-black" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className={`text-2xl font-bold mb-1 flex items-center justify-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {user.name}, <span className="font-light opacity-60">{user.age}</span>
                                </h1>
                                <div className={`flex items-center justify-center gap-1 text-sm font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                    <MapPin size={14} /> {user.location}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Level Badge Pill */}
                    <div className={`mt-4 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white/80'}`}>
                        {user.level === 'Pro' && <Crown size={12} className="text-brand-lime" />}
                        {user.level === 'Intermediate' && <Target size={12} className="text-brand-indigo" />}
                        {user.level === 'Beginner' && <Activity size={12} className="text-white/60" />}
                        {user.level} Level
                    </div>
                </GlassCard>

                {/* Premium Upsell Banner */}
                {!user.isPremium && !isEditing && (
                    <div
                        className="relative rounded-[24px] p-4 overflow-hidden shadow-xl cursor-pointer group animate-slide-up"
                        onClick={() => navigate('/premium')}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r ${isLight ? 'from-amber-400 to-orange-500' : 'from-brand-lime to-emerald-600'}`}></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-[shimmer_3s_infinite]"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Crown size={20} className="text-white" fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-display font-black text-white leading-none">Get Gold</h3>
                                    <p className="text-[10px] text-white/80 font-bold uppercase tracking-wide">Unlimited Swipes & More</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Reward Actions Row */}
                {!user.isPremium && !isEditing && (
                    <div className="flex gap-3 animate-slide-up">
                        <div
                            className={`flex-1 relative rounded-[24px] p-4 overflow-hidden shadow-lg cursor-pointer group transition-transform active:scale-95 ${user.hasRatedApp ? 'opacity-50 grayscale' : ''}`}
                            onClick={handleRateApp}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600`}></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-[shimmer_3s_infinite]"></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 mb-2">
                                    <Star size={18} className="text-white" fill="currentColor" />
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-white">Rate Us</div>
                                <div className="text-[9px] mt-0.5 text-white/80">{user.hasRatedApp ? 'Claimed' : '+1 Day Gold'}</div>
                            </div>
                        </div>
                        <div
                            className="flex-1 relative rounded-[24px] p-4 overflow-hidden shadow-lg cursor-pointer group transition-transform active:scale-95"
                            onClick={handleInviteFriend}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-brand-lime to-emerald-600`}></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-[shimmer_3s_infinite]" style={{ animationDelay: '1.5s' }}></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 mb-2">
                                    <UserPlus size={18} className="text-white" />
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-white">Invite</div>
                                <div className="text-[9px] mt-0.5 text-white/80">+3 Days Gold</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-brand-indigo/10 border-brand-indigo/20'}`} onClick={() => navigate('/gamification')}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-brand-indigo'}`}>Level</div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{level}</div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? 'bg-orange-50/80 border-orange-200' : 'bg-white/5 border-white/10'}`} onClick={() => navigate('/gamification')}>
                        {streak > 0 && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                        <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-orange-600' : 'text-white/60'}`}>
                            Streak <Flame size={12} fill="currentColor" />
                        </div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {streak} <span className="text-xs font-normal opacity-50">days</span>
                        </div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? 'bg-green-50/80 border-green-200' : 'bg-brand-lime/10 border-brand-lime/20'}`} onClick={() => navigate('/gamification')}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-green-600' : 'text-brand-lime'}`}>XP</div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{xp > 1000 ? (xp / 1000).toFixed(1) + 'k' : xp}</div>
                    </GlassCard>
                </div>

                {/* AI Persona Display */}
                {user.aiPersona && !isEditing && (
                    <div className="relative animate-slide-up group">
                        <GlassCard className={`p-6 relative overflow-hidden border-2 ${isLight ? 'bg-white border-indigo-100 shadow-xl' : 'bg-black border-white/10 shadow-2xl'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${isLight ? 'from-indigo-50 via-white to-purple-50' : 'from-[#1a1b4b] via-black to-black'} opacity-80 z-0`}></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay z-0"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-indigo/20 text-brand-indigo'}`}>
                                            <Fingerprint size={16} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-indigo-600' : 'text-brand-indigo'}`}>AI Analysis</span>
                                    </div>
                                    <Sparkles size={16} className={`${isLight ? 'text-purple-400' : 'text-purple-500'} animate-pulse`} />
                                </div>
                                <h3 className={`text-3xl font-display font-black leading-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    {user.aiPersona}
                                </h3>
                                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                    "{user.aiSummary || 'Analysis complete. Verified athlete profile.'}"
                                </p>
                            </div>
                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${isLight ? 'from-indigo-400 via-purple-400 to-indigo-400' : 'from-brand-indigo via-purple-600 to-brand-indigo'} opacity-50`}></div>
                        </GlassCard>
                    </div>
                )}

                {/* My Sessions Link (New Feature) */}
                {!isEditing && (
                    <div onClick={() => navigate('/bookings')} className="cursor-pointer group">
                        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                            <div className={`relative rounded-[23px] p-4 flex items-center justify-between ${isLight ? 'bg-white' : 'bg-black'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <Calendar size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>My Sessions</div>
                                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>View trainer bookings & classes</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={`opacity-50 group-hover:translate-x-1 transition-transform ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Preferences Display (View Mode) */}
                {!isEditing && (
                    <div className="grid grid-cols-2 gap-3">
                        <GlassCard className={`p-4 flex flex-col justify-center ${isLight ? 'bg-white/80' : 'bg-[#18181b]/80'}`}>
                            <div className="flex items-center gap-2 mb-1 opacity-60">
                                <Target size={14} className={isLight ? "text-slate-900" : "text-white"} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Goal</span>
                            </div>
                            <span className={`text-sm font-bold capitalize ${isLight ? 'text-slate-900' : 'text-white'}`}>{fitnessGoal || 'General'}</span>
                        </GlassCard>
                        <GlassCard className={`p-4 flex flex-col justify-center ${isLight ? 'bg-white/80' : 'bg-[#18181b]/80'}`}>
                            <div className="flex items-center gap-2 mb-1 opacity-60">
                                <Clock size={14} className={isLight ? "text-slate-900" : "text-white"} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Time</span>
                            </div>
                            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{workoutTime || 'Anytime'}</span>
                        </GlassCard>
                    </div>
                )}

                {/* Preferences Editing Section */}
                {isEditing && (
                    <GlassCard className="p-5 space-y-6">
                        <h3 className={`text-sm font-bold uppercase tracking-wide ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Preferences</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Gender</label>
                                <div className="relative">
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full rounded-[24px] px-4 py-3 text-sm appearance-none outline-none border focus:ring-1 focus:ring-neon-blue/50 cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                                </div>
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Goal</label>
                                <div className="relative">
                                    <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} className={`w-full rounded-[24px] px-4 py-3 text-sm appearance-none outline-none border focus:ring-1 focus:ring-neon-blue/50 cursor-pointer ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}>
                                        <option value="social">Social</option>
                                        <option value="competitive">Competitive</option>
                                        <option value="fun">Just Fun</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={`text-[10px] font-bold uppercase tracking-wider mb-3 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Environment</label>
                            <div className="flex flex-wrap gap-2">
                                {['Gym', 'Outdoors', 'Home', 'Studio'].map(env => (
                                    <GlassSelectable key={env} selected={workoutEnvironment.includes(env)} onClick={() => toggleArrayItem(setWorkoutEnvironment, workoutEnvironment, env)} className="!py-2 !px-4 !text-xs rounded-[16px]">
                                        {env}
                                    </GlassSelectable>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Fun Fact</label>
                            <textarea
                                value={funFact}
                                onChange={(e) => setFunFact(e.target.value)}
                                className={`w-full rounded-[24px] p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-neon-blue/50 ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-black/20 border border-white/10 text-white placeholder-white/30'}`}
                                rows={2}
                                placeholder="I once ran a marathon..."
                            />
                        </div>
                    </GlassCard>
                )}

                {/* Become Pro CTA */}
                {!isEditing && !user.isTrainer && (
                    <div onClick={() => navigate('/become-pro')} className="cursor-pointer group">
                        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                            <div className={`relative rounded-[23px] p-4 flex items-center justify-between ${isLight ? 'bg-white' : 'bg-black'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <Briefcase size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Become a Pro</div>
                                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Get verified, earn money & find clients</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={`opacity-50 group-hover:translate-x-1 transition-transform ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* About Me Section */}
                <GlassCard className="p-5 relative group mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white'}`}>
                                <Share2 size={14} />
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-wide ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Bio</span>
                        </div>
                        {(isEditing || bio) && (
                            <button
                                onClick={handleEnhanceBio}
                                disabled={isEnhancing}
                                className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all ${isEnhancing ? 'bg-brand-lime text-black' : (isLight ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo/30')}`}
                            >
                                <Sparkles size={10} className={isEnhancing ? "animate-spin" : ""} />
                                {isEnhancing ? 'Magic...' : 'Enhance'}
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className={`w-full h-24 rounded-[24px] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 transition-all ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-black/20 border border-white/10 text-white placeholder-white/20'}`}
                            placeholder="Tell us about your fitness journey..."
                        />
                    ) : (
                        <div className="relative">
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                {bio || <span className="opacity-50 italic">No bio yet. Tap edit to add one!</span>}
                            </p>
                            <div className={`absolute -left-5 top-0 bottom-0 w-1 ${isLight ? 'bg-blue-500/30' : 'bg-brand-indigo/50'} rounded-r-full`} />
                        </div>
                    )}
                </GlassCard>

                {/* Interests Section */}
                <GlassCard className="p-5">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white'}`}>
                                <Zap size={14} />
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-wide ${isLight ? 'text-slate-700' : 'text-white/80'}`}>Interests</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {interests.map(item => (
                            <div
                                key={item}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${isLight ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-white/5 border-white/10 text-white/90'}`}
                            >
                                {item}
                                {isEditing && (
                                    <button onClick={() => toggleInterest(item as SportType)}>
                                        <X size={12} className="opacity-50 hover:opacity-100" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {interests.length === 0 && !isEditing && (
                            <span className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                                Add interests to find better matches.
                            </span>
                        )}
                    </div>

                    {isEditing && (
                        <div className="mt-4 pt-4 border-t border-dashed border-white/10">
                            <button
                                onClick={() => setShowInterestModal(true)}
                                className={`w-full py-2 rounded-xl text-xs font-bold border border-dashed transition-colors ${isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-50' : 'border-white/20 text-white/40 hover:bg-white/5'}`}
                            >
                                + Select Sports
                            </button>
                        </div>
                    )}
                </GlassCard>

                {/* Save Action Floating Button (Only in Edit Mode) */}
                {isEditing && (
                    <div className="sticky bottom-24 z-30 animate-slide-up">
                        <GlassButton onClick={handleSave} className="w-full shadow-2xl shadow-blue-500/20">
                            <Save size={18} className="mr-2" /> Save Changes
                        </GlassButton>
                    </div>
                )}

                {/* Photo Manager Modal */}
                {showPhotoManager && user && (
                    <PhotoManager
                        userId={user.id}
                        photos={photos}
                        onPhotosChange={async (newPhotos) => {
                            setPhotos(newPhotos);
                            await userService.updatePhotos(user.id, newPhotos);
                            updateUser({ photos: newPhotos, avatarUrl: newPhotos[0] || '' });
                        }}
                        onClose={() => setShowPhotoManager(false)}
                    />
                )}

                {/* Manage Interests Modal */}
                {showInterestModal && (
                    <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 animate-fade-in backdrop-blur-md ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
                        <div className="absolute inset-0" onClick={() => setShowInterestModal(false)} />
                        <GlassCard className={`w-full max-w-md p-6 relative z-10 animate-slide-up rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
                            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Select Sports</h3>
                                <button onClick={() => setShowInterestModal(false)}><X size={24} /></button>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center mb-8 overflow-y-auto flex-1">
                                {Object.values(SportType).map((sport) => (
                                    <GlassSelectable
                                        key={sport}
                                        selected={interests.includes(sport)}
                                        onClick={() => toggleInterest(sport)}
                                        className="!py-2.5 !px-5 !text-sm flex-grow text-center"
                                    >
                                        {sport}
                                    </GlassSelectable>
                                ))}
                            </div>
                            <GlassButton onClick={() => setShowInterestModal(false)} className="w-full flex-shrink-0">
                                Done
                            </GlassButton>
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
};
