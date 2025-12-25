import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, ShieldCheck, Edit2, Save, X, Navigation, Share2, MessageSquare, StickyNote, Plus } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { SportEvent, SportType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';
import { useLayout } from '../context/LayoutContext';
import { clubService } from '../services/clubService';

export const EventDetail: React.FC = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { theme } = useTheme();
    const { setTabBarVisible } = useLayout();
    const isLight = theme === 'light';

    // State
    const [event, setEvent] = useState<SportEvent | null>(location.state?.event || null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [rules, setRules] = useState<string[]>([]);
    const [newRule, setNewRule] = useState('');
    const [notes, setNotes] = useState('');
    const [description, setDescription] = useState('');

    const isHost = user?.id === event?.hostId;
    const isGoing = event?.attendanceStatus === 'going';

    const [loading, setLoading] = useState(!event);

    // Hide Tab Bar
    useEffect(() => {
        setTabBarVisible(false);
        return () => setTabBarVisible(true);
    }, [setTabBarVisible]);

    useEffect(() => {
        const loadEvent = async () => {
            if (!event && eventId) {
                setLoading(true);
                const fetchedEvent = await clubService.getEventById(eventId);
                if (fetchedEvent) {
                    setEvent(fetchedEvent);
                    // Update local state for editing
                    setRules(fetchedEvent.rules || ['Be respectful', 'Bring water']);
                    setNotes(fetchedEvent.notes || 'Meet at the main entrance.');
                    setDescription(fetchedEvent.description || '');
                } else {
                    console.error("Event not found, redirecting");
                    navigate('/events', { replace: true });
                }
                setLoading(false);
            } else if (!event && !eventId) {
                navigate('/events', { replace: true });
            } else if (event) {
                // Initialize form state if event already exists
                setRules(event.rules || ['Be respectful', 'Bring water']);
                setNotes(event.notes || 'Meet at the main entrance.');
                setDescription(event.description || '');
            }
        };
        loadEvent();
    }, [event, eventId, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-lime"></div>
        </div>
    );

    if (!event) return null;

    // Simplified back logic to ensure we go to the list page
    const handleBack = () => {
        hapticFeedback.light();
        navigate('/events', { replace: true });
    };

    const handleSave = async () => {
        if (!event) return;

        hapticFeedback.light();

        // Veritabanına kaydet
        const success = await clubService.updateEvent(event.id, {
            description,
            rules,
            notes
        });

        if (success) {
            hapticFeedback.success();
            setEvent(prev => prev ? ({ ...prev, rules, notes, description }) : null);
            setIsEditing(false);
            notificationService.showNotification("Event Updated", {
                body: "Changes saved successfully."
            });
        } else {
            hapticFeedback.error();
            notificationService.showNotification("Error", {
                body: "Could not save changes. Try again."
            });
        }
    };

    const handleAddRule = () => {
        if (newRule.trim()) {
            setRules([...rules, newRule.trim()]);
            setNewRule('');
        }
    };

    const handleDeleteRule = (idx: number) => {
        setRules(rules.filter((_, i) => i !== idx));
    };

    return (
        <div className="min-h-full w-full relative font-sans">

            {/* HEADER */}
            <div className="sticky top-0 z-20 pt-safe-top px-4 py-4 flex justify-between items-center transition-colors">
                <button
                    onClick={handleBack}
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ${isLight ? 'bg-white/60 text-slate-800' : 'bg-black/20 text-white hover:bg-white/10'}`}
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex gap-3">
                    {isHost && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-4 h-10 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${isEditing ? 'bg-brand-lime text-black shadow-lg shadow-brand-lime/20' : (isLight ? 'bg-white/60 text-slate-800' : 'bg-black/20 text-white hover:bg-white/10')}`}
                        >
                            {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                            {isEditing ? 'Save' : 'Edit'}
                        </button>
                    )}
                    {!isEditing && (
                        <button className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isLight ? 'bg-white/60 text-slate-800' : 'bg-black/20 text-white hover:bg-white/10'}`}>
                            <Share2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="relative z-10 px-4 pb-32 space-y-6">

                {/* HERO VISUAL MAP */}
                <div className="relative h-64 w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group">
                    <div className={`absolute inset-0 ${isLight ? 'bg-[#e2e8f0]' : 'bg-[#0f0f11]'}`}>
                        <svg width="100%" height="100%" className="opacity-30">
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" className={isLight ? 'text-slate-400' : 'text-white/20'} />
                            <path d="M0,80 Q50,60 100,80" fill="none" stroke={isLight ? '#94a3b8' : '#333'} strokeWidth="2" />
                            <path d="M40,0 L60,100" fill="none" stroke={isLight ? '#94a3b8' : '#333'} strokeWidth="2" />
                        </svg>
                    </div>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pop">
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 relative ${isLight ? 'bg-slate-900 text-white' : 'bg-brand-lime text-black'}`}>
                                <MapPin size={24} fill="currentColor" />
                            </div>
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full animate-ping opacity-30 ${isLight ? 'bg-slate-900' : 'bg-brand-lime'}`}></div>
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${isLight ? 'bg-white/80 border-slate-200 text-slate-800' : 'bg-black/60 border-white/20 text-white'}`}>
                            {event.location}
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-4">
                        <GlassButton className="!h-10 !px-4 text-xs shadow-lg">
                            <Navigation size={14} className="mr-2" /> Directions
                        </GlassButton>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-brand-indigo' : 'text-neon-blue'}`}>{event.sport}</div>
                    <h1 className={`text-4xl font-display font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{event.title}</h1>
                    <div className={`flex items-center gap-4 text-sm font-medium mt-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        <div className="flex items-center gap-1.5"><Calendar size={16} /> {event.date}</div>
                        <div className="flex items-center gap-1.5"><Clock size={16} /> {event.time}</div>
                    </div>
                </div>

                <GlassCard className={`p-5 ${isLight ? 'bg-white/60' : 'bg-white/5'}`}>
                    {isEditing ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`w-full h-24 bg-transparent border-none outline-none resize-none text-sm leading-relaxed ${isLight ? 'text-slate-800' : 'text-white'}`}
                        />
                    ) : (
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{description}</p>
                    )}
                </GlassCard>

                <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 px-1 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        <Users size={14} /> The Squad ({event.attendees})
                    </h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {event.attendeeAvatars?.map((av, i) => (
                            <div key={i} className="flex-shrink-0 relative group">
                                <img src={av} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10 transition-transform group-hover:scale-105" alt="Attendee" />
                                {i === 0 && (
                                    <div className="absolute -top-1 -right-1 bg-brand-lime text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-black">HOST</div>
                                )}
                            </div>
                        ))}
                        <button className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-dashed transition-all ${isLight ? 'border-slate-300 text-slate-400 hover:bg-slate-50' : 'border-white/20 text-white/30 hover:bg-white/5'}`}>
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className={`text-sm font-bold uppercase tracking-wider px-1 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        <ShieldCheck size={14} /> Host Intel
                    </h3>

                    <GlassCard className={`p-5 ${isLight ? 'bg-white/60' : 'bg-white/5'}`}>
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-amber-500">
                            <StickyNote size={12} /> Rules
                        </div>
                        {isEditing ? (
                            <div className="space-y-2">
                                {rules.map((rule, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                                        <span className="text-sm">{rule}</span>
                                        <button onClick={() => handleDeleteRule(idx)} className="text-red-400"><X size={14} /></button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <GlassInput value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Add a rule..." className="!py-2 !text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddRule()} />
                                    <button onClick={handleAddRule} className={`px-3 rounded-xl border ${isLight ? 'bg-white' : 'bg-white/10'}`}><Plus size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {rules.map((rule, i) => (
                                    <li key={i} className={`text-sm flex items-start gap-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                                        <span className="text-brand-lime mt-1">•</span> {rule}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </GlassCard>

                    <GlassCard className={`p-5 ${isLight ? 'bg-white/60' : 'bg-white/5'}`}>
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">
                            <MessageSquare size={12} /> Secret Notes
                        </div>
                        {isEditing ? (
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className={`w-full h-20 bg-transparent border-none outline-none resize-none text-sm leading-relaxed ${isLight ? 'text-slate-800' : 'text-white'}`}
                                placeholder="Private instructions for attendees..."
                            />
                        ) : (
                            <p className={`text-sm leading-relaxed italic opacity-80 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                                "{notes}"
                            </p>
                        )}
                    </GlassCard>
                </div>
            </div>

            <div className={`fixed bottom-0 left-0 right-0 p-6 pt-4 border-t backdrop-blur-xl z-50 safe-area-bottom ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/80 border-white/10'}`}>
                <div className="w-full">
                    {isEditing ? (
                        <GlassButton onClick={handleSave} className="w-full !h-14 !bg-green-500 !text-white shadow-lg shadow-green-500/30 border-0">
                            Save Changes
                        </GlassButton>
                    ) : (
                        <GlassButton className="w-full !h-14 !bg-brand-lime !text-black shadow-[0_0_20px_rgba(222,255,144,0.3)] border-0">
                            {isGoing ? 'Check In' : 'Request Spot'}
                        </GlassButton>
                    )}
                </div>
            </div>
        </div>
    );
};
