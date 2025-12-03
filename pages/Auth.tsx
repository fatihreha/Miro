
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { Mail, Phone, ArrowRight, Smartphone, Loader2, ChevronLeft, Eye, EyeOff, User as UserIcon, Lock, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';
import { authHelpers } from '../services/supabase';
import { userService } from '../services/userService';
import { User } from '../types';

type AuthMethod = 'email' | 'phone';
type AuthMode = 'login' | 'signup';

export const Auth: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const [mode, setMode] = useState<AuthMode>(searchParams.get('mode') === 'login' ? 'login' : 'signup');
    const [method, setMethod] = useState<AuthMethod>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Phone Verification State
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        code: '+1'
    });

    // Error State
    const [error, setError] = useState<string | null>(null);

    // Reset state when method changes
    const handleMethodChange = (newMethod: AuthMethod) => {
        hapticFeedback.light();
        setMethod(newMethod);
        setIsCodeSent(false);
        setOtp(['', '', '', '', '', '']);
        setError(null);
    };

    const handleModeSwitch = () => {
        hapticFeedback.medium();
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setIsCodeSent(false);
        setError(null);
    };

    // ... (keep handleOtpChange and handleOtpKeyDown as is, assuming they are outside the replacement range or I need to include them if I replace a large chunk)
    // Wait, I should target specific blocks to avoid overwriting too much.

    // Let's replace the handleSubmit and the JSX part.


    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); // Only take last char
        setOtp(newOtp);

        // Move forward
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Move backward
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const activateDemoMode = async () => {
        // Production'da demo mode'u devre dışı bırak
        if (import.meta.env.PROD) {
            console.warn('Demo mode is disabled in production');
            setError('Demo mode is not available in production.');
            hapticFeedback.error();
            return;
        }

        console.log("Activating Demo Mode Fallback...");
        notificationService.showNotification("Demo Mode Activated", {
            body: "Logging in with local demo account due to connection status."
        });

        // Create a persistent mock user ID
        const mockId = 'demo-user-' + Math.random().toString(36).substr(2, 9);

        const demoUser: Partial<User> = {
            id: mockId,
            name: formData.name || (mode === 'login' ? 'Demo User' : 'New Athlete'),
            email: formData.email || 'demo@sportpulse.app',
            age: 24,
            location: 'Demo City',
            interests: [],
            level: 'Beginner',
            bio: 'Just exploring the app in demo mode!',
            avatarUrl: `https://i.pravatar.cc/300?u=${mockId}`,
            isPremium: false
        };

        // Call context login to set state without Firebase
        try {
            await login(demoUser as User);
            hapticFeedback.success();

            // Route correctly
            if (mode === 'signup') {
                navigate('/onboarding', {
                    state: {
                        initialData: {
                            ...demoUser,
                            name: formData.name || demoUser.name,
                            email: formData.email
                        }
                    }
                });
            } else {
                navigate('/');
            }
        } catch (e) {
            console.error("Demo login failed", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setError(null); // Clear previous errors
        hapticFeedback.medium();

        // Phone Flow Logic
        if (method === 'phone') {
            if (!isCodeSent) {
                // Step 1: Send Code
                if (!formData.phone || formData.phone.length < 10) {
                    setError("Please enter a valid phone number.");
                    hapticFeedback.error();
                    return;
                }
                setIsLoading(true);
                // Simulate Network Request
                setTimeout(() => {
                    setIsLoading(false);
                    setIsCodeSent(true);
                    hapticFeedback.success();
                    // notificationService.showNotification("Verification Code Sent", { body: "Please check your messages." });
                    // Auto-focus first input
                    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
                }, 1500);
                return;
            } else {
                // Step 2: Verify Code
                const code = otp.join('');
                if (code.length !== 6) {
                    setError("Please enter the 6-digit code.");
                    hapticFeedback.error();
                    return;
                }

                setIsLoading(true);
                // Simulate Verification
                setTimeout(async () => {
                    await activateDemoMode(); // For demo purposes, phone always goes to demo
                    setIsLoading(false);
                }, 1500);
                return;
            }
        }

        // Email Flow Logic
        if (method === 'email') {
            // Validate required fields for both login and signup
            if (!formData.email || !formData.password) {
                setError("Please enter both email and password.");
                hapticFeedback.error();
                return;
            }

            // Additional checks for signup
            if (mode === 'signup') {
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match.");
                    hapticFeedback.error();
                    return;
                }
                if (!formData.name.trim()) {
                    setError("Please enter your full name.");
                    hapticFeedback.error();
                    return;
                }
            }
        }

        setIsLoading(true);

        try {
            let result;

            if (mode === 'signup') {
                // Sign Up
                result = await authHelpers.signUp(formData.email, formData.password, {
                    full_name: formData.name
                });

                if (result.error) throw result.error;

                if (result.data.user) {
                    // Navigate to onboarding - profile will be created there after all data is collected
                    navigate('/onboarding', {
                        state: {
                            initialData: {
                                name: formData.name,
                                email: formData.email,
                                uid: result.data.user.id
                            }
                        }
                    });
                }
            } else {
                // Sign In
                result = await authHelpers.signIn(formData.email, formData.password);

                if (result.error) throw result.error;

                // Login successful - AuthContext will detect session change
                navigate('/');
            }

            hapticFeedback.success();

        } catch (error: any) {
            console.error("Auth Error:", error);

            // Map Supabase errors to user friendly messages
            let msg = error.message || "Authentication failed.";

            if (msg.includes("Invalid login credentials")) msg = "Invalid email or password.";
            if (msg.includes("User already registered")) msg = "Email already exists.";
            if (msg.includes("Password should be")) msg = "Password is too weak.";

            setError(msg);
            hapticFeedback.error();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-transparent selection:bg-neon-blue/30">

            {/* Header */}
            <div className="relative z-10 p-6 pt-8">
                <button
                    onClick={() => navigate('/welcome')}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition backdrop-blur-md"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex flex-col justify-center p-6 pb-10 max-w-md mx-auto w-full">

                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-2 animate-slide-up tracking-tight drop-shadow-lg">
                        {isCodeSent ? 'Verify Code' : (mode === 'login' ? 'Welcome Back' : 'Create Account')}
                    </h1>
                    <p className="text-white/60 animate-slide-up text-lg font-light" style={{ animationDelay: '100ms' }}>
                        {isCodeSent
                            ? `We sent a code to ${formData.code} ${formData.phone}`
                            : (mode === 'login' ? 'Sign in to continue your streak.' : 'Join the club. Find your match.')}
                    </p>
                </div>

                {/* Method Tabs (Hidden if verifying code) */}
                {!isCodeSent && (
                    <div className="flex p-1.5 bg-white/5 rounded-2xl mb-8 border border-white/10 animate-slide-up backdrop-blur-md" style={{ animationDelay: '200ms' }}>
                        <button
                            onClick={() => handleMethodChange('email')}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${method === 'email' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                        >
                            <Mail size={18} /> Email
                        </button>
                        <button
                            onClick={() => handleMethodChange('phone')}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${method === 'phone' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/50 hover:text-white'}`}
                        >
                            <Smartphone size={18} /> Phone
                        </button>
                    </div>
                )}

                <GlassCard className="p-6 sm:p-8 animate-slide-up backdrop-blur-2xl bg-white/[0.05] border-white/20 shadow-2xl" style={{ animationDelay: '300ms' }}>
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Name Field - Only for Email Signup */}
                        {mode === 'signup' && method === 'email' && (
                            <div className="space-y-1.5 animate-slide-up">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1 flex items-center gap-1"><UserIcon size={10} /> Full Name</label>
                                <GlassInput
                                    type="text"
                                    placeholder="e.g. Alex Smith"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/20 border-white/10 focus:bg-black/40 text-white focus:border-neon-blue/50 placeholder-white/30"
                                    required={mode === 'signup'}
                                />
                            </div>
                        )}

                        {method === 'email' && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1">Email Address</label>
                                    <GlassInput
                                        type="email"
                                        placeholder="alex@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-black/20 border-white/10 focus:bg-black/40 text-white focus:border-neon-blue/50 placeholder-white/30"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1">Password</label>
                                    <div className="relative">
                                        <GlassInput
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="bg-black/20 border-white/10 focus:bg-black/40 pr-10 text-white focus:border-neon-blue/50 placeholder-white/30"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                {mode === 'signup' && (
                                    <div className="space-y-1.5 animate-slide-up">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1">Confirm Password</label>
                                        <GlassInput
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className={`bg-black/20 border-white/10 focus:bg-black/40 text-white focus:border-neon-blue/50 placeholder-white/30 ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500/50 focus:border-green-500' : ''}`}
                                            required
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* PHONE INPUT */}
                        {method === 'phone' && !isCodeSent && (
                            <div className="space-y-1.5 animate-slide-up">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1">Phone Number</label>
                                <div className="flex gap-3">
                                    <div className="w-24">
                                        <GlassInput
                                            type="text"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="bg-black/20 border-white/10 focus:bg-black/40 text-white focus:border-neon-blue/50 text-center"
                                            placeholder="+1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <GlassInput
                                            type="tel"
                                            placeholder="555-0123"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-black/20 border-white/10 focus:bg-black/40 text-white focus:border-neon-blue/50 placeholder-white/30"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/40 pl-1">We will send a verification code to this number.</p>
                            </div>
                        )}

                        {/* 6 DIGIT CODE INPUT */}
                        {method === 'phone' && isCodeSent && (
                            <div className="space-y-4 animate-slide-up">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 ml-1 flex items-center gap-1">
                                    <Lock size={10} /> Enter 6-Digit Code
                                </label>
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpInputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className={`
                                        w-full h-12 sm:h-14 rounded-xl bg-black/20 border border-white/10 
                                        text-center text-xl font-bold text-white 
                                        focus:outline-none focus:border-neon-blue focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,242,255,0.1)]
                                        transition-all duration-200 caret-neon-blue
                                    `}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsCodeSent(false)}
                                    className="text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 mx-auto transition-colors"
                                >
                                    <Edit2 size={10} /> Change Number
                                </button>
                            </div>
                        )}

                        {/* Error Message Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 animate-slide-up">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <p className="text-red-200 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <GlassButton type="submit" className="w-full h-14 text-lg shadow-xl shadow-blue-900/20" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <span className="flex items-center justify-center gap-2">
                                        {method === 'phone' && !isCodeSent
                                            ? 'Send Verification Code'
                                            : (mode === 'login' ? 'Sign In' : 'Create Account')
                                        }
                                        {!isLoading && <ArrowRight size={20} />}
                                    </span>
                                )}
                            </GlassButton>
                        </div>
                    </form>
                </GlassCard>

                {/* Footer & Legal */}
                <div className="mt-8 text-center space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <p className="text-white/40 text-sm">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={handleModeSwitch}
                            className="ml-2 text-white font-bold hover:text-neon-blue transition-colors focus:outline-none"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
