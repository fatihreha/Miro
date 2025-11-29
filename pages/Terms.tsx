import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';

export const Terms: React.FC = () => {
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
                <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Terms of Use</h1>
            </div>

            <GlassCard className={`p-6 animate-slide-up ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <div className={`space-y-6 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/80'}`}>

                    <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <FileText size={24} />
                        <span className="font-bold">Please read these terms carefully before using SportPulse.</span>
                    </div>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>1. Acceptance of Terms</h3>
                        <p>By accessing or using SportPulse ("the App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>2. User Accounts</h3>
                        <p>You must create an account to use certain features of the App. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>3. Prohibited Conduct</h3>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Use the App for any illegal or unauthorized purpose</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Upload false, misleading, or inappropriate content</li>
                            <li>Impersonate any person or entity</li>
                            <li>Attempt to access other users' accounts or data</li>
                            <li>Use automated systems (bots) to interact with the App</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>4. Premium Subscription</h3>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 my-3">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">SportPulse Gold Membership</h4>
                            <p className="mb-2">Our premium subscription service includes:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Unlimited daily swipes</li>
                                <li>AI Personal Trainer access</li>
                                <li>Ability to create and manage clubs</li>
                                <li>See who liked you</li>
                                <li>Advanced filters and search options</li>
                                <li>Monthly profile boost</li>
                            </ul>
                        </div>

                        <h4 className="font-bold mt-4 mb-2">Auto-Renewal</h4>
                        <p>Your subscription will automatically renew at the end of each billing period unless you cancel at least 24 hours before the renewal date. You will be charged through your Apple ID or Google Play account upon purchase confirmation.</p>

                        <h4 className="font-bold mt-4 mb-2">Cancellation</h4>
                        <p>You can cancel your subscription at any time through your App Store or Google Play account settings. Cancellation will take effect at the end of the current billing period. No refunds will be provided for unused portions of your subscription.</p>

                        <h4 className="font-bold mt-4 mb-2">Free Trial</h4>
                        <p>If a free trial is offered, you will be charged the full subscription price when the trial period ends unless you cancel before the trial expires.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>5. Content Ownership</h3>
                        <p>You retain ownership of any content you submit to the App. By posting content, you grant SportPulse a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content within the App.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>6. Account Termination</h3>
                        <p>We reserve the right to suspend or terminate your account at our discretion if you violate these Terms or engage in conduct that we deem harmful to other users or the App.</p>
                        <p className="mt-2">You may delete your account at any time through the Privacy Settings page. Upon deletion, your personal data will be permanently removed in accordance with our Privacy Policy.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>7. AI-Generated Content</h3>
                        <p>The App includes AI-powered features, including the AI Personal Trainer. AI-generated content is provided for informational purposes only and should not be considered professional advice. We do not guarantee the accuracy or reliability of AI-generated content.</p>
                        <p className="mt-2">Users can report inappropriate or inaccurate AI responses using the feedback tools provided within the App.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>8. Disclaimer of Warranties</h3>
                        <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>9. Limitation of Liability</h3>
                        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPORTPULSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE APP.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>10. Changes to Terms</h3>
                        <p>We may update these Terms from time to time. We will notify you of material changes by posting a notice in the App or sending you an email. Your continued use of the App after such changes constitutes your acceptance of the new Terms.</p>
                    </section>

                    <section>
                        <h3 className={`font-bold text-lg mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>11. Contact Us</h3>
                        <p>If you have any questions about these Terms, please contact us through the Contact page in the App.</p>
                    </section>

                    <div className={`pt-6 mt-6 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                        <p className="text-xs opacity-60">Last Updated: November 28, 2024</p>
                        <p className="text-xs opacity-60 mt-2">
                            Related: <a href="#/privacy" className="underline hover:text-neon-blue">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
