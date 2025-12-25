
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { X, Star, Zap, Eye, Filter, Infinity, AlertCircle, Crown, Sparkles, Check, Bot, Rocket, Users, MessageSquare, Tag, Home } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPackage } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';

export const Premium: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // Check if triggered by Special Offer
  const isSpecialOffer = location.state?.specialOffer === true;

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'GOLD' | 'PRO'>('PRO');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const data = await subscriptionService.getOfferings();
        setPackages(data);
        // Default select annual pro
        const defaultPkg = data.find(p => p.tier === 'PRO' && p.packageType === 'ANNUAL');
        if (defaultPkg) setSelectedPlanId(defaultPkg.identifier);
      } catch (err) {
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  // Filter packages based on active tier
  const displayedPackages = packages.filter(p => p.tier === selectedTier);

  // Update selected plan when tier changes
  useEffect(() => {
      const defaultForTier = packages.find(p => p.tier === selectedTier && p.packageType === 'ANNUAL');
      if (defaultForTier) setSelectedPlanId(defaultForTier.identifier);
  }, [selectedTier, packages]);

  const handleSubscribe = async () => {
    if (!selectedPlanId || !user) return;
    setIsPurchasing(selectedPlanId);
    setError(null);

    try {
      const { success, tier } = await subscriptionService.purchasePackage(selectedPlanId, user.id);

      if (success) {
        notificationService.showNotification(`Welcome to Bind ${tier === 'pro' ? 'Pro' : 'Gold'}!`, {
          body: "Your subscription is now active."
        });
        updateUser({ isPremium: true, subscriptionTier: tier });
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
    const { restored, tier } = await subscriptionService.restorePurchases(user.id);
    setIsPurchasing(null);

    if (restored) {
      updateUser({ isPremium: true, subscriptionTier: tier || 'gold' });
      notificationService.showNotification("Purchases Restored", { body: "Welcome back!" });
      navigate('/');
    } else {
      setError("No previous purchases found.");
    }
  };

  // Feature Lists
  const goldFeatures = [
    { icon: Infinity, title: 'Unlimited Swipes', desc: 'No daily limits.' },
    { icon: Eye, title: 'See Who Likes You', desc: 'Reveal your admirers.' },
    { icon: Filter, title: 'Advanced Filters', desc: 'Filter by height, habits & more.' },
    { icon: Star, title: '5 Super Likes/Week', desc: 'Stand out from the crowd.' },
  ];

  const proFeatures = [
    { icon: Crown, title: 'Create Clubs', desc: 'Build your own sports community.' },
    { icon: Rocket, title: '10x Monthly Boost', desc: 'Be the top profile in your area.' },
    { icon: Bot, title: 'AI Personal Trainer', desc: 'Unlimited AI coaching & plans.' },
    { icon: MessageSquare, title: 'Message Before Match', desc: 'Send a note with your like.' },
    { icon: Zap, title: 'All Gold Features', desc: 'Everything in Gold included.' },
  ];

  const currentFeatures = selectedTier === 'PRO' ? proFeatures : goldFeatures;
  const themeColor = selectedTier === 'PRO' ? 'brand-lime' : 'amber-400';
  const themeGradient = selectedTier === 'PRO' 
    ? 'from-brand-lime to-emerald-500' 
    : 'from-amber-400 to-orange-500';

  return (
    <div className="h-full w-full relative overflow-y-auto no-scrollbar bg-transparent font-sans">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-b from-slate-100 via-white to-white' : 'bg-[#000000]'}`} />
         <div className={`absolute top-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-all duration-700 ${selectedTier === 'PRO' ? 'bg-brand-lime/20' : 'bg-amber-500/20'}`} />
         <div className={`absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-all duration-700 ${selectedTier === 'PRO' ? 'bg-brand-indigo/30' : 'bg-orange-600/20'}`} style={{ animationDelay: '2s' }} />
         <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
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

        {/* Tier Switcher */}
        <div className="flex justify-center mb-8">
            <div className={`flex p-1 rounded-full backdrop-blur-xl border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/10 border-white/10'}`}>
                <button
                    onClick={() => { hapticFeedback.light(); setSelectedTier('GOLD'); }}
                    className={`px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${selectedTier === 'GOLD' ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/50 hover:text-white')}`}
                >
                    Gold
                </button>
                <button
                    onClick={() => { hapticFeedback.light(); setSelectedTier('PRO'); }}
                    className={`px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${selectedTier === 'PRO' ? 'bg-brand-lime text-black shadow-lg shadow-brand-lime/30' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/50 hover:text-white')}`}
                >
                    Pro
                </button>
            </div>
        </div>

        {/* Header Icon */}
        <div className="text-center mb-8 animate-pop" key={selectedTier}>
          <div className="relative inline-block mb-4">
             <div className={`absolute inset-0 blur-3xl opacity-60 rounded-full animate-pulse-slow bg-${selectedTier === 'PRO' ? 'brand-lime' : 'amber-500'}/40`}></div>
             <div className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 border border-white/10 transition-colors duration-500 ${isLight ? 'bg-slate-900' : 'bg-black/80 backdrop-blur-xl'}`}>
                {selectedTier === 'PRO' ? (
                    <Crown size={48} className="text-brand-lime drop-shadow-[0_0_15px_rgba(222,255,144,0.6)]" strokeWidth={1.5} />
                ) : (
                    <Star size={48} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" strokeWidth={1.5} />
                )}
             </div>
          </div>
          
          <h1 className={`text-4xl font-display font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Bind <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeGradient}`}>
                {selectedTier === 'PRO' ? 'Pro' : 'Gold'}
            </span>
          </h1>
          <p className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
            {selectedTier === 'PRO' ? 'The ultimate athlete experience.' : 'Upgrade your discovery game.'}
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 gap-3 mb-10 animate-slide-up">
            {currentFeatures.map((item, idx) => (
                <GlassCard 
                    key={idx} 
                    className={`p-4 flex items-center gap-4 border-0 transition-all duration-500 ${isLight ? 'bg-white/70 shadow-sm border border-slate-200' : 'bg-white/5'}`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${isLight ? 'bg-slate-100' : 'bg-white/10'} ${selectedTier === 'PRO' ? (isLight ? 'text-green-600' : 'text-brand-lime') : 'text-amber-400'}`}>
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
                <div className={`w-8 h-8 border-2 border-${themeColor} border-t-transparent rounded-full animate-spin`} />
             </div>
        ) : (
            <div className="space-y-4 animate-slide-up flex-1">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs mb-4">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                {displayedPackages.map((pkg) => {
                    const isSelected = selectedPlanId === pkg.identifier;
                    const isAnnual = pkg.packageType === 'ANNUAL';
                    const activeColor = selectedTier === 'PRO' ? 'border-brand-lime bg-brand-lime/10' : 'border-amber-400 bg-amber-400/10';
                    const badgeColor = selectedTier === 'PRO' ? 'bg-brand-lime text-black' : 'bg-amber-400 text-black';
                    
                    // Logic to show 50% discount if specialOffer is active and it's an Annual Plan
                    const showDiscount = isSpecialOffer && isAnnual;
                    const originalPrice = pkg.priceString; // e.g. "$119.99"
                    
                    // Quick rough calculation for display purposes
                    const numericPrice = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
                    const discountedPrice = showDiscount 
                        ? `$${(numericPrice * 0.5).toFixed(2)}` 
                        : originalPrice;

                    return (
                        <div 
                            key={pkg.identifier}
                            onClick={() => { 
                                setSelectedPlanId(pkg.identifier); 
                                hapticFeedback.light(); 
                            }}
                            className={`
                                relative rounded-[24px] border transition-all duration-300 cursor-pointer overflow-hidden group
                                ${isSelected 
                                    ? `${activeColor} shadow-lg scale-[1.02]` 
                                    : (isLight ? 'border-slate-200 bg-white/70 shadow-sm' : 'border-white/10 bg-white/5 hover:bg-white/10')
                                }
                            `}
                        >
                            {/* Best Value / Discount Badge */}
                            {(isAnnual || showDiscount) && (
                                <div className={`absolute top-0 right-0 ${showDiscount ? 'bg-red-500 text-white' : badgeColor} text-[9px] font-bold px-3 py-1.5 rounded-bl-xl shadow-lg z-10 animate-pulse-slow`}>
                                    {showDiscount ? '50% OFF GRANT' : 'BEST VALUE'}
                                </div>
                            )}

                            <div className="p-5 flex justify-between items-center relative z-0">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${isSelected ? (selectedTier === 'PRO' ? 'border-brand-lime bg-brand-lime text-black' : 'border-amber-400 bg-amber-400 text-black') : (isLight ? 'border-slate-300' : 'border-white/20')}
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
                                    {showDiscount && (
                                        <div className="text-xs text-red-400 line-through opacity-70 mb-0.5">{originalPrice}</div>
                                    )}
                                    <div className={`text-xl font-bold font-display ${isSelected ? (selectedTier === 'PRO' ? 'text-brand-lime' : 'text-amber-400') : (isLight ? 'text-slate-900' : 'text-white')}`}>
                                        {discountedPrice}
                                    </div>
                                    {pkg.savings && (
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${selectedTier === 'PRO' ? 'text-brand-lime bg-brand-lime/10' : 'text-amber-400 bg-amber-400/10'}`}>
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
            disabled={!selectedPlanId || !!isPurchasing}
            className={`
                    w-full h-16 text-lg font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all border-0
                    ${selectedTier === 'PRO' 
                        ? 'bg-brand-lime text-black hover:bg-[#caff70] shadow-brand-lime/30' 
                        : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:brightness-110 shadow-orange-500/30'}
                `}
          >
            {isPurchasing && isPurchasing !== 'restore' ? (
              <span className="flex items-center gap-2"><Sparkles className="animate-spin" /> Processing...</span>
            ) : (
              isSpecialOffer ? `Claim ${selectedTier === 'PRO' ? 'Pro' : 'Gold'}` : `Activate ${selectedTier === 'PRO' ? 'Pro' : 'Gold'}`
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
