
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { ArrowLeft, ShieldCheck, UploadCloud, Check, DollarSign, Award, Briefcase, CreditCard, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { trainerService } from '../services/trainerService';
import { supabase } from '../services/supabase';

const SPECIALTIES_LIST = [
  'Weight Loss', 'Muscle Building', 'HIIT', 'Yoga', 'Pilates', 
  'Rehab', 'Nutrition', 'Marathon Prep', 'Boxing', 'CrossFit',
  'Strength Training', 'Cardio', 'Functional Training', 'Calisthenics', 
  'Bodybuilding', 'Powerlifting', 'Kickboxing', 'Zumba', 'Spin/Cycling', 
  'Swimming', 'Sports Performance', 'Pre/Post Natal', 'Senior Fitness', 
  'Mobility & Flexibility', 'Mindfulness', 'Triathlon', 'Dance', 'Barre',
  'MMA', 'Tennis', 'Golf', 'Surfing', 'Climbing', 'Running'
];

export const BecomePro: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [step, setStep] = useState(1);

  // Form State
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [rate, setRate] = useState('50');
  const [experience, setExperience] = useState('3');
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Payment State
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const basePrice = 29.99;
  const finalPrice = discountApplied ? 0 : basePrice;

  const toggleSpecialty = (spec: string) => {
    hapticFeedback.light();
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else {
      if (specialties.length < 10) { // Increased limit to 10
        setSpecialties([...specialties, spec]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      hapticFeedback.success();
    }
  };

  const handleApplyCoupon = async () => {
    hapticFeedback.medium();
    
    try {
      // Check coupon in database
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon && !error) {
        // Check if coupon is still valid (not expired, has uses left)
        const now = new Date();
        const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;
        const hasUsesLeft = coupon.max_uses === null || coupon.uses_count < coupon.max_uses;

        if (!isExpired && hasUsesLeft) {
          setDiscountApplied(true);
          notificationService.showNotification("Coupon Applied!", { 
            body: `${coupon.discount_percent}% discount activated!` 
          });
          hapticFeedback.success();
          
          // Increment usage count
          await supabase
            .from('coupons')
            .update({ uses_count: (coupon.uses_count || 0) + 1 })
            .eq('id', coupon.id);
          return;
        }
      }
      
      notificationService.showNotification("Invalid Code", { body: "Please check your coupon code." });
      hapticFeedback.error();
    } catch (error) {
      console.error('Coupon validation error:', error);
      notificationService.showNotification("Error", { body: "Could not validate coupon. Please try again." });
      hapticFeedback.error();
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    hapticFeedback.medium();

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update local state
    await updateUser({
      isTrainer: true,
      verificationStatus: 'verified',
      specialties: specialties,
      hourlyRate: parseInt(rate),
      yearsExperience: parseInt(experience),
      certificates: fileName ? [fileName] : [],
      userLevel: (user?.userLevel || 0) + 5,
      level: 'Pro'
    });

    // Persist to database - create trainer profile
    if (user) {
      try {
        // Update user record
        await supabase
          .from('users')
          .update({
            is_pro_trainer: true,
            verification_status: 'verified',
            skill_level: 'Pro',
            hourly_rate: parseInt(rate)
          })
          .eq('id', user.id);

        // Create trainer record
        await supabase
          .from('trainers')
          .upsert({
            user_id: user.id,
            specialties: specialties,
            hourly_rate: parseInt(rate),
            years_experience: parseInt(experience),
            certificates: fileName ? [fileName] : [],
            rating: 5.0,
            total_sessions: 0,
            availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startHour: '09:00', endHour: '17:00' }
          }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Error creating trainer profile:', error);
      }
    }

    setIsProcessing(false);
    hapticFeedback.success();
    notificationService.showNotification("Welcome Pro!", { body: "Your trainer profile is now live." });
    navigate('/profile');
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Professional Profile</h2>
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Set up your trainer card.</p>
      </div>

      <div>
        <label className={`text-xs font-bold uppercase tracking-wider mb-3 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Select Specialties (Max 10)</label>
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {SPECIALTIES_LIST.map(spec => (
            <GlassSelectable
              key={spec}
              selected={specialties.includes(spec)}
              onClick={() => toggleSpecialty(spec)}
              className="!py-2 !px-3 !text-xs"
            >
              {spec}
            </GlassSelectable>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Hourly Rate ($)</label>
          <GlassInput 
            type="number" 
            value={rate} 
            onChange={e => setRate(e.target.value)} 
            className={`text-center font-bold ${isLight ? 'bg-slate-50 border-slate-200' : ''}`}
          />
        </div>
        <div>
          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Years Exp.</label>
          <GlassInput 
            type="number" 
            value={experience} 
            onChange={e => setExperience(e.target.value)} 
            className={`text-center font-bold ${isLight ? 'bg-slate-50 border-slate-200' : ''}`}
          />
        </div>
      </div>

      <GlassButton 
        onClick={() => setStep(2)} 
        disabled={specialties.length === 0 || !rate} 
        className="w-full mt-4"
      >
        Next Step
      </GlassButton>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-slide-up">
       <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Verification</h2>
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Upload your PT Certificate or ID.</p>
      </div>

      <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${fileName ? 'border-green-500/50 bg-green-500/10' : (isLight ? 'border-slate-300 bg-slate-50' : 'border-white/20 bg-white/5')}`}>
        <input type="file" id="cert-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
        <label htmlFor="cert-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${fileName ? 'bg-green-500 text-white' : (isLight ? 'bg-white text-slate-400 shadow-sm' : 'bg-white/10 text-white/40')}`}>
             {fileName ? <Check size={32} /> : <UploadCloud size={32} />}
          </div>
          <div>
            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{fileName || "Tap to Upload"}</div>
            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{fileName ? "Document ready" : "PDF, JPG or PNG"}</div>
          </div>
        </label>
      </div>

      <div className={`p-4 rounded-xl text-xs leading-relaxed flex gap-3 ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-200'}`}>
         <ShieldCheck size={20} className="shrink-0" />
         <div>Your documents are encrypted and only visible to our verification team. Verification usually takes 24 hours.</div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setStep(1)} className={`px-6 py-4 rounded-2xl font-bold text-sm transition ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-white/60 hover:bg-white/10'}`}>
           Back
        </button>
        <GlassButton 
          onClick={() => setStep(3)} 
          disabled={!fileName} 
          className="flex-1"
        >
          Verify & Continue
        </GlassButton>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-slide-up">
       <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
            <Award className="text-white" size={32} />
        </div>
        <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Membership</h2>
        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Unlimited client bookings & 0% commission.</p>
      </div>

      <GlassCard className={`p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>Monthly Subscription</span>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${basePrice}</span>
          </div>
          
          {discountApplied && (
             <div className="flex justify-between items-center mb-4 text-green-500 animate-pulse">
                <span className="font-bold flex items-center gap-1"><Tag size={14} /> Coupon Applied</span>
                <span className="font-bold">-${basePrice}</span>
            </div>
          )}

          <div className={`h-px my-4 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          
          <div className="flex justify-between items-center text-lg">
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Total Today</span>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${finalPrice.toFixed(2)}</span>
          </div>
      </GlassCard>

      {!discountApplied && (
          <div className="flex gap-2">
              <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><Tag size={16} /></div>
                  <GlassInput 
                    placeholder="Coupon Code" 
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className={`pl-10 ${isLight ? 'bg-slate-50 border-slate-200' : ''}`}
                  />
              </div>
              <GlassButton variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>
                  Apply
              </GlassButton>
          </div>
      )}

      <div className="pt-2">
          <GlassButton 
            onClick={handleComplete} 
            className="w-full shadow-xl shadow-neon-blue/20 h-14"
            disabled={isProcessing}
          >
            {isProcessing ? 'Activating Pro...' : (discountApplied ? 'Activate for Free' : 'Pay & Activate')}
          </GlassButton>
          <button onClick={() => setStep(2)} className={`w-full py-4 text-xs font-bold mt-2 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'}`}>
              Back to Verification
          </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full px-6 pt-6 pb-24 relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
           <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Become a Pro</div>
            <div className="flex gap-1 h-1 mt-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`flex-1 transition-colors ${step >= 1 ? 'bg-neon-blue' : 'bg-transparent'}`} />
                <div className={`flex-1 transition-colors ${step >= 2 ? 'bg-neon-blue' : 'bg-transparent'}`} />
                <div className={`flex-1 transition-colors ${step >= 3 ? 'bg-neon-blue' : 'bg-transparent'}`} />
            </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
      </div>
    </div>
  );
};
