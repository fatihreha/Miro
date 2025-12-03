
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { MapPin, Edit2, Sparkles, Camera, Save, X, Settings, Activity, Target, Crown, ChevronRight, Share2, Zap, Briefcase, Calendar, Dumbbell, Navigation, Loader2 } from 'lucide-react';
import { enhanceBio } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { SportType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { userService } from '../services/userService';
import { compressImage } from '../utils/imageCompression';
import { notificationService } from '../services/notificationService';
import { locationService } from '../services/locationService';

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t, theme } = useTheme();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const isLight = theme === 'light';

    const [name, setName] = useState('');
    const [age, setAge] = useState<string | number>('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');
    const [interests, setInterests] = useState<SportType[]>([]);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [showInterestModal, setShowInterestModal] = useState(false);
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
            interests
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
        updateUser({
            name,
            age: Number(age),
            location,
            bio,
            interests
        });

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

    if (!user) return null;

    // Define specific Gold frame styling if Premium
    const profileFrameClass = user.isPremium
        ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 p-[3px] shadow-[0_0_30px_rgba(251,191,36,0.4)]'
        : (isLight ? 'bg-white shadow-xl p-1.5' : 'bg-black/40 border border-white/10 shadow-2xl p-1.5');

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
                        <div className={`w-28 h-28 rounded-full ${profileFrameClass}`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                            </div>
                        </div>

                        {isEditing && (
                            <>
                                <input
                                    type="file"
                                    id="photo-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={isUploadingPhoto}
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className={`absolute bottom-1 right-1 p-2 rounded-full shadow-lg cursor-pointer transition-transform ${isUploadingPhoto ? 'bg-amber-500 animate-pulse' : 'bg-neon-blue hover:scale-110'} text-black`}
                                >
                                    <Camera size={16} />
                                </label>
                            </>
                        )}

                        {!isEditing && (
                            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-md" />
                        )}

                        {/* Gold Badge Icon if Premium */}
                        {user.isPremium && !isEditing && (
                            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-white dark:border-black animate-pop">
                                <Crown size={14} className="text-white" fill="currentColor" />
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
                                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                isGettingLocation 
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
                        {user.level === 'Pro' && <Crown size={12} className="text-amber-400" />}
                        {user.level === 'Intermediate' && <Target size={12} className="text-blue-400" />}
                        {user.level === 'Beginner' && <Activity size={12} className="text-green-400" />}
                        {user.level} Level
                    </div>
                </GlassCard>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? 'bg-blue-50/50' : 'bg-blue-900/10'}`} onClick={() => navigate('/gamification')}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Matches</div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{userStats?.matches || user.userLevel || 0}</div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 ${isLight ? 'bg-purple-50/50' : 'bg-purple-900/10'}`}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>Workouts</div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{userStats?.workouts || (user.xp ? (user.xp > 1000 ? (user.xp / 1000).toFixed(1) + 'k' : user.xp) : 0)}</div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.02] transition-transform ${isLight ? 'bg-amber-50/50' : 'bg-amber-900/10'}`} onClick={() => navigate('/clubs')}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>Clubs</div>
                        <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{userStats?.clubs || user.badges?.length || 0}</div>
                    </GlassCard>
                </div>

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

                {/* Premium CTA (Hidden if editing or already premium) */}
                {!isEditing && !user.isPremium && (
                    <div onClick={() => navigate('/premium')} className="cursor-pointer group">
                        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/20">
                            <div className={`relative rounded-[23px] p-4 flex items-center justify-between ${isLight ? 'bg-white' : 'bg-black'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                        <Crown size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>SportPulse Gold</div>
                                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Unlock exclusive features</div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={`opacity-50 group-hover:translate-x-1 transition-transform ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* About Me Section */}
                <GlassCard className="p-5 relative group">
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
                                className={`text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all ${isEnhancing ? 'bg-amber-500 text-black' : (isLight ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30')}`}
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
                            className={`w-full h-24 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400' : 'bg-black/20 border border-white/10 text-white placeholder-white/20'}`}
                            placeholder="Tell us about your fitness journey..."
                        />
                    ) : (
                        <div className="relative">
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                {bio || <span className="opacity-50 italic">No bio yet. Tap edit to add one!</span>}
                            </p>
                            <div className={`absolute -left-5 top-0 bottom-0 w-1 ${isLight ? 'bg-blue-500/30' : 'bg-blue-500/50'} rounded-r-full`} />
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
