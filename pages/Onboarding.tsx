
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { SportType, User } from '../types';
import {
  ChevronRight, ChevronLeft, ArrowRight, Check, MapPin, Crosshair, Camera, Plus, Trash2,
  Utensils, Pill, Sun, Home, Building2, Dumbbell, Clock, Coffee, Moon, Sparkles, Shuffle,
  Beef, Carrot, Leaf, Egg, Bone, Timer, Pizza, Zap, Smartphone, CheckCircle2, Loader2, AlertCircle, Navigation, User as UserIcon,
  Target, Edit3, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/hapticService';
import { useTheme } from '../context/ThemeContext';
import { analyzeProfile } from '../services/geminiService';
import { userService } from '../services/userService';
import { locationService } from '../services/locationService';
import { storageHelpers } from '../services/supabase';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// User location marker icon
const userLocationIcon = L.divIcon({
  html: `<div style="position: relative; width: 24px; height: 24px;">
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      background: rgba(0, 242, 255, 0.3);
      border-radius: 50%;
      animation: pulse 2s infinite;
    "></div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      background: #00f2ff;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(0, 242, 255, 0.8);
      z-index: 2;
    "></div>
  </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Map controller component to handle center updates
const MapController: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);

  return null;
};

const TOTAL_INPUT_STEPS = 13;

const DIET_OPTIONS = [
  { id: 'Flexible', label: 'Flexible', icon: Pizza },
  { id: 'High Protein', label: 'High Protein', icon: Beef },
  { id: 'Vegetarian', label: 'Vegetarian', icon: Carrot },
  { id: 'Vegan', label: 'Vegan', icon: Leaf },
  { id: 'Keto', label: 'Keto', icon: Egg },
  { id: 'Paleo', label: 'Paleo', icon: Bone },
  { id: 'Intermittent Fasting', label: 'Fasting', icon: Timer }
];

const SUPPLEMENT_OPTIONS = [
  'Whey Protein', 'Creatine', 'BCAA', 'Pre-Workout',
  'Multivitamins', 'Omega-3', 'Casein', 'Magnesium',
  'Collagen', 'Glutamine', 'None / Natural'
];

const FUN_FACT_PROMPTS = [
  "I once ran a marathon in...",
  "My favorite cheat meal is...",
  "I can hold a plank for...",
  "I listen to ___ while lifting.",
  "I played ___ in high school.",
  "My fitness goal this year is...",
  "I refuse to train without my...",
  "Best advice I ever received:"
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [funFactPrompt, setFunFactPrompt] = useState(FUN_FACT_PROMPTS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialData = location.state?.initialData || {};

  const [formData, setFormData] = useState<Partial<User> & {
    wantsPro?: boolean;
    latitude?: number;
    longitude?: number;
    goal?: string;
    diet?: string;
    supplements?: string[];
    funFact?: string;
    widgetStyle?: string;
    photos?: string[];
    workoutEnvironment?: string[];
  }>({
    name: initialData.name || '',
    age: '' as any,
    gender: undefined,
    location: '',
    interests: [],
    level: 'Beginner',
    bio: '',
    workoutTimePreference: 'Any',
    avatarUrl: `https://i.pravatar.cc/400?u=${Math.floor(Math.random() * 1000)}`,
    wantsPro: false,
    latitude: undefined,
    longitude: undefined,
    goal: undefined,
    diet: undefined,
    supplements: [],
    funFact: '',
    widgetStyle: 'daily',
    photos: [],
    workoutEnvironment: [],
    ...initialData
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: initialData.name }));
    }
  }, [initialData]);

  const isStepValid = () => {
    switch (step) {
      case 1: // Name & Age
        return (
          formData.name &&
          formData.name.trim().length > 1 &&
          formData.age &&
          Number(formData.age) >= 18
        );
      case 2: // Gender
        return !!formData.gender;
      case 3: // Location
        return formData.location && formData.location.trim().length > 2;
      case 4: // Photos (optional but need at least one)
        return (formData.photos && formData.photos.length > 0) || !!formData.avatarUrl;
      case 5: // Goal
        return !!formData.goal;
      case 6: // Interests
        return formData.interests && formData.interests.length > 0;
      case 7: // Level
        return !!formData.level;
      case 8: // Environment
        return true; // Optional
      case 9: // Time Preference
        return !!formData.workoutTimePreference;
      case 10: // Nutrition
        return true; // Optional
      case 11: // Supplements
        return true; // Optional
      case 12: // Fun Fact
        return true; // Optional
      case 13: // Bio
        return formData.bio && formData.bio.trim().length > 10;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    hapticFeedback.medium();

    // Show transition message
    let message = "Got it.";
    if (step === 1) message = formData.name ? `Nice to meet you, ${formData.name}.` : "Looking good.";
    if (step === 2) message = "Let's find your home base.";
    if (step === 3) message = "Show us the gains.";
    if (step === 4) message = "Now, what drives you?";
    if (step === 5) message = "What moves you?";
    if (step === 6) message = "Where do you usually train?";
    if (step === 7) message = "Your Arena?";
    if (step === 8) message = "When does the magic happen?";
    if (step === 9) message = "Let's fuel up.";
    if (step === 10) message = "What keeps you going?";
    if (step === 11) message = "Tell us something cool about you.";
    if (step === 12) message = "Define your game.";

    setTransitionMessage(message);
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
      if (step < TOTAL_INPUT_STEPS) {
        setStep(s => s + 1);
      } else {
        finishSetup();
      }
    }, 1200);
  };

  const finishSetup = async () => {
    setIsCompleted(true);
    hapticFeedback.success();

    try {
      // 1. Build bio from fun fact if needed
      let finalBio = formData.bio;
      if (formData.funFact && (!finalBio || finalBio.length < 20)) {
        finalBio = `${formData.funFact} ${finalBio || ''}`.trim();
      }
      if (!finalBio && formData.goal) {
        if (formData.goal === 'social') finalBio = "Here to meet new people and stay active.";
        if (formData.goal === 'competitive') finalBio = "Looking for serious competition and ranked matches.";
        if (formData.goal === 'fun') finalBio = "Just here to have fun and get moving.";
      }

      // 2. Get AI Persona (Background)
      let aiPersona = "The Active Rookie";
      try {
        const aiResult = await analyzeProfile(formData);
        if (aiResult && aiResult.persona) aiPersona = aiResult.persona;
      } catch (e) {
        console.log("AI Analysis skipped for speed");
      }

      // 3. Determine avatar URL (first photo or default)
      let finalAvatar = formData.avatarUrl;
      if (formData.photos && formData.photos.length > 0) {
        finalAvatar = formData.photos[0];
      }

      // 4. Create Final User Object
      const authUserId = initialData.uid;
      if (!authUserId) {
        console.error('No auth user ID found - cannot create profile');
        navigate('/auth?mode=signup');
        return;
      }

      const finalUser: User = {
        ...formData as User,
        id: authUserId,
        email: initialData.email || formData.email,
        bio: finalBio,
        avatarUrl: finalAvatar,
        matchPercentage: 0,
        aiPersona: aiPersona,
        isTrainer: false,
        dailySwipes: 10,
        lastSwipeReset: new Date().toISOString(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        showLocation: true,
        fitnessGoal: formData.goal as any,
        diet: formData.diet,
        supplements: formData.supplements,
        funFact: formData.funFact,
        widgetStyle: formData.widgetStyle,
        workoutEnvironment: formData.workoutEnvironment
      };

      // 5. Save to Supabase Database with retry
      let profileSaved = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!profileSaved && retryCount < maxRetries) {
        try {
          await userService.createProfile(finalUser);
          profileSaved = true;
        } catch (dbError) {
          retryCount++;
          console.error(`Failed to save user to database (attempt ${retryCount}/${maxRetries}):`, dbError);

          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
      }

      // If profile save failed after all retries, show error and allow manual retry
      if (!profileSaved) {
        setIsCompleted(false);
        hapticFeedback.error();
        notificationService.showNotification("Profile Save Failed", {
          body: "Could not save your profile. Please check your connection and try again."
        });
        return;
      }

      // 6. Login (Updates Context)
      await login(finalUser);

      // 7. Navigate after celebration delay to athlete welcome screen
      setTimeout(() => {
        const nextPath = formData.wantsPro ? '/become-pro' : '/';
        navigate('/welcome-athlete', { state: { nextPath } });
      }, 2500);

    } catch (error) {
      console.error("Setup failed", error);
      setIsCompleted(false);
      hapticFeedback.error();
      notificationService.showNotification("Setup Failed", {
        body: "Something went wrong. Please try again."
      });
    }
  };

  const handleBack = () => {
    hapticFeedback.light();
    if (step > 1) setStep(s => s - 1);
    else navigate('/auth?mode=signup');
  };

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    hapticFeedback.medium();

    try {
      // First check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationError('Tarayıcınız konum servisini desteklemiyor.');
        hapticFeedback.error();
        return;
      }

      // Get location with city name (handles permission internally)
      const locationData = await locationService.getCurrentLocationWithCity();

      setFormData(prev => ({
        ...prev,
        location: locationData.cityName,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }));

      hapticFeedback.success();
    } catch (error: any) {
      console.error('Location error:', error);

      // More specific error messages
      const errorMessage = error?.message || '';
      if (errorMessage.includes('izni')) {
        setLocationError('Konum izni verilmedi. Tarayıcı adres çubuğundaki kilit simgesine tıklayarak izin verin.');
      } else if (errorMessage.includes('zaman aşımı') || errorMessage.includes('timeout')) {
        setLocationError('Konum alınamadı (zaman aşımı). Tekrar deneyin.');
      } else if (errorMessage.includes('unavailable') || errorMessage.includes('alınamadı')) {
        setLocationError('Konum servisi kullanılamıyor. GPS açık olduğundan emin olun.');
      } else {
        setLocationError(`Konum alınamadı: ${errorMessage || 'Bilinmeyen hata'}. Manuel girin.`);
      }
      hapticFeedback.error();
    } finally {
      setIsGettingLocation(false);
    }
  };

  const toggleInterest = (sport: SportType) => {
    hapticFeedback.light();
    setFormData(prev => {
      const current = prev.interests || [];
      if (current.includes(sport)) {
        return { ...prev, interests: current.filter(s => s !== sport) };
      } else {
        if (current.length >= 3) return prev;
        return { ...prev, interests: [...current, sport] };
      }
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      hapticFeedback.error();
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB');
      hapticFeedback.error();
      return;
    }

    // Check photo limit (4 photos max)
    const currentPhotos = formData.photos || [];
    if (currentPhotos.length >= 4) {
      setPhotoError('Maximum 4 photos allowed');
      hapticFeedback.error();
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);
    hapticFeedback.medium();

    try {
      // Get user ID for storage path
      const userId = initialData.uid || `temp-${Date.now()}`;

      // Upload to Supabase Storage
      const { data, error } = await storageHelpers.uploadAvatar(userId, file);

      if (error || !data) {
        throw new Error(error?.message || 'Upload failed');
      }

      // Use the public URL from storage
      const photoUrl = data.url;

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), photoUrl],
        avatarUrl: prev.avatarUrl || photoUrl // Set first photo as avatar
      }));

      hapticFeedback.success();
    } catch (error: any) {
      console.error('Photo upload error:', error);
      setPhotoError(error?.message || 'Failed to upload photo');
      hapticFeedback.error();
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    hapticFeedback.medium();
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
      avatarUrl: index === 0 && prev.photos && prev.photos.length > 1 ? prev.photos[1] : prev.avatarUrl
    }));
  };

  const toggleSupplement = (supp: string) => {
    hapticFeedback.light();
    setFormData(prev => {
      const current = prev.supplements || [];
      if (current.includes(supp)) {
        return { ...prev, supplements: current.filter(s => s !== supp) };
      } else {
        return { ...prev, supplements: [...current, supp] };
      }
    });
  };

  const toggleEnvironment = (env: string) => {
    hapticFeedback.light();
    setFormData(prev => {
      const current = prev.workoutEnvironment || [];
      if (current.includes(env)) {
        return { ...prev, workoutEnvironment: current.filter(e => e !== env) };
      } else {
        return { ...prev, workoutEnvironment: [...current, env] };
      }
    });
  };

  const shufflePrompt = () => {
    hapticFeedback.light();
    const randomPrompt = FUN_FACT_PROMPTS[Math.floor(Math.random() * FUN_FACT_PROMPTS.length)];
    setFunFactPrompt(randomPrompt);
  };

  // Header Content based on Step
  const getHeaderContent = () => {
    switch (step) {
      case 1:
        return { title: "First things first.", subtitle: "What should we call you?" };
      case 2:
        return { title: "How do you identify?", subtitle: "To help with matching preferences." };
      case 3:
        return { title: "Where is home base?", subtitle: "Tap the map or use GPS to set your location." };
      case 4:
        return { title: "Show us the gains.", subtitle: "Add a few photos. The first one will be your main profile picture." };
      case 5:
        return { title: "Why are you here?", subtitle: "Be honest. We'll adapt your feed." };
      case 6:
        return { title: "What moves you?", subtitle: "Pick up to 3 sports you enjoy." };
      case 7:
        return { title: "Your Experience?", subtitle: "This ensures fair matches." };
      case 8:
        return { title: "Your Arena?", subtitle: "Select your preferred training grounds." };
      case 9:
        return { title: "Power Hour?", subtitle: "When do you prefer to train?" };
      case 10:
        return { title: "Fuel Your Body", subtitle: "Pick the nutrition style that powers you." };
      case 11:
        return { title: "Your Stack", subtitle: "What keeps you going? (Optional)" };
      case 12:
        return { title: "The Icebreaker", subtitle: "Share a quick fact to stand out." };
      case 13:
        return { title: "Define your game.", subtitle: "Pro athlete or weekend warrior? No judgment here." };
      default:
        return { title: "", subtitle: "" };
    }
  };

  const getStepColor = () => {
    switch (step) {
      case 1: return isLight ? 'bg-blue-300/40' : 'bg-blue-500/30';
      case 2: return isLight ? 'bg-pink-300/40' : 'bg-pink-500/30';
      case 3: return isLight ? 'bg-red-300/40' : 'bg-red-500/30';
      case 4: return isLight ? 'bg-teal-300/40' : 'bg-teal-500/30';
      case 5: return isLight ? 'bg-orange-300/40' : 'bg-orange-500/30';
      case 6: return isLight ? 'bg-lime-300/40' : 'bg-brand-lime/20';
      case 7: return isLight ? 'bg-purple-300/40' : 'bg-purple-500/30';
      case 8: return isLight ? 'bg-sky-300/40' : 'bg-sky-500/30';
      case 9: return isLight ? 'bg-yellow-300/40' : 'bg-yellow-500/30';
      case 10: return isLight ? 'bg-green-300/40' : 'bg-green-500/30';
      case 11: return isLight ? 'bg-emerald-300/40' : 'bg-emerald-500/30';
      case 12: return isLight ? 'bg-fuchsia-300/40' : 'bg-fuchsia-500/30';
      case 13: return isLight ? 'bg-indigo-400/40' : 'bg-indigo-600/30';
      default: return 'bg-white/10';
    }
  };

  const header = getHeaderContent();

  if (isCompleted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden">
        {/* Celebration Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[100px] animate-pulse-slow" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-pop">
            <CheckCircle2 size={48} className="text-white" strokeWidth={3} />
          </div>

          <h1 className={`text-4xl font-display font-bold mb-4 tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Welcome to the Team!
          </h1>

          <p className={`text-lg leading-relaxed max-w-xs mb-8 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
            You're all set, <span className="font-bold text-neon-blue">{formData.name}</span>. We're really happy to have you here.
          </p>

          <div className={`px-6 py-3 rounded-full border flex items-center gap-2 animate-pulse ${isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/50'}`}>
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Preparing your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    // We use a key on the wrapper div to force React to re-trigger the animation on step change
    switch (step) {
      case 1:
        return (
          <div key="step1" className="space-y-6 animate-slide-up">
            <div className="space-y-5">
              {/* Name Input */}
              <div className="group animate-slide-up" style={{ animationDelay: '100ms' }}>
                <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  Full Name
                </label>
                <div className={`relative transition-all duration-300 rounded-2xl group-focus-within:ring-2 group-focus-within:ring-neon-blue/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                  <GlassInput
                    placeholder="Alex Smith"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`!bg-transparent !border-transparent focus:!ring-0 ${isLight ? 'text-slate-900' : 'text-white'}`}
                  />
                </div>
              </div>

              {/* Age Input */}
              <div className="group animate-slide-up" style={{ animationDelay: '200ms' }}>
                <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                  Age (18+)
                </label>
                <div className={`relative transition-all duration-300 rounded-2xl group-focus-within:ring-2 group-focus-within:ring-neon-blue/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                  <GlassInput
                    type="number"
                    placeholder="24"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value as any })}
                    className={`!bg-transparent !border-transparent focus:!ring-0 ${isLight ? 'text-slate-900' : 'text-white'}`}
                    min="18"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="space-y-6 animate-slide-up pb-8">
            <div className="grid gap-3">
              {['Male', 'Female', 'Non-binary', 'Other'].map((g, index) => {
                const isSelected = formData.gender === g;
                return (
                  <div
                    key={g}
                    className="opacity-0 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        setFormData({ ...formData, gender: g as any });
                      }}
                      className={`p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 ${isSelected
                        ? (isLight ? 'border-slate-900 bg-slate-100 shadow-lg' : 'border-neon-blue bg-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]')
                        : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserIcon size={20} className={isSelected ? 'text-neon-blue' : (isLight ? 'text-slate-400' : 'text-white/40')} />
                          <span className={`font-display font-bold text-lg ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-600' : 'text-white/60')}`}>
                            {g}
                          </span>
                        </div>
                        {isSelected && <Check size={20} className="text-neon-blue animate-pop" />}
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div key="step3" className="space-y-6 animate-slide-up pb-8">
            {/* Leaflet Map Style */}
            <style>{`
              @keyframes pulse {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
              }
              .leaflet-container {
                background: ${isLight ? '#f1f5f9' : '#0f172a'} !important;
              }
            `}</style>

            {/* Real Leaflet Map */}
            <div className="relative animate-slide-up">
              <div className={`relative h-64 rounded-2xl overflow-hidden transition-all duration-300 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                <MapContainer
                  center={formData.latitude && formData.longitude
                    ? [formData.latitude, formData.longitude]
                    : [41.0082, 28.9784]} // Default: Istanbul
                  zoom={formData.latitude ? 14 : 10}
                  style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={isLight
                      ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                    }
                  />

                  {/* Map Controller for centering */}
                  {formData.latitude && formData.longitude && (
                    <MapController center={[formData.latitude, formData.longitude]} />
                  )}

                  {/* User Location Marker */}
                  {formData.latitude && formData.longitude && (
                    <Marker
                      position={[formData.latitude, formData.longitude]}
                      icon={userLocationIcon}
                    />
                  )}
                </MapContainer>

                {/* Map overlay text when no location */}
                {!formData.latitude && !formData.longitude && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm rounded-2xl">
                    <div className="text-center">
                      <Crosshair size={32} className="mx-auto mb-2 text-white/60" />
                      <p className="text-sm font-medium text-white/80">
                        Use GPS to set your location
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Display & GPS Button */}
            <div className="space-y-3">
              {formData.location && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slide-up ${isLight ? 'bg-white border border-slate-200' : 'bg-white/5'}`}>
                  <MapPin size={18} className="text-neon-blue" />
                  <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formData.location}
                  </span>
                  {formData.latitude && formData.longitude && (
                    <span className={`text-xs ml-auto ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                      GPS ✓
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className={`w-full p-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${isGettingLocation
                  ? 'bg-neon-blue/20 cursor-wait'
                  : 'bg-neon-blue hover:bg-neon-blue/80 active:scale-95'
                  }`}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 size={20} className="text-neon-blue animate-spin" />
                    <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Getting location...</span>
                  </>
                ) : (
                  <>
                    <Navigation size={20} className="text-black" />
                    <span className="font-medium text-black">Use My GPS Location</span>
                  </>
                )}
              </button>

              {locationError && (
                <div className="flex items-center gap-2 text-red-400 text-sm animate-slide-up">
                  <AlertCircle size={16} />
                  <span>{locationError}</span>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div key="step4" className="space-y-6 animate-slide-up pb-8">
            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((index) => {
                const photo = formData.photos?.[index];
                return (
                  <div
                    key={index}
                    className="opacity-0 animate-pop"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`relative aspect-square rounded-2xl overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                      {photo ? (
                        <>
                          <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          {index === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-neon-blue text-black text-xs font-bold rounded-full">
                              Main
                            </div>
                          )}
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className={`w-full h-full flex flex-col items-center justify-center gap-2 transition-all ${isUploadingPhoto
                            ? 'cursor-wait opacity-50'
                            : 'hover:bg-white/10 cursor-pointer'
                            }`}
                        >
                          {isUploadingPhoto && index === (formData.photos?.length || 0) ? (
                            <Loader2 size={24} className="text-neon-blue animate-spin" />
                          ) : (
                            <>
                              <Plus size={24} className={isLight ? 'text-slate-400' : 'text-white/40'} />
                              <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Add Photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
              className="hidden"
            />

            {/* Info */}
            <div className="text-center space-y-2">
              <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                {formData.photos?.length || 0}/4 photos added
              </p>
              <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                JPG, PNG or WEBP • Max 5MB each
              </p>
            </div>

            {photoError && (
              <div className="flex items-center gap-2 justify-center text-red-400 text-sm animate-slide-up">
                <AlertCircle size={16} />
                <span>{photoError}</span>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div key="step5" className="space-y-6 animate-slide-up pb-8">
            <div className="grid gap-3">
              {[
                { value: 'Social & Fun', desc: 'Meet friends, have a good time', icon: '🎉' },
                { value: 'Competitive', desc: 'Push limits, track progress', icon: '🏆' },
                { value: 'Just Fitness', desc: 'Stay healthy, feel great', icon: '💪' }
              ].map((goal, index) => {
                const isSelected = formData.goal === goal.value;
                return (
                  <div
                    key={goal.value}
                    className="opacity-0 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        setFormData({ ...formData, goal: goal.value });
                      }}
                      className={`p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 ${isSelected
                        ? (isLight ? 'border-slate-900 bg-slate-100 shadow-lg' : 'border-neon-blue bg-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]')
                        : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl ${isSelected ? 'scale-110' : ''} transition-transform`}>
                            {goal.icon}
                          </div>
                          <div>
                            <div className={`font-display font-bold text-lg ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-600' : 'text-white/60')}`}>
                              {goal.value}
                            </div>
                            <div className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                              {goal.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={20} className="text-neon-blue animate-pop" />}
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 6:
        return (
          <div key="step6" className="space-y-6 animate-slide-up pb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.values(SportType).map((sport, index) => {
                const isSelected = formData.interests?.includes(sport);
                return (
                  <div
                    key={sport}
                    className="opacity-0 animate-pop"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <GlassSelectable
                      selected={isSelected || false}
                      onClick={() => toggleInterest(sport)}
                      className={`
                        min-w-[100px] transition-all duration-300 py-3 px-5 relative overflow-hidden group
                        ${isSelected
                          ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_25px_rgba(0,242,255,0.3)] scale-105 font-bold'
                          : (isLight ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20')
                        }
                      `}
                    >
                      {isSelected && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                      <span className="relative z-10 flex items-center gap-2">
                        {sport}
                        {isSelected && <CheckCircle2 size={14} className="animate-pop" />}
                      </span>
                    </GlassSelectable>
                  </div>
                );
              })}
            </div>

            <div className={`text-center text-xs mt-8 font-mono transition-colors uppercase tracking-widest ${formData.interests?.length === 0 ? 'text-red-400 animate-pulse' : (isLight ? 'text-slate-400' : 'text-white/30')}`}>
              {formData.interests?.length}/3 Selected {formData.interests?.length === 0 && '(Required)'}
            </div>
          </div>
        );
      case 7:
        return (
          <div key="step7" className="space-y-6 animate-slide-up pb-8">
            <div className="grid gap-3">
              {['Beginner', 'Intermediate', 'Pro'].map((lvl, index) => {
                const isSelected = formData.level === lvl;
                return (
                  <div
                    key={lvl}
                    className="opacity-0 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        setFormData({ ...formData, level: lvl as any });
                      }}
                      className={`p-4 cursor-pointer border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] relative ${isSelected
                        ? (isLight ? 'border-slate-900 bg-slate-50 shadow-lg' : 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]')
                        : (isLight ? 'border-transparent bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      {isSelected && <div className={`absolute inset-y-0 left-0 w-1 ${isLight ? 'bg-slate-900' : 'bg-white'}`} />}
                      <div className="flex items-center justify-between pl-2">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full transition-all ${isSelected ? (isLight ? 'bg-slate-900 text-white' : 'bg-white text-black') : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/40')}`}>
                            {lvl === 'Beginner' && <Target size={18} />}
                            {lvl === 'Intermediate' && <Target size={18} />}
                            {lvl === 'Pro' && <Target size={18} fill="currentColor" />}
                          </div>
                          <span className={`font-display font-bold text-lg transition-colors ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-400' : 'text-white/60')}`}>{lvl}</span>
                        </div>
                        {isSelected && <Sparkles size={16} className={isLight ? 'text-slate-400' : 'text-white/40'} />}
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 8:
        return (
          <div key="step8" className="space-y-6 animate-slide-up pb-8">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'Gym', icon: Dumbbell },
                { value: 'Outdoors', icon: Sun },
                { value: 'Home', icon: Home },
                { value: 'Studio', icon: Building2 }
              ].map((env, index) => {
                const isSelected = formData.workoutEnvironment?.includes(env.value);
                const Icon = env.icon;
                return (
                  <div
                    key={env.value}
                    className="opacity-0 animate-pop"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        toggleEnvironment(env.value);
                      }}
                      className={`p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 aspect-square flex flex-col items-center justify-center gap-3 ${isSelected
                        ? (isLight ? 'border-brand-lime bg-brand-lime/10 shadow-lg' : 'border-brand-lime bg-brand-lime/10 shadow-[0_0_30px_rgba(214,255,0,0.1)]')
                        : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      <Icon size={32} className={isSelected ? 'text-brand-lime' : (isLight ? 'text-slate-400' : 'text-white/40')} />
                      <span className={`font-display font-bold text-sm ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-600' : 'text-white/60')}`}>
                        {env.value}
                      </span>
                      {isSelected && <Check size={16} className="text-brand-lime absolute top-2 right-2 animate-pop" />}
                    </GlassCard>
                  </div>
                );
              })}
            </div>
            <p className={`text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              Select all that apply
            </p>
          </div>
        );
      case 9:
        return (
          <div key="step9" className="space-y-6 animate-slide-up pb-8">
            <div className="grid gap-4">
              {['Morning', 'Evening', 'Anytime'].map((time, index) => {
                const isSelected = formData.workoutTimePreference === time;
                return (
                  <div
                    key={time}
                    className="opacity-0 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        setFormData({ ...formData, workoutTimePreference: time as any });
                      }}
                      className={`p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden ${isSelected
                        ? (isLight ? 'border-slate-900 bg-slate-100 shadow-lg' : 'border-neon-blue bg-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]')
                        : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      {isSelected && <div className="absolute top-4 right-4 text-neon-blue animate-pop"><CheckCircle2 size={20} /></div>}

                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full transition-colors duration-300 ${isSelected ? 'bg-neon-blue text-black' : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/40')}`}>
                          {time === 'Morning' && <Sun size={24} />}
                          {time === 'Evening' && <Moon size={24} />}
                          {time === 'Anytime' && <Clock size={24} />}
                        </div>
                        <div>
                          <div className={`font-display font-bold text-xl transition-colors ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-400' : 'text-white/60')}`}>
                            {time}
                          </div>
                          <div className={`text-xs mt-1 transition-colors ${isSelected ? (isLight ? 'text-slate-600' : 'text-white/80') : (isLight ? 'text-slate-400' : 'text-white/40')}`}>
                            {time === 'Morning' && 'Rise and grind! ☀️'}
                            {time === 'Evening' && 'After hours athlete 🌙'}
                            {time === 'Anytime' && 'Flexible schedule 🕒'}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 10:
        return (
          <div key="step10" className="space-y-6 animate-slide-up pb-8">
            <div className="grid grid-cols-2 gap-3">
              {DIET_OPTIONS.map((diet, index) => {
                const diets = formData.diet as unknown as string[] || [];
                const isSelected = Array.isArray(diets) ? diets.includes(diet.id) : formData.diet === diet.id;
                const Icon = diet.icon;
                return (
                  <div
                    key={diet.id}
                    className="opacity-0 animate-pop"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <GlassCard
                      onClick={() => {
                        hapticFeedback.light();
                        const currentDiets = (Array.isArray(formData.diet) ? formData.diet : formData.diet ? [formData.diet] : []) as string[];
                        if (currentDiets.includes(diet.id)) {
                          setFormData({ ...formData, diet: currentDiets.filter(d => d !== diet.id) as any });
                        } else {
                          setFormData({ ...formData, diet: [...currentDiets, diet.id] as any });
                        }
                      }}
                      className={`p-4 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-2 aspect-square relative ${isSelected
                        ? (isLight ? 'border-green-500 bg-green-50 shadow-lg' : 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]')
                        : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                        }`}
                    >
                      <Icon size={28} className={isSelected ? 'text-green-500' : (isLight ? 'text-slate-400' : 'text-white/40')} />
                      <span className={`font-display font-bold text-xs text-center ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-600' : 'text-white/60')}`}>
                        {diet.label}
                      </span>
                      {isSelected && <Check size={14} className="text-green-500 absolute top-2 right-2 animate-pop" />}
                    </GlassCard>
                  </div>
                );
              })}
            </div>
            <p className={`text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              Select all that apply
            </p>
          </div>
        );
      case 11:
        return (
          <div key="step11" className="space-y-6 animate-slide-up pb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {SUPPLEMENT_OPTIONS.map((supp, index) => {
                const isSelected = formData.supplements?.includes(supp);
                return (
                  <div
                    key={supp}
                    className="opacity-0 animate-pop"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <GlassSelectable
                      selected={isSelected || false}
                      onClick={() => toggleSupplement(supp)}
                      className={`
                        transition-all duration-300 py-2 px-4 relative overflow-hidden
                        ${isSelected
                          ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-105 font-bold'
                          : (isLight ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20')
                        }
                      `}
                    >
                      <span className="relative z-10 flex items-center gap-1.5 text-sm">
                        <Pill size={14} />
                        {supp}
                      </span>
                    </GlassSelectable>
                  </div>
                );
              })}
            </div>
            <p className={`text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              Select all that apply
            </p>
          </div>
        );
      case 12:
        return (
          <div key="step12" className="space-y-6 animate-slide-up pb-8">
            {/* Prompt Card */}
            <div className={`p-5 rounded-2xl flex items-start gap-3 animate-slide-up ${isLight ? 'bg-fuchsia-50 border border-fuchsia-200' : 'bg-fuchsia-500/10 border border-fuchsia-500/20'}`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${isLight ? 'bg-fuchsia-200' : 'bg-fuchsia-500/20'}`}>
                <Sparkles size={18} className="text-fuchsia-500" />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm leading-relaxed ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {funFactPrompt}
                </p>
                <button
                  onClick={shufflePrompt}
                  className={`mt-3 flex items-center gap-2 text-xs font-bold transition-colors ${isLight ? 'text-fuchsia-600 hover:text-fuchsia-700' : 'text-fuchsia-400 hover:text-fuchsia-300'}`}
                >
                  <Shuffle size={14} />
                  Try another prompt
                </button>
              </div>
            </div>

            {/* Answer Textarea */}
            <div className="group">
              <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold transition-colors group-focus-within:text-fuchsia-500 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                Your Answer
              </label>
              <div className={`p-1 rounded-2xl transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-fuchsia-500/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                <textarea
                  className={`w-full rounded-xl px-5 py-4 placeholder-opacity-40 focus:outline-none resize-none h-32 transition-colors bg-transparent border-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'}`}
                  placeholder="Share something unique about you..."
                  value={formData.funFact}
                  onChange={e => setFormData({ ...formData, funFact: e.target.value })}
                />
              </div>
              <p className={`text-xs mt-2 ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                This will help create your bio
              </p>
            </div>
          </div>
        );
      case 13:
        return (
          <div key="step13" className="space-y-6 animate-slide-up pb-20">
            {/* Bio Input */}
            <div className="group">
              <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold flex items-center gap-2 transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                <Edit3 size={12} /> Your Bio (Required)
              </label>
              <div className={`p-1 rounded-2xl transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-neon-blue/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                <textarea
                  className={`w-full rounded-xl px-5 py-4 placeholder-opacity-40 focus:outline-none resize-none h-32 transition-colors bg-transparent border-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'}`}
                  placeholder="Tell us your story. 'I love running at sunset...' (min 10 chars)"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
              <p className={`text-xs mt-2 ml-1 ${formData.bio && formData.bio.length >= 10 ? 'text-green-400' : (isLight ? 'text-slate-400' : 'text-white/40')}`}>
                {formData.bio?.length || 0}/10 characters minimum
              </p>
            </div>

            {/* Join as Pro Toggle */}
            <div className="mt-6 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <GlassCard
                onClick={() => {
                  hapticFeedback.medium();
                  setFormData({ ...formData, wantsPro: !formData.wantsPro });
                }}
                className={`p-4 cursor-pointer border transition-all duration-300 flex items-center gap-3 overflow-hidden relative ${formData.wantsPro
                  ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                  : (isLight ? 'bg-white border-slate-100 hover:bg-slate-50' : 'bg-white/5 border-white/10 hover:bg-white/10')
                  }`}
              >
                {formData.wantsPro && <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />}

                <div className={`p-2.5 rounded-full transition-all duration-500 ${formData.wantsPro ? 'bg-blue-500 text-white scale-110 rotate-12' : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/10 text-white/40')}`}>
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 text-left relative z-10">
                  <div className={`font-bold text-sm transition-colors ${formData.wantsPro ? (isLight ? 'text-blue-600' : 'text-white') : (isLight ? 'text-slate-600' : 'text-white/70')}`}>Join as Pro Trainer</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Get verified, earn money, and find clients.</div>
                </div>
                <div className={`transition-all duration-300 ${formData.wantsPro ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  <div className="text-blue-500"><CheckCircle2 size={24} fill="currentColor" className="text-white" /></div>
                </div>
              </GlassCard>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isValid = isStepValid();

  return (
    <div className="h-full flex flex-col max-w-md mx-auto overflow-hidden relative">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1">
        <div className={`h-full transition-all duration-700 ease-out ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
          <div
            className="h-full bg-gradient-to-r from-neon-blue to-purple-500 shadow-[0_0_15px_rgba(0,242,255,0.5)] transition-all duration-700 ease-out"
            style={{ width: `${(step / TOTAL_INPUT_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Header Navigation */}
      <div className="flex-none p-6 pt-8 z-10 relative animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <button onClick={handleBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors backdrop-blur-md ${isLight ? 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'}`}>
            <ChevronLeft size={20} />
          </button>
          <div className={`text-xs font-bold flex items-center justify-end ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            Step {step} of {TOTAL_INPUT_STEPS}
          </div>
        </div>

        {/* Conversational Header - Minimalist Style (Icons Removed) */}
        <div className="space-y-2 mt-4">
          <h2 className={`text-3xl sm:text-4xl font-display font-bold tracking-tight animate-slide-up ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {header.title}
          </h2>
          <p className={`text-lg font-light leading-relaxed animate-slide-up ${isLight ? 'text-slate-500' : 'text-white/60'}`} style={{ animationDelay: '100ms' }}>
            {header.subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-2 pb-32 z-10 relative">
        {renderStepContent()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pt-10 z-20 max-w-md mx-auto safe-area-bottom">
        <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${isLight ? 'from-white via-white/90 to-transparent' : 'from-black/90 via-black/60 to-transparent'}`}></div>

        <div className="relative z-10">
          <GlassButton
            onClick={handleNext}
            className={`
                    w-full h-14 text-lg transition-all duration-500 border
                    ${isValid
                ? 'shadow-[0_0_30px_rgba(0,242,255,0.2)] border-white/50 scale-100 opacity-100'
                : 'opacity-50 scale-[0.98] grayscale border-transparent cursor-not-allowed'
              }
                `}
            disabled={!isValid}
          >
            <span className="flex items-center gap-2">
              {step === TOTAL_INPUT_STEPS ? 'Complete Profile' : 'Continue'}
              <ChevronRight size={20} className={`transition-transform duration-300 ${isValid ? 'translate-x-1' : ''}`} />
            </span>
          </GlassButton>
          {!isValid && (
            <div className="text-center mt-3 text-red-400/80 text-[10px] flex items-center justify-center gap-1 animate-pulse font-medium uppercase tracking-wide h-4">
              <AlertCircle size={10} /> Complete all fields
            </div>
          )}
        </div>
      </div>

      {/* Transition Overlay */}
      <div className={`
          fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-500 pointer-events-none
          ${isTransitioning ? 'opacity-100 scale-100 backdrop-blur-xl bg-black/40' : 'opacity-0 scale-110 pointer-events-none'}
      `}>
        <div className={`
              transform transition-all duration-700 delay-100
              ${isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
          `}>
          <h3 className="text-4xl sm:text-5xl font-display font-black text-white tracking-tighter drop-shadow-2xl mb-4 leading-tight">
            {transitionMessage}
          </h3>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-brand-lime rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
