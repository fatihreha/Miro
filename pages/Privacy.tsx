
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, Activity, Globe, Scale, Lock, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setTabBarVisible } = useLayout();
  const isLight = theme === 'light';

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  return (
    <div className="min-h-full px-6 pt-6 pb-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
           <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Privacy Policy</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold">
              GDPR & KVKK COMPLIANT
            </div>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>v2.5.0</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Data Controller Info */}
        <GlassCard className={`p-6 animate-slide-up ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Data Controller Information</h3>
              <div className={`space-y-2 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                <p className="font-semibold">Bind Sports Technologies</p>
                <p>In accordance with the <strong>Turkish Personal Data Protection Law (KVKK) No. 6698</strong> and <strong>EU General Data Protection Regulation (GDPR)</strong>, we are committed to protecting your personal data and respecting your privacy rights.</p>
                <p className="mt-4 text-xs opacity-70">This policy explains how we collect, use, share, and protect your personal information when you use the Bind mobile application and related services.</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Data Categories */}
        <GlassCard className={`p-6 animate-slide-up delay-75 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
              <Activity size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Personal Data We Collect</h3>
              <div className={`space-y-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Identity Information:</span> Name, surname, profile photo, date of birth, gender
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Location Data:</span> GPS coordinates (with 500m deviation for privacy), city, region information
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Contact Information:</span> Email address, phone number (optional)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Health & Fitness Data:</span> Sports interests, fitness level, workout preferences, HealthKit/Google Fit data (with explicit consent)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Usage Data:</span> App interactions, match history, booking records, chat messages
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Visual Data:</span> Photos and videos uploaded by users (biometric data processed with consent)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Transaction Data:</span> Subscription status, payment method (processed by third-party providers: RevenueCat, Stripe)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Legal Basis */}
        <GlassCard className={`p-6 animate-slide-up delay-150 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'}`}>
              <Scale size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Legal Basis for Processing</h3>
              <div className={`space-y-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                <p>We process your personal data based on the following legal grounds under KVKK Article 5 and GDPR Article 6:</p>
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Contract Performance:</span> To provide sports matching, booking, and communication services
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Explicit Consent:</span> For health data, precise location tracking, and biometric photo analysis
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Legitimate Interest:</span> For app improvement, fraud prevention, and security measures
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Legal Obligation:</span> For tax, accounting, and regulatory compliance
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Third Parties & Store Compliance */}
        <GlassCard className={`p-6 animate-slide-up delay-200 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-green-100 text-green-600' : 'bg-green-500/20 text-green-400'}`}>
              <Globe size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Third Parties & Data Sharing</h3>
              <div className={`space-y-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                <p>We share your data with the following service providers under strict data processing agreements:</p>
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Firebase (Google):</span> Authentication, real-time database, cloud storage
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">RevenueCat:</span> Subscription management and billing
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Stripe:</span> Payment processing (we do not store card details)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Google Gemini AI:</span> Profile analysis and match recommendations (anonymized data)
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                  <p className="text-xs">
                    <strong>App Store & Play Store Compliance:</strong> This app complies with Apple's "Safety & Data Use" guidelines and Google's "Data safety" requirements. All data collection practices are disclosed in store listings under GDPR Article 11 transparency rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* User Rights */}
        <GlassCard className={`p-6 animate-slide-up delay-300 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'}`}>
              <Lock size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Your Privacy Rights</h3>
              <div className={`space-y-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
                <p>Under KVKK and GDPR, you have the following rights:</p>
                <div className="space-y-2 mt-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Access:</span> Request a copy of all personal data we hold about you
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Rectification:</span> Update or correct inaccurate information
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Erasure (Right to be Forgotten):</span> Request deletion of your account and all associated data within 30 days
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Data Portability:</span> Receive your data in a structured, machine-readable format (JSON/CSV)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Object:</span> Opt-out of marketing communications and data processing for legitimate interests
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Right to Withdraw Consent:</span> Revoke consent for location, health data, or photo analysis at any time
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 ${isLight ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-xs">
                    <strong>Important:</strong> Exercising certain rights (e.g., data deletion) may limit or prevent you from using Bind services. You may also file a complaint with the Turkish Personal Data Protection Authority (KVKK) or your local data protection authority.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Contact & Updates */}
        <GlassCard className={`p-6 animate-slide-up delay-[350ms] ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <div className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>
            <h3 className={`font-bold text-lg mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Contact Us</h3>
            <p className="mb-3">For privacy-related inquiries, data requests, or to exercise your rights, please contact our Data Protection Officer:</p>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
              <p className="font-semibold mb-1">Email:</p>
              <a href="mailto:privacy@bind.app" className="text-brand-lime hover:underline font-mono">privacy@bind.app</a>
            </div>
            <div className={`pt-6 mt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <p className="text-xs opacity-60">
                Last Updated: December 19, 2024 • Version 2.5.0<br />
                Effective Date: January 1, 2025<br />
                We reserve the right to update this policy. Users will be notified of significant changes via in-app notification.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
