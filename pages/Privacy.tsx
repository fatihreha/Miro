
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="min-h-full px-6 pt-6 pb-20 relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
           <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Privacy Policy</h1>
      </div>

      <GlassCard className={`p-6 animate-slide-up ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
        <div className={`space-y-6 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
            
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <Shield size={24} />
                <span className="font-bold">Your privacy is our priority.</span>
            </div>

            <section>
                <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>1. Data Collection</h3>
                <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>
            </section>

            <section>
                <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>2. Location Information</h3>
                <p>When you use our services for matching or finding clubs, we collect precise location data about the matching process from the SportPulse app. If you permit the SportPulse app to access location services through the permission system used by your mobile operating system, we may also collect the precise location of your device when the app is running in the foreground or background.</p>
            </section>

            <section>
                <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>3. Data Usage</h3>
                <p>We use the information we collect to provide, maintain, and improve our services, such as to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Drivers, develop safety features, authenticate users, and send product updates and administrative messages.</p>
            </section>

            <section>
                <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>4. Sharing of Information</h3>
                <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: Through our Services, we may share your information with other users if you use match features, e.g., your name and photo.</p>
            </section>

            <div className={`pt-6 mt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <p className="text-xs opacity-60">Last Updated: November 15, 2024</p>
            </div>
        </div>
      </GlassCard>
    </div>
  );
};
