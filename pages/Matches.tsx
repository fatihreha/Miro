
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassSelectable, GlassCard, GlassButton } from '../components/ui/Glass';
import { ChevronRight, ChevronLeft, MapPin, Calendar, Check, Clock, Activity, ArrowRight, Bell, Crown, Lock, Heart, Zap, Star, X, Loader2, StopCircle, Radio, Shield, Timer, AlertTriangle, UserX, TimerReset, ShieldAlert, Users, Footprints, Watch, ShieldCheck, Play } from 'lucide-react';
import { User, SportType, ActivityRequest } from '../types';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import { matchService } from '../services/matchService';
import { realtimeManager } from '../services/realtimeManager';
import { TimeStatusPanel } from '../components/ui/TimeStatusPanel';
import { ratingService } from '../services/ratingService';
import { useLayout } from '../context/LayoutContext';

// Mock data removed

// Simple Workout Session Overlay Component
const WorkoutSessionOverlay: React.FC<{ request: ActivityRequest; onEnd: () => void }> = ({ request, onEnd }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = request.startedAt ? new Date(request.startedAt).getTime() : Date.now();
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [request.startedAt]);

    const formatElapsed = (s: number) => {
        const h = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `\${h > 0 ? h + ':' : ''}\${mins < 10 && h > 0 ? '0' : ''}\${mins}:\${secs < 10 ? '0' : ''}\${secs}`;
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-fade-in">
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full mix-blend-screen filter blur-[120px] animate-blob bg-red-600/20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob bg-orange-600/10"></div>
            </div>

            <div className="relative z-20 flex justify-between items-center px-6 pt-safe-top py-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                        <div className="absolute w-5 h-5 border border-red-500/30 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 italic">Session Live</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5"><Radio size={10} className="text-brand-lime" /> Encrypted</span>
                </div>
            </div>

            <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 pb-20">
                <GlassCard variant="dark-always" className="w-full max-w-sm p-8 text-center bg-black/40 border-white/10">
                    <div className="mb-8">
                        <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mb-4">Total Elapsed Time</div>
                        <h2 className="text-7xl font-display font-black text-brand-lime tracking-tight drop-shadow-[0_0_20px_rgba(222,255,144,0.4)]">{formatElapsed(elapsed)}</h2>
                    </div>

                    <div className="h-px w-1/2 mx-auto bg-white/10 mb-8"></div>

                    <div className="flex flex-col items-center">
                        <div className="relative mb-6">
                            <div className="relative w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-brand-lime via-white to-brand-indigo">
                                <img src={request.senderAvatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-display font-bold text-white mb-1 uppercase tracking-wider">{request.senderName}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Training Partner • {request.sport}</p>
                    </div>
                </GlassCard>

                <button
                    onClick={onEnd}
                    className="w-full max-w-sm mt-12 h-22 rounded-[32px] bg-red-500/10 border-2 border-red-500/40 text-white font-display font-bold text-2xl uppercase tracking-widest shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <StopCircle size={32} fill="currentColor" className="text-red-500" />
                    <span>Finish Workout</span>
                </button>
            </div>
        </div>
    );
};

// Simple Rating Modal Component
const PostWorkoutRating: React.FC<{ isOpen: boolean; partnerId: string; partnerName: string; partnerAvatar: string; onClose: () => void }> = ({ isOpen, partnerId, partnerName, partnerAvatar, onClose }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        hapticFeedback.success();
        await ratingService.rateUser(partnerId, rating, comment);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl"></div>
            <div className="absolute inset-0" onClick={onClose} />

            <GlassCard variant="dark-always" className="w-full max-w-sm relative z-10 animate-pop p-8 overflow-hidden bg-black/40 border-white/10">
                <div className="text-center">
                    <div className="mb-8 relative">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-lime to-brand-indigo">
                                <img src={partnerAvatar} className="w-full h-full rounded-full object-cover border-4 border-black" alt="" />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-4xl font-display font-black text-white mb-2 uppercase">Session Finished!</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-10">Rate {partnerName}</p>

                    <div className="flex justify-center gap-4 mb-10">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onClick={() => { hapticFeedback.light(); setRating(star); }}
                                className="transition-all active:scale-90"
                            >
                                <Star
                                    size={36}
                                    className={`transition-colors ${rating >= star ? 'text-brand-lime fill-brand-lime' : 'text-white/10'}`}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add feedback..."
                        className="w-full rounded-[24px] bg-black/40 border border-white/5 p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-lime/50 resize-none h-24 mb-8 placeholder:text-white/20"
                    />

                    <GlassButton
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="w-full h-16 text-lg !bg-brand-lime !text-black border-0"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'RECORD SESSION'}
                    </GlassButton>

                    <button onClick={onClose} className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Skip</button>
                </div>
            </GlassCard>
        </div>
    );
};

