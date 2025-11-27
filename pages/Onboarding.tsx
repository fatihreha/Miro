
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { SportType, User } from '../types';
import { ChevronRight, ChevronLeft, MapPin, Target, Edit3, AlertCircle, Sun, Moon, Clock, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/hapticService';
import { useTheme } from '../context/ThemeContext';
import { analyzeProfile } from '../services/geminiService';

const TOTAL_INPUT_STEPS = 4;

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const initialData = location.state?.initialData || {};
  
  const [formData, setFormData] = useState<Partial<User> & { wantsPro?: boolean }>({
    name: initialData.name || '',
    age: '' as any,
    location: '',
    interests: [],
    level: 'Beginner',
    bio: '',
    workoutTimePreference: 'Any',
    avatarUrl: `https://i.pravatar.cc/400?u=${Math.floor(Math.random() * 1000)}`,
    wantsPro: false,
    ...initialData 
  });

  useEffect(() => {
    if (initialData.name && !formData.name) {
        setFormData(prev => ({ ...prev, name: initialData.name }));
    }
  }, [initialData]);

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.name && 
          formData.name.trim().length > 1 &&
          formData.age && 
          Number(formData.age) >= 18 && 
          formData.location && 
          formData.location.trim().length > 2
        );
      case 2:
        return formData.interests && formData.interests.length > 0;
      case 3:
        return !!formData.workoutTimePreference;
      case 4:
        return formData.bio && formData.bio.trim().length > 10;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    hapticFeedback.medium();
    if (step < TOTAL_INPUT_STEPS) {
      setStep(s => s + 1);
    } else {
      // Show success screen & Finish Setup
      finishSetup();
    }
  };

  const finishSetup = async () => {
      setIsCompleted(true);
      hapticFeedback.success();

      // Perform background setup (formerly Analysis page logic)
      try {
          // 1. Get AI Persona (Background, don't block too long)
          // We use a fast timeout or wait for it briefly. 
          // If it fails or takes too long, we fall back to defaults.
          let aiPersona = "The Active Rookie";
          try {
             const aiResult = await analyzeProfile(formData);
             if (aiResult && aiResult.persona) aiPersona = aiResult.persona;
          } catch (e) {
             console.log("AI Analysis skipped for speed");
          }

          // 2. Create Final User Object
          const finalUser: User = {
              ...formData as User,
              id: Date.now().toString(),
              matchPercentage: 0,
              aiPersona: aiPersona,
              isTrainer: false, // Default, changed later if BecomePro is completed
              dailySwipes: 10,
              lastSwipeReset: new Date().toISOString()
          };

          // 3. Login (Updates Context)
          await login(finalUser);

          // 4. Navigate after a short "Celebration" delay
          setTimeout(() => {
              if (formData.wantsPro) {
                  navigate('/become-pro');
              } else {
                  navigate('/');
              }
          }, 2500);

      } catch (error) {
          console.error("Setup failed", error);
          // Fallback navigation
          navigate('/');
      }
  };

  const handleBack = () => {
    hapticFeedback.light();
    if (step > 1) setStep(s => s - 1);
    else navigate('/auth?mode=signup');
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

  // Header Content based on Step
  const getHeaderContent = () => {
    switch(step) {
      case 1:
        return {
          title: "Let's get to know you.",
          subtitle: "First things first. Who is the athlete behind the screen?"
        };
      case 2:
        return {
          title: "What moves you?",
          subtitle: "Pick your top sports. We'll find your perfect teammate."
        };
      case 3:
        return {
          title: "When do you grind?",
          subtitle: "Timing is everything. Let's sync your schedule."
        };
      case 4:
        return {
          title: "Define your game.",
          subtitle: "Pro athlete or weekend warrior? No judgment here."
        };
      default:
        return { title: "", subtitle: "" };
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
    switch(step) {
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
                    onChange={e => setFormData({...formData, name: e.target.value})}
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
                    onChange={e => setFormData({...formData, age: e.target.value as any})}
                    className={`!bg-transparent !border-transparent focus:!ring-0 ${isLight ? 'text-slate-900' : 'text-white'}`}
                    min="18"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="group animate-slide-up" style={{ animationDelay: '300ms' }}>
                <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                   Location
                </label>
                <div className={`relative transition-all duration-300 rounded-2xl group-focus-within:ring-2 group-focus-within:ring-neon-blue/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                  <MapPin size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                  <GlassInput 
                    placeholder="New York, NY" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className={`pl-12 !bg-transparent !border-transparent focus:!ring-0 ${isLight ? 'text-slate-900' : 'text-white'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="space-y-6 animate-slide-up pb-8">
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
      case 3:
        return (
          <div key="step3" className="space-y-6 animate-slide-up pb-8">
            <div className="grid gap-4">
              {['Morning', 'Evening', 'Any'].map((time, index) => {
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
                              setFormData({...formData, workoutTimePreference: time as any});
                          }}
                          className={`p-5 cursor-pointer border transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden ${
                              isSelected 
                              ? (isLight ? 'border-slate-900 bg-slate-100 shadow-lg' : 'border-neon-blue bg-neon-blue/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]') 
                              : (isLight ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-transparent hover:bg-white/5')
                          }`}
                      >
                          {isSelected && <div className="absolute top-4 right-4 text-neon-blue animate-pop"><CheckCircle2 size={20} /></div>}
                          
                          <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-full transition-colors duration-300 ${isSelected ? 'bg-neon-blue text-black' : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/40')}`}>
                                  {time === 'Morning' && <Sun size={24} />}
                                  {time === 'Evening' && <Moon size={24} />}
                                  {time === 'Any' && <Clock size={24} />}
                              </div>
                              <div>
                                  <div className={`font-display font-bold text-xl transition-colors ${isSelected ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-400' : 'text-white/60')}`}>
                                      {time === 'Any' ? 'Anytime' : time}
                                  </div>
                                  <div className={`text-xs mt-1 transition-colors ${isSelected ? (isLight ? 'text-slate-600' : 'text-white/80') : (isLight ? 'text-slate-400' : 'text-white/40')}`}>
                                      {time === 'Morning' && 'Rise and grind! ☀️'}
                                      {time === 'Evening' && 'After hours athlete 🌙'}
                                      {time === 'Any' && 'Flexible schedule 🕒'}
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
      case 4:
        return (
          <div key="step4" className="space-y-6 animate-slide-up pb-20">
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
                          setFormData({...formData, level: lvl as any});
                      }}
                      className={`p-4 cursor-pointer border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] relative ${
                        isSelected 
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

            <div className="mt-8 opacity-0 animate-slide-up group" style={{ animationDelay: '400ms' }}>
              <label className={`block text-[10px] mb-2 ml-1 uppercase tracking-widest font-bold flex items-center gap-2 transition-colors group-focus-within:text-neon-blue ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                <Edit3 size={12} /> Your Bio (Required)
              </label>
              <div className={`p-1 rounded-2xl transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-neon-blue/50 ${isLight ? 'bg-white' : 'bg-black/20'}`}>
                <textarea 
                  className={`w-full rounded-xl px-5 py-4 placeholder-opacity-40 focus:outline-none resize-none h-28 transition-colors bg-transparent border-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'}`}
                  placeholder="Tell us your story. 'I love running at sunset...' (min 10 chars)"
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
              </div>
            </div>

            {/* Join as Pro Toggle */}
            <div className="mt-6 opacity-0 animate-slide-up" style={{ animationDelay: '500ms' }}>
              <GlassCard 
                onClick={() => {
                    hapticFeedback.medium();
                    setFormData({ ...formData, wantsPro: !formData.wantsPro });
                }}
                className={`p-4 cursor-pointer border transition-all duration-300 flex items-center gap-3 overflow-hidden relative ${
                    formData.wantsPro 
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
    </div>
  );
};
