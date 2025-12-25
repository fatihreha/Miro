import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Gavel, Scale, AlertTriangle, CreditCard, Ban, HeartPulse, UserCheck, Users, Bot, Lock, Globe } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';

export const Terms: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { setTabBarVisible } = useLayout();
    const isLight = theme === 'light';

    useEffect(() => {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    return (
        <div className={`min-h-full pb-20 relative font-sans ${isLight ? 'bg-[#f0f4f8]' : 'bg-black text-white'}`}>

            {/* Background FX */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-[#f0f4f8]' : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0f0f11] via-[#000000] to-[#000000]'}`}></div>
                <div className={`absolute top-[-20%] left-[-20%] w-[900px] h-[900px] rounded-full filter blur-[120px] animate-blob ${isLight ? 'bg-indigo-300/30' : 'bg-brand-indigo/20'}`}></div>
                <div className={`absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full filter blur-[100px] animate-blob ${isLight ? 'bg-lime-300/30' : 'bg-brand-lime/10'}`} style={{ animationDelay: '-5s' }}></div>
            </div>

            {/* Header */}
            <div className={`sticky top-0 z-30 p-6 pt-safe-top backdrop-blur-xl border-b flex items-center gap-4 transition-colors ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/60 border-white/5'}`}>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border ${isLight ? 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-display font-bold tracking-tight">Terms of Service</h1>
            </div>

            <div className="relative z-10 px-6 pt-8 space-y-8 pb-32 max-w-3xl mx-auto">

                <div className="space-y-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-brand-indigo/10 border-brand-indigo/20 text-brand-indigo'}`}>
                        <Gavel size={12} /> TERMS & CONDITIONS v3.2.0
                    </div>
                    <h2 className="text-4xl font-display font-black leading-tight tracking-tight">
                        Fair Play, <br />
                        <span className="text-brand-lime">Absolute Rules.</span>
                    </h2>
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        By entering the SportPulse Platform or creating an account, you unconditionally accept the terms below. This agreement is a legally binding contract. Last updated: December 19, 2024
                    </p>
                </div>

                {/* Physical Meeting Safety Warning */}
                <div className={`p-6 rounded-[24px] border border-dashed flex gap-4 ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'}`}>
                    <AlertTriangle size={24} className="text-amber-500 shrink-0" />
                    <div className={`text-xs leading-relaxed ${isLight ? 'text-amber-800' : 'text-amber-200/80'}`}>
                        <strong className="text-amber-500">Important Safety Notice:</strong> It is highly recommended that physical meetings with individuals met through the platform take place in public areas. SportPulse does not supervise physical interactions between users. Always prioritize your safety.
                    </div>
                </div>

                <GlassCard className={`p-8 space-y-10 overflow-hidden ${isLight ? 'bg-white/80' : 'bg-white/5 border-white/10'}`}>

                    {/* 1. Acceptance */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><FileText size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">1. Acceptance of Terms</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>By accessing or using SportPulse ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 2. Age Requirements */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><UserCheck size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">2. Age Requirements</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>You must be <strong>at least 18 years old</strong> to create an account and use SportPulse. By creating an account, you represent and warrant that you meet this age requirement. We reserve the right to request proof of age and terminate accounts of users who do not meet this requirement.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 3. User Accounts */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Lock size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">3. User Accounts</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>You must create an account to use certain features of the App. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 4. Health & Physical Activity Disclaimer */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20 text-red-400"><HeartPulse size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">4. Health and Safety Disclaimer</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>SportPulse is solely an intermediary platform connecting athletes. The Platform holds <strong>no legal liability</strong> for any <strong>injuries, health issues, or accidents</strong> occurring during any sport activity. Every user is responsible for their own physical capacity and health status.</p>
                            <p><strong>Important:</strong> Consult with a healthcare professional before beginning any exercise program. Physical activities carry inherent risks of injury. SportPulse does not provide medical advice.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 5. Community Standards & Prohibited Conduct */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-lime/20 text-brand-lime"><Ban size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">5. Community Standards & Prohibited Conduct</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>Harassment, insults, fake profiles, or abuse are strictly prohibited. Accounts with a <strong>Reliability Rating falling below 1.5</strong> or those receiving serious reports will be automatically suspended or permanently terminated by the system.</p>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Use the App for any illegal or unauthorized purpose</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Upload false, misleading, or inappropriate content</li>
                                <li>Impersonate any person or entity</li>
                                <li>Attempt to access other users' accounts or data</li>
                                <li>Use automated systems (bots) to interact with the App</li>
                            </ul>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 6. Subscriptions and Refunds */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><CreditCard size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">6. Subscriptions and Refunds</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>All paid subscription plans (e.g., Gold membership) are billed monthly or annually as selected. <strong>Payments are non-refundable</strong> except in cases where required by law.</p>
                            <p><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period. You can cancel your subscription at any time through your device's subscription settings (App Store or Google Play).</p>
                            <p><strong>No Withdrawal Right:</strong> As this is a digital service, the right of withdrawal does not apply once you access subscription features, in accordance with EU Consumer Rights Directive Article 16(m).</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 7. Content Ownership & IP */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><Shield size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">7. Content Ownership & Intellectual Property</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>You retain ownership of any content you upload (e.g., profile photos, posts). By uploading content, you grant SportPulse a non-exclusive, worldwide license to use, display, and distribute your content solely for the purpose of operating and improving the App.</p>
                            <p>All trademarks, logos, and service marks displayed on the App are the property of SportPulse or third parties. You may not use these without prior written consent.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 8. Account Termination */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400"><Ban size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">8. Account Termination</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason, with or without notice. You may also delete your account at any time through the app settings.</p>
                            <p><strong>KVKK Compliance:</strong> Account deletion requests are processed within 30 days as required by Turkish Personal Data Protection Law (KVKK No. 6698).</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 9. AI-Generated Content */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400"><Bot size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">9. AI-Generated Content Disclaimer</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>Certain features may use AI-generated content (e.g., workout recommendations, match suggestions). <strong>AI outputs are not guaranteed to be accurate</strong> and should not be relied upon as professional advice. Always verify AI-generated information independently.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 10. Pro Trainer Terms */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400"><Users size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">10. Pro Trainer Terms</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>Users offering professional training services ("Pro Trainers") must maintain appropriate certifications and insurance. <strong>SportPulse is not liable for injuries or disputes arising from Pro Trainer services.</strong> All Pro Trainers operate as independent contractors, not employees of SportPulse.</p>
                            <p>Pro Trainers must disclose their qualifications and certifications in their profiles. Misrepresentation of credentials is grounds for immediate account termination.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 11. Reliability Rating System */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400"><Scale size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">11. Reliability Rating System</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>All users are assigned a Reliability Rating (1.0-5.0) based on attendance, punctuality, and community feedback. Manipulation of ratings (e.g., fake reviews, rating exchange schemes) is strictly prohibited and may result in account suspension.</p>
                            <p><strong>Low Rating Consequences:</strong> Accounts with ratings below 2.0 for 30 consecutive days may be automatically restricted from booking new matches.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 12. Physical Meeting Liability */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20 text-red-400"><AlertTriangle size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">12. Physical Meeting & In-Person Activity Disclaimer</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p><strong>Critical Safety Notice:</strong> SportPulse facilitates connections between users but is <strong>not responsible for any incidents, injuries, theft, or disputes</strong> occurring during physical meetings or sports activities. Users meet at their own risk.</p>
                            <p><strong>Safety Recommendations:</strong> Always meet in public places, inform someone of your whereabouts, and trust your instincts. Report any suspicious behavior immediately through the app.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 13. Disclaimer of Warranties */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-500/20 text-slate-400"><Shield size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">13. Disclaimer of Warranties</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee uninterrupted or error-free operation, nor do we warrant the accuracy or reliability of any content or user-generated information.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 14. Limitation of Liability */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-500/20 text-gray-400"><Gavel size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">14. Limitation of Liability</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPORTPULSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES arising from your use of the App, including but not limited to loss of data, profits, or goodwill, even if advised of the possibility of such damages.</p>
                            <p>Our total liability for any claims related to the App shall not exceed the amount you paid for subscription services in the 12 months preceding the claim.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 15. Governing Law & Dispute Resolution */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Globe size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">15. Governing Law & Dispute Resolution</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>These Terms are governed by the laws of the <strong>Republic of Turkey</strong>. Any disputes arising from these Terms or your use of the App shall be subject to the exclusive jurisdiction of the courts of <strong>Istanbul, Turkey</strong>.</p>
                            <p><strong>Dispute Resolution:</strong> Before initiating legal proceedings, parties agree to attempt good faith negotiation for 30 days. If unresolved, disputes shall be settled in Istanbul courts in accordance with Turkish law.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 16. Changes to Terms */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400"><FileText size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">16. Changes to These Terms</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>We may update these Terms from time to time. We will notify you of material changes via email or in-app notification at least 30 days before the changes take effect. Your continued use of the App after the effective date constitutes acceptance of the updated Terms.</p>
                        </div>
                    </section>

                    <div className={`h-px w-full ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                    {/* 17. Contact Information */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400"><FileText size={20} /></div>
                            <h3 className="text-xl font-bold font-display uppercase tracking-wider">17. Contact Information</h3>
                        </div>
                        <div className={`space-y-4 text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <p>For questions about these Terms or to report violations, contact us at:</p>
                            <ul className="list-none space-y-2">
                                <li><strong>Legal Inquiries:</strong> legal@sportpulse.app</li>
                                <li><strong>Privacy Concerns:</strong> privacy@sportpulse.app</li>
                                <li><strong>General Support:</strong> support@sportpulse.app</li>
                            </ul>
                        </div>
                    </section>

                </GlassCard>

                {/* Footer with related links */}
                <div className={`text-center space-y-3 px-4 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                    <p className="text-xs">
                        By using SportPulse, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs">
                        <button onClick={() => navigate('/privacy')} className="hover:underline">
                            Privacy Policy
                        </button>
                        <span>•</span>
                        <button onClick={() => navigate('/faq')} className="hover:underline">
                            FAQ
                        </button>
                    </div>
                    <p className="text-xs opacity-60">© 2025 SportPulse. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};