// Late Selection Modal - Choose how late you'll be
const LateSelectionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (time: string) => void }> = ({ isOpen, onClose, onSelect }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/60">
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard className="w-full max-w-sm relative z-10 p-6 animate-pop">
                <h3 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>How late will you be?</h3>
                <div className="grid grid-cols-1 gap-2">
                    {['5 min', '10 min', '15 min', '30 min', '1 hour'].map(time => (
                        <button key={time} onClick={() => onSelect(time)} className={`p-4 rounded-xl text-sm font-bold border transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}>
                            {time}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-4 py-2 text-xs font-bold text-white/40 uppercase tracking-widest">Cancel</button>
            </GlassCard>
        </div>
    );
};

// Late Cancel Modal - Warning about penalty
const LateCancelModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/60">
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard className="w-full max-w-sm relative z-10 p-6 animate-pop border-red-500/30">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Late Cancellation</h3>
                <p className="text-white/60 text-sm text-center mb-6">Cancelling within 1 hour of the session results in a penalty to your reliability score. Are you sure?</p>
                <div className="space-y-3">
                    <GlassButton onClick={onConfirm} className="w-full h-12 text-sm !bg-red-500 !text-white border-0">Yes, Cancel Session</GlassButton>
                    <button onClick={onClose} className="w-full py-2 text-xs font-bold text-white/40 uppercase tracking-widest">Keep Session</button>
                </div>
            </GlassCard>
        </div>
    );
};

// No-Show Modal - Report missing partner
const NoShowModal: React.FC<{ isOpen: boolean; partnerName: string; onClose: () => void; onReport: (reason: string) => void; onWait: (mins: number) => void }> = ({ isOpen, partnerName, onClose, onReport, onWait }) => {
    const [step, setStep] = useState<'reason' | 'decision'>('reason');
    const [reason, setReason] = useState('');
    const { theme } = useTheme();
    const isLight = theme === 'light';

    if (!isOpen) return null;

    const reasons = ["Not at location", "No response to chat", "Profile doesn't match person", "Other"];

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/60">
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard className="w-full max-w-sm relative z-10 p-6 animate-pop border-white/20">
                {step === 'reason' ? (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <UserX size={24} />
                            <h3 className="text-xl font-bold">Partner Missing?</h3>
                        </div>
                        <p className={`text-sm mb-6 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Why are you reporting <span className="font-bold text-white">{partnerName}</span> as a no-show?</p>
                        <div className="space-y-2 mb-6">
                            {reasons.map(r => (
                                <button
                                    key={r}
                                    onClick={() => { setReason(r); setStep('decision'); hapticFeedback.light(); }}
                                    className={`w-full p-4 rounded-xl text-left text-sm font-bold border transition-all ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-slide-up text-center">
                        <div className="w-16 h-16 rounded-full bg-brand-lime/20 flex items-center justify-center mx-auto mb-4 text-brand-lime">
                            <TimerReset size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Give them a chance?</h3>
                        <p className="text-white/60 text-sm mb-8">Sometimes athletes run into traffic. Would you like to wait a few more minutes or report now?</p>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onWait(5)}
                                    className="p-4 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-lime hover:text-black transition-all"
                                >
                                    Wait 5m
                                </button>
                                <button
                                    onClick={() => onWait(10)}
                                    className="p-4 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-lime hover:text-black transition-all"
                                >
                                    Wait 10m
                                </button>
                            </div>
                            <GlassButton onClick={() => onReport(reason)} className="w-full h-14 text-sm !bg-red-500 !text-white border-0">
                                Report No-Show & Leave
                            </GlassButton>
                        </div>
                    </div>
                )}
                <button onClick={onClose} className="w-full mt-4 py-2 text-xs font-bold text-white/40 uppercase tracking-widest">Back</button>
            </GlassCard>
        </div>
    );
};

// Training Prep Overlay - Pre-workout ready room
const TrainingPrepOverlay: React.FC<{
    request: ActivityRequest;
    user: User;
    onEnd: () => void;
    onStatusUpdate: (s: 'on_time' | 'late' | 'missed') => void;
    onReadyToggle: () => void;
    onReport: () => void;
    onNoShow: () => void;
    onStartWorkout: () => void;
    extensionMins: number
}> = ({ request, user, onEnd, onStatusUpdate, onReadyToggle, onReport, onNoShow, onStartWorkout, extensionMins }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const isMeSender = request.senderId === user.id;
    const isMeReady = isMeSender ? request.senderReady : request.receiverReady;
    const isPartnerReady = isMeSender ? request.receiverReady : request.senderReady;
    const readyCount = (request.senderReady ? 1 : 0) + (request.receiverReady ? 1 : 0);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            let targetDate = new Date();
            if (request.date.toLowerCase() === 'today') {
                // keep today
            } else if (request.date.toLowerCase() === 'tomorrow') {
                targetDate.setDate(targetDate.getDate() + 1);
            } else {
                const parsed = new Date(request.date);
                if (!isNaN(parsed.getTime())) {
                    targetDate = parsed;
                    targetDate.setFullYear(now.getFullYear());
                }
            }
            const [time, modifier] = request.time.split(' ');
            let [hours, minutes] = time.split(':');
            let h = parseInt(hours);
            if (modifier === 'PM' && h < 12) h += 12;
            if (modifier === 'AM' && h === 12) h = 0;
            targetDate.setHours(h, parseInt(minutes), 0, 0);

            const extendedTime = targetDate.getTime() + (extensionMins * 60 * 1000);
            return extendedTime - now.getTime();
        };
        const update = () => setTimeLeft(calculateTimeLeft());
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [request.date, request.time, extensionMins]);

    const formatDuration = (ms: number) => {
        if (ms < 0) return "SESSION LIVE";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    const isExtended = extensionMins > 0;

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col animate-fade-in touch-none overflow-hidden ${isLight ? 'bg-[#f0f4f8]' : 'bg-black'}`}>
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-[#f0f4f8]' : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0f0f11] via-[#000000] to-[#000000]'}`}></div>
                <div className={`absolute top-[-20%] left-[-20%] w-[900px] h-[900px] rounded-full filter blur-[100px] animate-blob ${isLight ? 'mix-blend-multiply bg-indigo-300/50 opacity-60' : 'mix-blend-screen bg-[#4b29ff]/20'}`} style={{ animationDuration: '25s' }}></div>
                <div className={`absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full filter blur-[100px] animate-blob ${isLight ? 'mix-blend-multiply bg-lime-300/50 opacity-60' : 'mix-blend-screen bg-[#deff90]/15'}`} style={{ animationDelay: '-5s', animationDuration: '20s' }}></div>
            </div>
            <div className="relative z-10 flex flex-col h-full bg-black/40 backdrop-blur-3xl">
                <div className="px-6 pt-safe-top py-4 flex justify-between items-center border-b border-white/10">
                    <button onClick={onEnd} className={`p-2 rounded-full transition-colors ${isLight ? 'bg-black/5 text-slate-800 hover:bg-black/10' : 'bg-white/5 text-white/60 hover:text-white'}`}><X size={24} /></button>
                    <div className="flex flex-col items-center">
                        <h2 className={`text-xl font-display font-bold tracking-widest uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Preparation</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isExtended ? 'bg-amber-500' : 'bg-brand-lime'}`}></span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isExtended ? 'text-amber-500' : 'text-brand-lime'}`}>
                                {isExtended ? 'Extra Time Granted' : 'Awaiting Athletes'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onNoShow} className={`p-2 rounded-full transition-colors ${isLight ? 'bg-black/5 text-slate-500 hover:bg-black/10' : 'bg-white/5 text-white/40 hover:text-red-400'}`} title="Athlete No-Show"><UserX size={20} /></button>
                        <button onClick={onReport} className={`p-2 rounded-full transition-colors ${isLight ? 'bg-black/5 text-red-50 hover:bg-black/10' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}><ShieldAlert size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                    {/* Countdown */}
                    <div className="flex flex-col items-center justify-center py-2 animate-slide-up">
                        <div className={`px-6 py-4 rounded-[32px] border-2 flex flex-col items-center gap-1 backdrop-blur-md transition-colors duration-500 ${isExtended ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : (isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-brand-lime/30 shadow-[0_0_30px_rgba(222,255,144,0.1)]')}`}>
                            <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${isExtended ? 'text-amber-500' : (isLight ? 'text-slate-400' : 'text-brand-lime/70')}`}>{isExtended ? 'Patience is Power' : 'Time to Lockdown'}</div>
                            <div className={`text-5xl font-mono font-black ${isExtended ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : (isLight ? 'text-slate-900' : 'text-brand-lime drop-shadow-[0_0_10px_rgba(222,255,144,0.5)]')}`}>
                                {timeLeft !== null ? formatDuration(timeLeft) : '--:--'}
                            </div>
                        </div>
                    </div>

                    {/* VS Display */}
                    <div className="flex items-center justify-center gap-8 py-4">
                        <div className="flex flex-col items-center gap-3 animate-slide-up">
                            <div className="relative">
                                <img src={user.avatarUrl} className={`w-20 h-20 rounded-full object-cover border-2 transition-all duration-500 ${isMeReady ? 'border-brand-lime shadow-[0_0_20px_rgba(222,255,144,0.4)] scale-110' : 'border-white/10'}`} alt="" />
                                {isMeReady && <div className="absolute -top-1 -right-1 bg-brand-lime text-black p-1 rounded-full animate-pop"><Check size={12} strokeWidth={4} /></div>}
                            </div>
                            <div className="text-center">
                                <div className={`text-sm font-bold leading-none mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>You</div>
                                <div className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{user.level}</div>
                            </div>
                        </div>
                        <div className={`h-10 w-px relative ${isLight ? 'bg-slate-900/10' : 'bg-white/10'}`}>
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-black ${isLight ? 'bg-[#f0f4f8] text-slate-400' : 'bg-black text-white/40'}`}>VS</div>
                        </div>
                        <div className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
                            <div className="relative">
                                <img src={request.senderAvatar} className={`w-20 h-20 rounded-full object-cover border-2 transition-all duration-500 ${isPartnerReady ? 'border-brand-lime shadow-[0_0_20px_rgba(222,255,144,0.4)] scale-110' : 'border-white/10'}`} alt="" />
                                {isPartnerReady && <div className="absolute -top-1 -right-1 bg-brand-lime text-black p-1 rounded-full animate-pop"><Check size={12} strokeWidth={4} /></div>}
                            </div>
                            <div className="text-center">
                                <div className={`text-sm font-bold leading-none mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{request.senderName}</div>
                                <div className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{request.senderLevel || 'Pro'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                        <div className={`flex items-center gap-2 mb-1 opacity-60 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <Watch size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Broadcast Status</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => onStatusUpdate('on_time')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${request.attendanceUpdate === 'on_time' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}><Footprints size={20} className="mb-2" /><span className="text-[9px] font-bold uppercase text-center">On Time</span></button>
                            <button onClick={() => onStatusUpdate('late')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${request.attendanceUpdate === 'late' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}><Timer size={20} className="mb-2" /><span className="text-[9px] font-bold uppercase text-center">Late</span></button>
                            <button onClick={() => onStatusUpdate('missed')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${request.attendanceUpdate === 'missed' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}><AlertTriangle size={20} className="mb-2" /><span className="text-[9px] font-bold uppercase text-center">Cancel</span></button>
                        </div>
                    </div>

                    {/* Safety Info */}
                    <div className={`p-4 rounded-2xl border flex gap-3 animate-slide-up ${isLight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white/5 border-white/5'}`} style={{ animationDelay: '400ms' }}>
                        <Shield size={18} className="text-brand-indigo shrink-0" />
                        <p className={`text-[10px] leading-relaxed font-medium uppercase tracking-wider ${isLight ? 'text-indigo-900/60' : 'text-white/60'}`}>Both athletes must toggle "Ready" before the clock starts. Safety tracking will be active during the session.</p>
                    </div>
                </div>
                {/* Bottom Action */}
                <div className={`p-6 pt-4 border-t backdrop-blur-xl ${isLight ? 'bg-white/90 border-slate-200' : 'bg-black/60 border-white/10'}`}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Users size={16} className={`${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                            <span className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Roster Check</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${readyCount === 2 ? 'bg-brand-lime text-black animate-pop' : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60')}`}>{readyCount}/2 READY</div>
                    </div>
                    {readyCount === 2 ? (
                        <GlassButton onClick={onStartWorkout} className="w-full h-16 text-xl font-display tracking-widest bg-brand-lime text-black border-0 shadow-[0_0_30px_rgba(222,255,144,0.3)] hover:scale-[1.02]">
                            <Play size={20} fill="currentColor" className="mr-2" /> START WORKOUT
                        </GlassButton>
                    ) : (
                        <GlassButton onClick={onReadyToggle} className={`w-full h-16 text-xl font-display tracking-widest transition-all duration-500 ${isMeReady ? 'bg-white/10 text-white border border-white/20 opacity-70' : 'bg-brand-lime text-black border-0 shadow-[0_0_30px_rgba(222,255,144,0.3)] hover:scale-[1.02]'}`}>
                            {isMeReady ? 'WAITING FOR PARTNER...' : 'READY TO TRAIN'}
                        </GlassButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export const Matches: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { setTabBarVisible } = useLayout();
    const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance');
    const [activeTab, setActiveTab] = useState<'matches' | 'requests'>('matches');
    const [requests, setRequests] = useState<ActivityRequest[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [whoLikesYou, setWhoLikesYou] = useState<User[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);

    // New state for workout session tracking
    const [activeWorkoutRequest, setActiveWorkoutRequest] = useState<ActivityRequest | null>(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingPartner, setRatingPartner] = useState<{ id: string, name: string, avatar: string } | null>(null);

    // New state for Training Prep Room and modals
    const [prepViewRequest, setPrepViewRequest] = useState<ActivityRequest | null>(null);
    const [showNoShowModal, setShowNoShowModal] = useState(false);
    const [showLateOptionsModal, setShowLateOptionsModal] = useState(false);
    const [lateRequestTargetId, setLateRequestTargetId] = useState<string | null>(null);
    const [showLateCancelModal, setShowLateCancelModal] = useState(false);
    const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
    const [extensionMins, setExtensionMins] = useState(0);

    const isLight = theme === 'light';
    const isPremium = user?.isPremium;

    // Hide tab bar when overlays are active
    useEffect(() => {
        const isOverlayActive = !!(activeWorkoutRequest || showRatingModal || prepViewRequest || showNoShowModal || showLateOptionsModal || showLateCancelModal);
        setTabBarVisible(!isOverlayActive);
    }, [activeWorkoutRequest, showRatingModal, prepViewRequest, showNoShowModal, showLateOptionsModal, showLateCancelModal, setTabBarVisible]);

    useEffect(() => {
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    // Fetch and subscribe to real-time matches
    useEffect(() => {
        if (!user) return;

        const fetchMatches = async () => {
            setIsLoadingMatches(true);
            try {
                const matchList = await matchService.getMatches(user.id);
                setMatches(matchList);

                // Get "Who Likes You" if premium
                if (isPremium) {
                    const likes = await matchService.getWhoLikesYou(user.id);
                    setWhoLikesYou(likes);
                }
            } catch (error) {
                console.error('Error fetching matches:', error);
                setMatches([]);
                setWhoLikesYou([]);
            } finally {
                setIsLoadingMatches(false);
            }
        };

        // Initial fetch
        fetchMatches();

        // Subscribe to real-time match updates
        const subscriptionKey = realtimeManager.subscribeToMatches(user.id, (newMatches) => {
            setMatches(newMatches);
            hapticFeedback.success(); // Haptic feedback on new match
            notificationService.showNotification("New Match! 🎉", { body: "You have a new training partner!" });
        });

        return () => {
            realtimeManager.unsubscribe(subscriptionKey);
        };
    }, [user, isPremium]);

    // Fetch and subscribe to requests
    useEffect(() => {
        if (!user) return;

        // Subscribe to real-time requests
        const subscriptionKey = realtimeManager.subscribeToRequests(user.id, (newRequests) => {
            setRequests(newRequests);
        });

        return () => {
            realtimeManager.unsubscribe(subscriptionKey);
        };
    }, [user]);

    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            if (sortBy === 'name') {
                return (a.partner?.name || '').localeCompare(b.partner?.name || '');
            } else {
                // Sort by match date (newest first)
                return new Date(b.matchedAt || 0).getTime() - new Date(a.matchedAt || 0).getTime();
            }
        });
    }, [matches, sortBy]);

    const handleAcceptRequest = async (reqId: string) => {
        hapticFeedback.success();
        // Optimistic update
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'accepted' } : r));

        try {
            // Persist to database
            await requestService.updateRequestStatus(reqId, 'accepted');
            notificationService.showNotification("Activity Accepted!", { body: "Added to your calendar." });
        } catch (error) {
            // Rollback on error
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'pending' } : r));
            console.error('Failed to accept request:', error);
        }
    };

    const handleDeclineRequest = async (reqId: string) => {
        hapticFeedback.medium();
        const previousRequests = [...requests];
        // Optimistic update - remove from UI
        setRequests(prev => prev.filter(r => r.id !== reqId));

        try {
            // Persist to database
            await requestService.updateRequestStatus(reqId, 'rejected');
        } catch (error) {
            // Rollback on error
            setRequests(previousRequests);
            console.error('Failed to decline request:', error);
        }
    };

    const handleSetReminder = (req: ActivityRequest) => {
        hapticFeedback.success();
        notificationService.showNotification("Reminder Set ⏰", {
            body: `Alarm set for ${req.time} on ${req.date}. We'll remind you beforehand!`
        });
    };

    // Workout session handlers
    const parseEventTime = (dateStr: string, timeStr: string) => {
        let d = new Date();
        if (dateStr.toLowerCase() === 'tomorrow') d.setDate(d.getDate() + 1);
        const [time, mod] = timeStr.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (mod === 'PM' && h < 12) h += 12;
        if (mod === 'AM' && h === 12) h = 0;
        d.setHours(h, m, 0, 0);
        return d;
    };

    const handleStatusUpdate = async (reqId: string, status: 'on_time' | 'late' | 'missed') => {
        hapticFeedback.medium();

        // Handle cancellation - check if within 1 hour
        if (status === 'missed') {
            const req = requests.find(r => r.id === reqId);
            if (req) {
                const scheduledTime = parseEventTime(req.date, req.time);
                const diffHours = (scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60);
                if (diffHours < 1) {
                    setPendingCancelId(reqId);
                    setShowLateCancelModal(true);
                    return;
                }
            }
        }

        // Handle late - show time selection modal
        if (status === 'late') {
            setLateRequestTargetId(reqId);
            setShowLateOptionsModal(true);
            return;
        }

        // Process normal status update
        processStatusUpdate(reqId, status);
    };

    const processStatusUpdate = async (reqId: string, status: 'on_time' | 'late' | 'missed', customMsg?: string) => {
        const previousRequests = [...requests];
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, attendanceUpdate: status } : r));
        if (prepViewRequest?.id === reqId) setPrepViewRequest(prev => prev ? ({ ...prev, attendanceUpdate: status }) : null);

        try {
            await requestService.updateRequestStatus(reqId, status as any);
            const req = requests.find(r => r.id === reqId);
            notificationService.showNotification("Status Updated", {
                body: customMsg || `${req?.senderName} notified: ${status.replace('_', ' ')}`
            });
        } catch (error) {
            setRequests(previousRequests);
            console.error('Failed to update status:', error);
        }
    };

    const handleLateReasonSelection = async (delayTime: string) => {
        if (!lateRequestTargetId) return;
        hapticFeedback.medium();

        // Apply penalty for 15+ minute delays
        if (['15 min', '30 min', '1 hour'].includes(delayTime) && user) {
            await ratingService.applyLatePenalty(user.id);
            notificationService.showNotification("Minor Penalty", { body: "Significant lateness affects your reliability score." });
        }

        processStatusUpdate(lateRequestTargetId, 'late', `Running ${delayTime} late.`);
        setShowLateOptionsModal(false);
        setLateRequestTargetId(null);
    };

    const handleConfirmLateCancel = async () => {
        if (!pendingCancelId || !user) return;
        hapticFeedback.heavy();

        // Apply major penalty
        await ratingService.applyPenalty(user.id);

        setRequests(prev => prev.map(r => r.id === pendingCancelId ? { ...r, attendanceUpdate: 'missed' } : r));
        notificationService.showNotification("Cancelled", { body: "Partner notified. Rating penalty applied." });
        setShowLateCancelModal(false);
        setPendingCancelId(null);
        setPrepViewRequest(null);
    };

    const handleOpenPrep = (req: ActivityRequest) => {
        hapticFeedback.medium();
        setPrepViewRequest(req);
    };

    const handleReadyToggle = () => {
        if (!prepViewRequest || !user) return;
        hapticFeedback.success();

        const isMeSender = prepViewRequest.senderId === user.id;
        const updatedReq = {
            ...prepViewRequest,
            senderReady: isMeSender ? !prepViewRequest.senderReady : prepViewRequest.senderReady,
            receiverReady: !isMeSender ? !prepViewRequest.receiverReady : prepViewRequest.receiverReady
        };

        setPrepViewRequest(updatedReq);
        setRequests(prev => prev.map(r => r.id === prepViewRequest.id ? updatedReq : r));

        // Simulate partner getting ready after 3 seconds (demo only)
        const iJustBecameReady = (isMeSender && updatedReq.senderReady && !updatedReq.receiverReady) ||
            (!isMeSender && updatedReq.receiverReady && !updatedReq.senderReady);
        if (iJustBecameReady) {
            setTimeout(() => {
                const fullyReadyReq = { ...updatedReq, senderReady: true, receiverReady: true };
                setPrepViewRequest(fullyReadyReq);
                setRequests(prev => prev.map(r => r.id === prepViewRequest.id ? fullyReadyReq : r));
                hapticFeedback.heavy();
                notificationService.showNotification("Everyone Ready!", { body: "Workout starting in 3..." });
            }, 3000);
        }
    };

    const handleNoShowReport = (reason: string) => {
        if (!prepViewRequest || !user) return;
        hapticFeedback.heavy();
        notificationService.showNotification("Incident Reported", { body: "Our safety team has been notified of the no-show." });
        setRequests(prev => prev.map(r => r.id === prepViewRequest.id ? { ...r, attendanceUpdate: 'missed', noShowReason: reason } : r));
        setShowNoShowModal(false);
        setPrepViewRequest(null);
        setExtensionMins(0);
    };

    const handleWaitExtension = (mins: number) => {
        hapticFeedback.success();
        setExtensionMins(prev => prev + mins);
        setShowNoShowModal(false);
        notificationService.showNotification("Patience is Key", { body: `Local timer extended by ${mins} minutes.` });
    };

    const handleStartWorkout = async (req: ActivityRequest) => {
        hapticFeedback.success();
        const updatedReq = { ...req, status: 'in_progress' as any, startedAt: new Date().toISOString() };
        setRequests(prev => prev.map(r => r.id === req.id ? updatedReq : r));
        setActiveWorkoutRequest(updatedReq);
        setPrepViewRequest(null);
        setExtensionMins(0);

        try {
            await requestService.updateRequestStatus(req.id, 'in_progress');
        } catch (error) {
            console.error('Failed to start workout:', error);
        }
    };

    const handleEndWorkout = async () => {
        if (!activeWorkoutRequest) return;
        hapticFeedback.heavy();

        const completedAt = new Date().toISOString();
        setRequests(prev => prev.map(r =>
            r.id === activeWorkoutRequest.id ? { ...r, status: 'completed' as any, completedAt } : r
        ));

        setRatingPartner({
            id: activeWorkoutRequest.senderId,
            name: activeWorkoutRequest.senderName,
            avatar: activeWorkoutRequest.senderAvatar
        });

        const tempRequest = activeWorkoutRequest;
        setActiveWorkoutRequest(null);
        setShowRatingModal(true);

        try {
            await requestService.updateRequestStatus(tempRequest.id, 'completed');
        } catch (error) {
            console.error('Failed to complete workout:', error);
        }
    };

    const handleLikeClick = (likedUser: User) => {
        if (!isPremium) {
            hapticFeedback.medium();
            navigate('/premium');
        } else {
            // Logic to match (open profile for now)
            navigate(`/matches/${likedUser.id}`, { state: { user: likedUser } });
        }
    };

    return (
        <>
            {/* Workout Session Overlay */}
            {activeWorkoutRequest && (
                <WorkoutSessionOverlay
                    request={activeWorkoutRequest}
                    onEnd={handleEndWorkout}
                />
            )}

            {/* Post-Workout Rating Modal */}
            {showRatingModal && ratingPartner && (
                <PostWorkoutRating
                    isOpen={showRatingModal}
                    partnerId={ratingPartner.id}
                    partnerName={ratingPartner.name}
                    partnerAvatar={ratingPartner.avatar}
                    onClose={() => {
                        setShowRatingModal(false);
                        setRatingPartner(null);
                    }}
                />
            )}

            {/* Training Prep Overlay */}
            {prepViewRequest && user && (
                <TrainingPrepOverlay
                    request={prepViewRequest}
                    user={user}
                    onEnd={() => { setPrepViewRequest(null); setExtensionMins(0); }}
                    onStatusUpdate={(s) => handleStatusUpdate(prepViewRequest.id, s)}
                    onReadyToggle={handleReadyToggle}
                    onStartWorkout={() => handleStartWorkout(prepViewRequest)}
                    onReport={() => { }}
                    onNoShow={() => setShowNoShowModal(true)}
                    extensionMins={extensionMins}
                />
            )}

            {/* No-Show Modal */}
            <NoShowModal
                isOpen={showNoShowModal}
                partnerName={prepViewRequest?.senderName || 'Athlete'}
                onClose={() => setShowNoShowModal(false)}
                onReport={handleNoShowReport}
                onWait={handleWaitExtension}
            />

            {/* Late Selection Modal */}
            <LateSelectionModal
                isOpen={showLateOptionsModal}
                onClose={() => { setShowLateOptionsModal(false); setLateRequestTargetId(null); }}
                onSelect={handleLateReasonSelection}
            />

            {/* Late Cancel Modal */}
            <LateCancelModal
                isOpen={showLateCancelModal}
                onClose={() => { setShowLateCancelModal(false); setPendingCancelId(null); }}
                onConfirm={handleConfirmLateCancel}
            />

            <div className="px-6 pt-10 pb-24 min-h-full relative">
                {/* Header */}
                <div className="flex items-end gap-3 mb-6">
                    <h2 className={`text-3xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Connections</h2>
                </div>

                {/* Tabs */}
                <div className={`flex p-1 rounded-[24px] mb-6 backdrop-blur-md border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/10 border-white/10'}`}>
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`flex-1 py-2.5 rounded-[20px] text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'matches' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
                    >
                        Profiles ({matches.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-2.5 rounded-[20px] text-xs font-bold uppercase tracking-wide transition-all relative ${activeTab === 'requests' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
                    >
                        Requests
                        {requests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                </div>

                {activeTab === 'matches' && (
                    <div className="animate-slide-up space-y-6">

                        {/* READY TO TRAIN SECTION (Formerly Likes You) */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Ready to Train</h3>
                                <div className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                                    <Crown size={10} fill="currentColor" /> {whoLikesYou.length}
                                </div>
                            </div>

                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                                {whoLikesYou.map((likeUser, idx) => (
                                    <div
                                        key={likeUser.id}
                                        onClick={() => handleLikeClick(likeUser)}
                                        className={`
                                relative flex-shrink-0 w-24 h-32 rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-95
                                ${!isPremium ? 'border border-amber-500/50' : 'border border-white/10'}
                            `}
                                    >
                                        {/* Image with conditional Blur */}
                                        <img
                                            src={likeUser.avatarUrl}
                                            className={`w-full h-full object-cover transition-all duration-500 ${!isPremium ? 'blur-md scale-110 brightness-50' : ''}`}
                                            alt="Hidden User"
                                        />

                                        {/* Overlay for Non-Premium */}
                                        {!isPremium && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/50 mb-1">
                                                    <Lock size={14} className="text-black" fill="currentColor" />
                                                </div>
                                                <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">Gold</span>
                                            </div>
                                        )}

                                        {/* Info for Premium */}
                                        {isPremium && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                                <span className="text-xs font-bold text-white truncate">{likeUser.name}</span>
                                                <span className="text-[9px] text-white/70">{likeUser.age} • {likeUser.interests[0]}</span>
                                            </div>
                                        )}

                                        {/* Match indicator if Premium */}
                                        {isPremium && (
                                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Zap size={10} className="text-neon-blue fill-neon-blue" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Upsell Card (Always last if not premium, or if list is short) */}
                                {!isPremium && (
                                    <div
                                        onClick={() => navigate('/premium')}
                                        className={`flex-shrink-0 w-24 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer border border-dashed ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg">
                                            <Crown size={16} className="text-white" fill="currentColor" />
                                        </div>
                                        <div className={`text-[9px] font-bold text-center leading-tight ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                                            See who is<br />Ready
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MATCHES LIST */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-sm font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Your Matches</h3>

                                {/* Sorting Controls */}
                                <div className="flex items-center gap-2">
                                    <GlassSelectable
                                        selected={sortBy === 'distance'}
                                        onClick={() => setSortBy('distance')}
                                        className="!py-1 !px-2 !text-[9px] uppercase tracking-wide"
                                    >
                                        Distance
                                    </GlassSelectable>
                                    <GlassSelectable
                                        selected={sortBy === 'name'}
                                        onClick={() => setSortBy('name')}
                                        className="!py-1 !px-2 !text-[9px] uppercase tracking-wide"
                                    >
                                        Name
                                    </GlassSelectable>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {sortedMatches.map((match, index) => {
                                    const partner = match.partner; // Partner user object from Supabase
                                    if (!partner) return null; return (
                                        <div
                                            key={match.id}
                                            onClick={() => navigate(`/chat/${partner.id}`, { state: { user: partner } })}
                                            className={`
                            group p-4 rounded-[32px] border transition-all duration-300 cursor-pointer flex items-center gap-4
                            ${isLight
                                                    ? 'bg-white/60 hover:bg-white border-slate-200 shadow-sm hover:shadow-md'
                                                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                                                }
                            `}
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={partner.avatarUrl || 'https://i.pravatar.cc/150'}
                                                    alt={partner.name}
                                                    className={`w-14 h-14 rounded-full object-cover border ${isLight ? 'border-slate-200' : 'border-white/10'}`}
                                                />
                                                {match.compatibilityScore && match.compatibilityScore > 85 && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-blue rounded-full flex items-center justify-center text-[8px] font-bold text-black border-2 border-black">
                                                        {match.compatibilityScore}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h3 className={`font-medium text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>{partner.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-[12px] flex items-center gap-1 ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60'}`}>
                                                        <Heart size={10} className="fill-current" />
                                                        Match
                                                    </span>
                                                </div>
                                                <p className={`text-sm truncate ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                                                    {partner.bio || match.matchReason || 'Tap to start chatting!'}
                                                </p>
                                            </div>

                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLight ? 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-900' : 'bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black'}`}>
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    )
                                })}

                                {sortedMatches.length === 0 && !isLoadingMatches && (
                                    <div className={`text-center mt-10 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                        <p>No matches yet.</p>
                                        <p className="text-xs mt-2">Keep swiping to find your training partners!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-4 animate-slide-up">
                        {requests.length === 0 ? (
                            <div className={`text-center mt-20 flex flex-col items-center ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                <Calendar size={40} className="mb-4 opacity-50" />
                                <p>No activity requests.</p>
                                <p className="text-xs mt-2">Propose a workout from a user's profile!</p>
                            </div>
                        ) : (
                            requests.map((req, idx) => (
                                <GlassCard
                                    key={req.id}
                                    variant={isLight ? 'default' : 'dark-always'}
                                    className={`p-5 relative overflow-hidden transition-all duration-500 ${req.status === 'accepted' ? 'border-neon-blue/50' : ''}`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    {/* Status Badge */}
                                    {req.status === 'accepted' && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-neon-blue to-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
                                            <Check size={10} strokeWidth={3} /> ACCEPTED
                                        </div>
                                    )}

                                    <div className="flex gap-4 mb-5">
                                        <div className="relative">
                                            <img src={req.senderAvatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10" alt="" />
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#121212] bg-neon-blue text-black`}>
                                                <Activity size={12} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-blue-600' : 'text-neon-blue'}`}>Request</span>
                                                <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                <span className="text-[10px] opacity-60">
                                                    {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className={`text-lg font-display font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                {req.sport} <span className="font-light opacity-70">with {req.senderName}</span>
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className={`flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                            <Calendar size={14} className="text-neon-blue shrink-0" />
                                            <span className="truncate">{req.date}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                            <Clock size={14} className="text-neon-blue shrink-0" />
                                            <span className="truncate">{req.time}</span>
                                        </div>
                                        <div className={`col-span-2 flex items-center gap-2 text-xs font-medium p-3 rounded-[16px] ${isLight ? 'bg-slate-50 text-slate-700 border border-slate-100' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                                            <MapPin size={14} className="text-neon-blue shrink-0" />
                                            <span className="truncate">{req.location}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {req.status === 'pending' ? (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleDeclineRequest(req.id)}
                                                className={`
                                        flex-1 h-12 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-all border
                                        ${isLight
                                                        ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                                        : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}
                                    `}
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleAcceptRequest(req.id)}
                                                className={`
                                        flex-1 h-12 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 group
                                        bg-gradient-to-r from-neon-blue to-purple-600 text-white border-0
                                        hover:shadow-neon-blue/20 hover:scale-[1.02] active:scale-[0.98]
                                    `}
                                            >
                                                Accept <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    ) : req.status === 'accepted' ? (
                                        <TimeStatusPanel
                                            dateStr={req.date}
                                            timeStr={req.time}
                                            isLight={isLight}
                                            currentStatus={req.attendanceUpdate}
                                            onUpdateStatus={(status) => handleStatusUpdate(req.id, status)}
                                            onStartWorkout={() => handleOpenPrep(req)}
                                        />
                                    ) : (
                                        <GlassButton
                                            onClick={() => handleSetReminder(req)}
                                            className="w-full h-12 text-sm font-bold shadow-lg shadow-neon-blue/10 bg-white/5 border-white/10 hover:bg-white/10"
                                        >
                                            <Bell size={16} className="mr-2 text-neon-blue" /> Set Reminder
                                        </GlassButton>
                                    )}
                                </GlassCard>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
