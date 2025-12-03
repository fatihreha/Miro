
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { X, Star, Zap, Eye, Filter, Infinity, CheckCircle2, AlertCircle, Crown, Sparkles, Check, Bot, Users } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPackage } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';

export const Premium: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const data = await subscriptionService.getOfferings();
        setPackages(data);
        // Auto-select the annual plan (usually the second one or based on ID)
        const annual = data.find(p => p.packageType === 'ANNUAL');
        if (annual) setSelectedPlan(annual.identifier);
        else if (data.length > 0) setSelectedPlan(data[0].identifier);
      } catch (err) {
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;
    setIsPurchasing(selectedPlan);
    setError(null);

    try {
      const { success } = await subscriptionService.purchasePackage(selectedPlan, user.id);

      if (success) {
        notificationService.showNotification("Welcome to Premium!", {
          body: "Payment successful. You are now a SportPulse Gold member."
        });
        updateUser({ isPremium: true });
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError("Payment failed. Please try again.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    setIsPurchasing('restore');
    const { restored } = await subscriptionService.restorePurchases(user.id);
    setIsPurchasing(null);

    if (restored) {
      updateUser({ isPremium: true });
      notificationService.showNotification("Purchases Restored", { body: "Welcome back!" });
      navigate('/');
    } else {
      setError("No previous purchases found.");
    }
  };

  const benefits = [
    { icon: Infinity, title: 'Unlimited Swipes', desc: 'No daily limits. Swipe as much as you want.' },
    { icon: Bot, title: 'AI Personal Trainer', desc: 'Unlock your 24/7 AI Performance Coach.' },
    { icon: Crown, title: 'Create Clubs', desc: 'Build and lead your own sports community.' },
    { icon: Eye, title: 'See Who Liked You', desc: 'Stop guessing and reveal your admirers.' },
    { icon: Zap, title: 'Monthly Boost', desc: 'Be the top profile in your area.' },
    { icon: Filter, title: 'Advanced Filters', desc: 'Find matches by height, habits & more.' }
  ];

  return (
    <div className="h-full w-full relative overflow-y-auto no-scrollbar bg-transparent font-sans">

      {/* Premium Atmosphere Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Dynamic Gradient Base */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-b from-amber-50 via-white to-white' : 'bg-gradient-to-b from-[#1a1a00] via-black to-black'}`} />

        {/* Animated Gold/Amber Blobs */}
        <div className={`absolute top-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-amber-300/40' : 'bg-amber-600/20'}`} />
        <div className={`absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-yellow-200/40' : 'bg-yellow-900/20'}`} style={{ animationDelay: '2s' }} />

        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="relative z-10 px-6 py-8 pb-32 max-w-lg mx-auto flex flex-col min-h-full">

        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border ${isLight ? 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Header Brand */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-40 rounded-full animate-pulse-slow"></div>
            <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 rotate-3 border border-white/20">
              <Crown size={40} className="text-white drop-shadow-md" fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 bg-white text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pop border border-amber-100">
              PRO
            </div>
          </div>

          <h1 className={`text-4xl font-display font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            SportPulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Gold</span>
          </h1>
          <p className={`text-lg font-light ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            Upgrade your game. Unlock limits.
          </p>
        </div>

        {/* Benefits Carousel/Grid */}
        <div className="grid grid-cols-1 gap-3 mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {benefits.map((item, idx) => (
            <GlassCard
              key={idx}
              className={`p-4 flex items-center gap-4 border-0 ${isLight ? 'bg-white/60 shadow-sm' : 'bg-white/5'}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <item.icon size={20} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{item.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Plans Selection */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up flex-1" style={{ animationDelay: '200ms' }}>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs mb-4">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {packages.map((pkg) => {
              const isSelected = selectedPlan === pkg.identifier;
              const isBestValue = pkg.packageType === 'ANNUAL';

              return (
                <div
                  key={pkg.identifier}
                  onClick={() => {
                    setSelectedPlan(pkg.identifier);
                    hapticFeedback.light();
                  }}
                  className={`
                                relative rounded-[24px] border-2 transition-all duration-300 cursor-pointer overflow-hidden group
                                ${isSelected
                      ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-transparent shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : (isLight ? 'border-slate-200 bg-white/60' : 'border-white/10 bg-white/5 hover:bg-white/10')
                    }
                            `}
                >
                  {/* Best Value Badge */}
                  {isBestValue && (
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500 to-orange-500 text-white text-[9px] font-bold px-3 py-1.5 rounded-bl-xl shadow-lg z-10">
                      BEST VALUE
                    </div>
                  )}

                  <div className="p-5 flex justify-between items-center relative z-0">
                    <div className="flex items-center gap-4">
                      <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : (isLight ? 'border-slate-300' : 'border-white/20')}
                                    `}>
                        {isSelected && <Check size={14} strokeWidth={4} />}
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{pkg.title}</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {pkg.packageType === 'ANNUAL' ? 'Billed yearly' : 'Billed monthly'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold font-display ${isSelected ? 'text-amber-500' : (isLight ? 'text-slate-900' : 'text-white')}`}>
                        {pkg.priceString}
                      </div>
                      {pkg.savings && (
                        <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded inline-block">
                          SAVE {pkg.savings}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 space-y-4 animate-fade-in">
          <GlassButton
            onClick={handleSubscribe}
            disabled={!selectedPlan || !!isPurchasing}
            className={`
                    w-full h-16 text-lg font-bold shadow-xl transition-all
                    bg-gradient-to-r from-amber-400 to-orange-600 border-0 text-white hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.98]
                `}
          >
            {isPurchasing && isPurchasing !== 'restore' ? (
              <span className="flex items-center gap-2"><Sparkles className="animate-spin" /> Processing...</span>
            ) : (
              'Continue'
            )}
          </GlassButton>

          <button
            onClick={handleRestore}
            disabled={!!isPurchasing}
            className={`w-full text-center text-xs font-bold uppercase tracking-widest transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/30 hover:text-white'}`}
          >
            {isPurchasing === 'restore' ? 'Restoring Purchases...' : 'Restore Purchases'}
          </button>

          {/* Legal Links - Required by App Store Guidelines */}
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <button
              onClick={() => navigate('/terms')}
              className={`transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/70'}`}
            >
              Terms of Use
            </button>
            <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
            <button
              onClick={() => navigate('/privacy')}
              className={`transition-colors ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/70'}`}
            >
              Privacy Policy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
