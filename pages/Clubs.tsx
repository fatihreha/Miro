
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { Users, MapPin, Search, Plus, Calendar, CheckCircle2, ShieldCheck, Crown, ArrowRight, Zap, Lock, Clock, Star, X, Image as ImageIcon, AlignLeft, Sparkles, Send, Bot, Timer } from 'lucide-react';
import { SportType, SportEvent, Club } from '../types';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { chatWithAICoach } from '../services/geminiService';
import { VerificationModal } from '../components/modals/VerificationModal';
import { clubService } from '../services/clubService';
import { realtimeManager } from '../services/realtimeManager';

const MOCK_CLUBS: Club[] = [
    {
        id: '1',
        ownerId: 'system',
        name: 'Midnight Runners',
        sport: SportType.RUNNING,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=60',
        members: 1240,
        description: 'We run the city when it sleeps. Join us for late-night 5Ks and post-run smoothies.',
        isMember: true,
        membershipStatus: 'member',
        location: 'Central Park, NY'
    },
    {
        id: '2',
        ownerId: 'system',
        name: 'Ace Tennis Club',
        sport: SportType.TENNIS,
        image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=60',
        members: 85,
        description: 'Dedicated to finding your perfect doubles partner. Weekly tournaments.',
        isMember: false,
        membershipStatus: 'guest',
        location: 'City Courts'
    },
    {
        id: '3',
        ownerId: 'system',
        name: 'Zen Yoga Collective',
        sport: SportType.YOGA,
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=60',
        members: 430,
        description: 'Find your flow in the chaos of the city. Outdoor sessions when weather permits.',
        isMember: false,
        membershipStatus: 'guest',
        location: 'Battery Park'
    }
];

const MOCK_EVENTS: SportEvent[] = [
    {
        id: 'e1',
        hostId: 'u1',
        hostName: 'Alex',
        hostAvatar: 'https://i.pravatar.cc/150?u=alex',
        title: 'Sunday Morning Jog',
        sport: SportType.RUNNING,
        date: 'Today',
        time: '08:00',
        location: 'Central Park North',
        description: 'Casual 5k run. All paces welcome! Coffee afterwards.',
        attendees: 12,
        attendeeAvatars: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3'],
        isJoined: true,
        attendanceStatus: 'going'
    },
    {
        id: 'e2',
        hostId: 'u2',
        hostName: 'Sarah',
        hostAvatar: 'https://i.pravatar.cc/150?u=sarah',
        title: '3v3 Basketball',
        sport: SportType.BASKETBALL,
        date: 'Tomorrow',
        time: '16:00',
        location: 'Rucker Park',
        description: 'Looking for players for a friendly game.',
        attendees: 4,
        attendeeAvatars: ['https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6'],
        isJoined: false,
        attendanceStatus: 'guest'
    },
    {
        id: 'e3',
        hostId: 'u3',
        hostName: 'Mike',
        hostAvatar: 'https://i.pravatar.cc/150?u=mike',
        title: 'Sunset Yoga',
        sport: SportType.YOGA,
        date: 'Fri, Nov 18',
        time: '18:30',
        location: 'Pier 57',
        description: 'Bring your own mat. Beginners welcome.',
        attendees: 25,
        attendeeAvatars: ['https://i.pravatar.cc/150?u=7', 'https://i.pravatar.cc/150?u=8', 'https://i.pravatar.cc/150?u=9'],
        isJoined: false,
        attendanceStatus: 'guest'
    }
];

const MOCK_PROS = [
    {
        id: 't1',
        name: 'Coach David',
        specialty: 'HIIT & Strength',
        image: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=800&auto=format&fit=crop&q=60',
        rating: 4.9,
        location: 'Downtown Gym'
    },
    {
        id: 't2',
        name: 'Sarah Jenkins',
        specialty: 'Yoga & Mobility',
        image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&auto=format&fit=crop&q=60',
        rating: 5.0,
        location: 'Zen Studio'
    },
    {
        id: 't3',
        name: 'Mike Ross',
        specialty: 'Tennis Pro',
        image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&auto=format&fit=crop&q=60',
        rating: 4.8,
        location: 'City Courts'
    }
];

export const Clubs: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { setTabBarVisible } = useLayout();
    const isLight = theme === 'light';


    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [events, setEvents] = useState(MOCK_EVENTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'my_clubs'>('all');

    // Load clubs from Supabase
    useEffect(() => {
        if (!user) return;

        const loadClubs = async () => {
            try {
                const clubs = await clubService.getClubs({
                    sport: searchQuery ? undefined : undefined
                });
                setAllClubs(clubs.length > 0 ? clubs : MOCK_CLUBS);
            } catch (e) {
                console.error('Error loading clubs:', e);
                setAllClubs(MOCK_CLUBS); // Fallback
            }
        };

        loadClubs();
    }, [user, searchQuery]);

    // Creation Flow State
    const [showLanding, setShowLanding] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    // Event Creation State
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<SportEvent>>({
        title: '',
        date: '',
        time: '',
        location: '',
        description: ''
    });

    // AI PT State
    const [showPTModal, setShowPTModal] = useState(false);
    const [ptInput, setPtInput] = useState('');
    const [ptMessages, setPtMessages] = useState<any[]>([
        { role: 'model', parts: [{ text: "Hey athlete! I'm your AI Performance Coach. Need a workout plan, nutrition advice, or motivation? Let's get to work! 💪" }] }
    ]);
    const [isPtTyping, setIsPtTyping] = useState(false);
    const ptChatEndRef = useRef<HTMLDivElement>(null);

    const [newClub, setNewClub] = useState({
        name: '',
        sport: SportType.RUNNING,
        location: '',
        description: ''
    });

    // Control Tab Bar Visibility based on modal state
    useEffect(() => {
        const isAnyModalOpen = showLanding || showCreateForm || showVerificationModal || showPTModal || showCreateEventModal;
        setTabBarVisible(!isAnyModalOpen);
        return () => setTabBarVisible(true);
    }, [showLanding, showCreateForm, showVerificationModal, showPTModal, showCreateEventModal, setTabBarVisible]);

    useEffect(() => {
        if (showPTModal) {
            setTimeout(() => ptChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [ptMessages, showPTModal]);

    // Handle Event Request Logic
    const handleEventRequest = (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        hapticFeedback.medium();
        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
                const currentStatus = ev.attendanceStatus || (ev.isJoined ? 'going' : 'guest');

                if (currentStatus === 'guest') {
                    // Send Request
                    notificationService.showNotification("Request Sent", { body: `Host notified for ${ev.title}.` });
                    return { ...ev, attendanceStatus: 'pending', isJoined: false };
                } else if (currentStatus === 'pending') {
                    // Cancel Request
                    return { ...ev, attendanceStatus: 'guest', isJoined: false };
                } else {
                    // Leave Event
                    return { ...ev, attendanceStatus: 'guest', isJoined: false, attendees: ev.attendees - 1 };
                }
            }
            return ev;
        }));
    };

    // Handle "+" Click
    const handlePlusClick = () => {
        hapticFeedback.medium();
        setShowLanding(true);
    };

    // Logic Flow for Creation
    const handleProceedToCreate = () => {
        hapticFeedback.medium();
        setShowLanding(false);

        // 1. Check Premium
        if (!user?.isPremium) {
            hapticFeedback.error();
            notificationService.showNotification("Premium Required", { body: "Club creation is exclusive to Gold members." });
            setTimeout(() => navigate('/premium'), 800);
            return;
        }

        // 2. Check Verification
        if (user?.verificationStatus !== 'verified') {
            hapticFeedback.error();
            setShowVerificationModal(true);
            return;
        }

        // 3. Success -> Show Form
        setShowCreateForm(true);
    };

    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        setTimeout(() => setShowCreateForm(true), 500);
    };

    const handleCreateClub = () => {
        if (!newClub.name || !newClub.location) {
            hapticFeedback.error();
            return;
        }

        const createdClub: Club = {
            id: Date.now().toString(),
            ownerId: user?.id || 'me',
            name: newClub.name,
            sport: newClub.sport,
            location: newClub.location,
            description: newClub.description || 'A new community for sports enthusiasts.',
            members: 1,
            image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60', // Default image
            isMember: true,
            membershipStatus: 'member'
        };

        // Save to Supabase
        try {
            await clubService.createClub({
                name: newClub.name,
                sport: newClub.sport,
                location: newClub.location,
                description: newClub.description || 'A new community for sports enthusiasts.',
                ownerId: user?.id || 'me'
            });
        } catch (e) {
            console.error('Error creating club in Supabase:', e);
        }

        setAllClubs(prev => [createdClub, ...prev]);
        setShowCreateForm(false);
        setNewClub({ name: '', sport: SportType.RUNNING, location: '', description: '' });

        hapticFeedback.success();
        notificationService.showNotification("Club Created", { body: `${newClub.name} is now live!` });
    };

    // Event Creation Logic
    const handleCreateEvent = () => {
        if (!newEvent.title || !newEvent.date) {
            notificationService.showNotification("Missing Info", { body: "Please fill in event details." });
            return;
        }

        const createdEvent: SportEvent = {
            id: Date.now().toString(),
            hostId: user?.id || 'me',
            hostName: user?.name || 'Me',
            hostAvatar: user?.avatarUrl || '',
            title: newEvent.title!,
            sport: SportType.RUNNING, // Default for quick create
            date: newEvent.date!,
            time: newEvent.time || 'TBD',
            location: newEvent.location || 'TBD',
            description: newEvent.description || '',
            attendees: 1,
            attendeeAvatars: [user?.avatarUrl || ''],
            isJoined: true,
            attendanceStatus: 'going'
        };

        setEvents([...events, createdEvent]);
        hapticFeedback.success();
        notificationService.showNotification("Event Created", { body: `${newEvent.title} added.` });
        setShowCreateEventModal(false);
        setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
    };

    // AI PT Logic
    const handleOpenPT = () => {
        if (!user?.isPremium) {
            hapticFeedback.error();
            navigate('/premium');
            return;
        }
        hapticFeedback.medium();
        setShowPTModal(true);
    };

    const handleSendPTMessage = async () => {
        if (!ptInput.trim() || !user) return;

        const userMsg = ptInput;
        setPtInput('');
        setPtMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
        setIsPtTyping(true);
        hapticFeedback.light();

        try {
            // Format history for Gemini
            const history = ptMessages.map(m => ({
                role: m.role,
                parts: m.parts
            }));

            const responseText = await chatWithAICoach(user, userMsg, history);

            setPtMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
        } catch (error) {
            console.error(error);
            setPtMessages(prev => [...prev, { role: 'model', parts: [{ text: "I need a quick water break. Try again in a second." }] }]);
        } finally {
            setIsPtTyping(false);
            hapticFeedback.success();
        }
    };

    return (
        <div className="min-h-full pb-24 relative bg-transparent">

            {/* Global Verification Modal */}
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onSuccess={handleVerificationSuccess}
                title="Club Verification"
                description="To maintain high quality communities, we require club founders to verify their identity."
            />

            {/* Header */}
            <div className="px-6 pt-8 mb-6">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className={`text-3xl font-display font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Discover</h1>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Find your tribe.</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <GlassInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search clubs, events or pros..."
                        className={`pl-11 !py-3.5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}`}
                    />
                    <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                </div>

                {/* AI Personal Trainer Section */}
                <div className="mb-10 animate-slide-up">
                    <GlassCard
                        onClick={handleOpenPT}
                        className={`
                    p-5 relative overflow-hidden cursor-pointer group transition-transform active:scale-[0.98] border-0
                    ${user?.isPremium
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                                : 'bg-gradient-to-r from-gray-900 to-black border border-amber-500/30'}
                `}
                    >
                        {/* Background Decor */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors"></div>

                        <div className="relative z-10 flex justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`px-2 py-0.5 backdrop-blur-md rounded text-[9px] font-bold uppercase tracking-wider border ${user?.isPremium ? 'bg-white/20 text-white border-white/10' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                        {user?.isPremium ? 'Premium Exclusive' : 'Gold Feature'}
                                    </div>
                                    {user?.isPremium && <Sparkles size={12} className="text-yellow-300 animate-pulse" />}
                                </div>
                                <h2 className={`text-xl font-display font-bold mb-1 ${user?.isPremium ? 'text-white' : 'text-white/50'}`}>AI Performance Coach</h2>
                                <p className={`text-xs leading-relaxed max-w-[200px] ${user?.isPremium ? 'text-white/70' : 'text-white/40'}`}>
                                    {user?.isPremium
                                        ? "Get personalized workout plans & nutrition advice instantly."
                                        : "Unlock your personal AI trainer to build custom plans."}
                                </p>
                                {user?.isPremium && (
                                    <button className={`mt-3 px-4 py-2 rounded-full text-xs font-bold bg-white text-indigo-600 shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-1`}>
                                        Start Chat <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>
                            <div className={`w-16 h-16 flex items-center justify-center rounded-full border shadow-2xl backdrop-blur-sm ${user?.isPremium ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10 grayscale opacity-50'}`}>
                                <Bot size={32} className={user?.isPremium ? "text-yellow-300 fill-white/20 drop-shadow-lg" : "text-white"} />
                            </div>
                        </div>

                        {!user?.isPremium && (
                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[3px] flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 mb-2 animate-pulse-slow">
                                    <Lock size={20} className="text-white" fill="currentColor" />
                                </div>
                                <div className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-sm">
                                    GOLD
                                </div>
                                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                                    Tap to Unlock
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Events Carousel */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Trending Events</h2>
                        <button
                            onClick={() => navigate('/events')}
                            className={`text-xs font-bold ${isLight ? 'text-neon-blue' : 'text-neon-blue'}`}
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4 snap-x">
                        {events.map(event => {
                            const status = event.attendanceStatus || (event.isJoined ? 'going' : 'guest');

                            return (
                                <div
                                    key={event.id}
                                    className={`
                            snap-center shrink-0 w-72 p-4 rounded-[32px] border relative overflow-hidden group backdrop-blur-2xl transition-all
                            ${isLight
                                            ? 'bg-white/50 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-slate-900'
                                            : 'bg-white/5 border-white/10 shadow-xl text-white'}
                        `}
                                >
                                    {/* Date Badge */}
                                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-[16px] backdrop-blur-md border z-20 ${isLight ? 'bg-white/80 border-white text-slate-900' : 'bg-black/40 border-white/10 text-white'}`}>
                                        <div className="text-[10px] font-bold uppercase tracking-wider">{event.date}</div>
                                    </div>

                                    {/* Event Info */}
                                    <div className="mt-8 mb-4">
                                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{event.sport}</div>
                                        <h3 className={`text-xl font-display font-bold leading-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{event.title}</h3>
                                        <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                            <Clock size={12} /> {event.time} • <MapPin size={12} /> {event.location}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            {event.attendeeAvatars?.slice(0, 3).map((av, i) => (
                                                <img key={i} src={av} className={`w-8 h-8 rounded-full border-2 ${isLight ? 'border-white' : 'border-black/50'}`} alt="" />
                                            ))}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isLight ? 'bg-slate-100 border-white text-slate-600' : 'bg-white/10 border-black/50 text-white'}`}>
                                                +{event.attendees}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => handleEventRequest(e, event.id)}
                                            className={`
                                    px-5 py-2 rounded-[24px] text-xs font-bold transition-all duration-300 shadow-lg
                                    ${status === 'going'
                                                    ? (isLight ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-green-500/20 text-green-400 border border-green-500/30')
                                                    : status === 'pending'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : (isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-gray-200')}
                                `}
                                        >
                                            {status === 'going' ? 'Going' : (status === 'pending' ? 'Pending' : 'Request Spot')}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Pros Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Top Trainers</h2>
                        <button
                            onClick={() => navigate('/trainers')}
                            className={`text-xs font-bold ${isLight ? 'text-neon-blue' : 'text-neon-blue'}`}
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4 snap-x">
                        {MOCK_PROS.map((pro, i) => (
                            <div
                                key={pro.id}
                                onClick={() => navigate(`/trainers/${pro.id}`)}
                                className={`
                            snap-center shrink-0 w-64 p-3 rounded-[32px] border flex items-center gap-4 cursor-pointer transition-all active:scale-95 backdrop-blur-xl
                            ${isLight
                                        ? 'bg-white/50 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white'
                                        : 'bg-white/5 border-white/10 shadow-lg hover:bg-white/10'}
                        `}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <img src={pro.image} className="w-16 h-16 rounded-2xl object-cover" alt={pro.name} />
                                <div>
                                    <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{pro.name}</h3>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{pro.specialty}</div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                        <Star size={10} fill="currentColor" /> {pro.rating}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clubs Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Popular Clubs</h2>
                            {/* Create Club Button Triggers Landing Modal */}
                            <button
                                onClick={handlePlusClick}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${isLight ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className={`flex p-0.5 rounded-[12px] backdrop-blur-md border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'all' ? (isLight ? 'bg-white shadow-sm text-slate-900' : 'bg-white/20 text-white shadow-sm') : (isLight ? 'text-slate-500' : 'text-white/50')}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setViewMode('my_clubs')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${viewMode === 'my_clubs' ? (isLight ? 'bg-white shadow-sm text-slate-900' : 'bg-white/20 text-white shadow-sm') : (isLight ? 'text-slate-500' : 'text-white/50')}`}
                            >
                                My Clubs
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {allClubs.filter(c => viewMode === 'all' || c.membershipStatus === 'member').map((club, i) => (
                            <div
                                key={club.id}
                                onClick={() => navigate(`/clubs/${club.id}`, { state: { club } })}
                                className={`
                            group relative h-48 rounded-[32px] overflow-hidden cursor-pointer border transition-transform active:scale-[0.98] animate-slide-up backdrop-blur-xl
                            ${isLight ? 'border-white/60 shadow-xl bg-white/50' : 'border-white/10 shadow-2xl bg-white/5'}
                        `}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <img src={club.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={club.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                <div className="absolute top-4 right-4">
                                    {club.membershipStatus === 'member' ? (
                                        <div className="px-3 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Member
                                        </div>
                                    ) : club.membershipStatus === 'pending' ? (
                                        <div className="px-3 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Timer size={10} /> Pending
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                            <Plus size={16} />
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-6">
                                    <div className="text-[10px] font-bold text-neon-blue uppercase tracking-widest mb-1">{club.sport}</div>
                                    <h3 className="text-2xl font-display font-bold text-white mb-2">{club.name}</h3>
                                    <div className="flex items-center gap-3 text-white/70 text-xs">
                                        <span className="flex items-center gap-1"><Users size={12} /> {club.members} members</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {club.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* REDESIGNED AI PT CHAT MODAL - LIQUID ATMOSPHERE */}
                {showPTModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
                        {/* Dark Backdrop */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPTModal(false)} />

                        <div className="w-full h-full sm:h-[85vh] sm:w-full sm:max-w-md relative z-10 animate-slide-up sm:rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-[#05050a]">

                            {/* LIQUID ATMOSPHERE BACKGROUND - CONTAINED */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                                <div className={`absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[100px] animate-pulse-slow ${isLight ? 'bg-indigo-400/30' : 'bg-indigo-600/20'}`}></div>
                                <div className={`absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[100px] animate-blob ${isLight ? 'bg-purple-400/30' : 'bg-purple-600/20'}`}></div>
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Glass Header */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white/10">
                                            <Bot size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-display font-bold text-white leading-none mb-1">SportPulse Coach</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">AI Online</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPTModal(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                                    {ptMessages.map((msg, idx) => {
                                        const isModel = msg.role === 'model';
                                        return (
                                            <div key={idx} className={`flex gap-4 ${isModel ? '' : 'flex-row-reverse'} animate-slide-up`}>
                                                {isModel && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg mt-1">
                                                        <Sparkles size={14} />
                                                    </div>
                                                )}
                                                <div className={`
                                            max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md border
                                            ${isModel
                                                        ? 'bg-white/10 border-white/10 text-white rounded-tl-none'
                                                        : 'bg-neon-blue text-black font-medium rounded-tr-none border-neon-blue/50 shadow-neon-blue/10'}
                                        `}>
                                                    <span className="whitespace-pre-wrap">{msg.parts[0].text}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isPtTyping && (
                                        <div className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0"></div>
                                            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/10 border border-white/5 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-75"></div>
                                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={ptChatEndRef} />
                                </div>

                                {/* Floating Glass Input */}
                                <div className="p-5 pb-8 pt-2">
                                    <div className="relative flex items-center gap-2 p-2 rounded-[24px] bg-white/10 border border-white/10 backdrop-blur-xl shadow-2xl">
                                        <input
                                            value={ptInput}
                                            onChange={(e) => setPtInput(e.target.value)}
                                            placeholder="Ask for a plan, diet, or tip..."
                                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 px-4 py-2 text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendPTMessage()}
                                        />
                                        <button
                                            onClick={handleSendPTMessage}
                                            disabled={!ptInput.trim() || isPtTyping}
                                            className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NEW: CLUB LANDING MODAL */}
                {showLanding && (
                    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-md animate-fade-in ${isLight ? 'bg-slate-50/80' : 'bg-black/80'}`}>
                        <div className="absolute inset-0" onClick={() => setShowLanding(false)} />
                        <GlassCard className={`w-full max-w-md p-6 relative animate-slide-up rounded-[32px] overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>
                            <button onClick={() => setShowLanding(false)} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60'}`}>
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8 pt-2">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-[32px] bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30 rotate-3">
                                    <Crown size={40} className="text-white" fill="currentColor" />
                                </div>
                                <h2 className={`text-3xl font-display font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    Lead the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Pack</span>
                                </h2>
                                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Create a club, build your squad.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {[
                                    { icon: Users, label: 'Community', desc: 'Build your squad' },
                                    { icon: Calendar, label: 'Events', desc: 'Host meetups' },
                                    { icon: ShieldCheck, label: 'Manage', desc: 'Set the rules' },
                                    { icon: Zap, label: 'Featured', desc: 'Get discovered' }
                                ].map((item, i) => (
                                    <div key={i} className={`p-3 rounded-[24px] border flex flex-col items-center text-center gap-2 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                                        <item.icon size={20} className={isLight ? 'text-slate-700' : 'text-white'} />
                                        <div>
                                            <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.label}</div>
                                            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <GlassButton
                                    onClick={handleProceedToCreate}
                                    className="w-full h-14 text-lg font-bold shadow-xl shadow-orange-500/20 bg-gradient-to-r from-amber-500 to-orange-600 border-0 text-white"
                                >
                                    Create Club
                                </GlassButton>
                                <div className={`text-[10px] text-center font-medium uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                                    Requires Premium & Verification
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* REDESIGNED CREATE CLUB FORM MODAL */}
                {showCreateForm && (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in`}>
                        <div className="absolute inset-0" onClick={() => setShowCreateForm(false)} />
                        <GlassCard className={`w-full max-w-md p-0 overflow-hidden relative animate-slide-up rounded-[40px] shadow-2xl border border-white/10 ${isLight ? 'bg-white' : 'bg-[#121212]'}`}>

                            {/* Header with Close */}
                            <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start">
                                <h2 className="text-3xl font-display font-black text-white drop-shadow-lg">New Club</h2>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/50 transition border border-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Hero Upload Area */}
                            <div className="relative h-64 w-full bg-gradient-to-br from-gray-900 to-black group cursor-pointer">
                                <img
                                    src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60"
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                                    alt="Cover"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                        <ImageIcon size={24} className="text-white" />
                                    </div>
                                    <span className="mt-3 text-xs font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">Change Cover</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                            </div>

                            {/* Form Content */}
                            <div className={`p-6 -mt-6 relative z-10 rounded-t-[32px] space-y-6 ${isLight ? 'bg-white' : 'bg-[#121212]'}`}>

                                {/* Name */}
                                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Club Name</label>
                                    <div className="relative">
                                        <Users size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/30'}`} />
                                        <GlassInput
                                            value={newClub.name}
                                            onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                                            placeholder="e.g. Midnight Runners"
                                            className={`pl-12 !py-4 font-bold text-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e1e24] border-white/5'}`}
                                        />
                                    </div>
                                </div>

                                {/* Sport Category */}
                                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Category</label>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                                        {Object.values(SportType).map(sport => (
                                            <GlassSelectable
                                                key={sport}
                                                selected={newClub.sport === sport}
                                                onClick={() => setNewClub({ ...newClub, sport })}
                                                className={`
                                        !py-2.5 !px-5 !text-xs whitespace-nowrap flex-shrink-0 border
                                        ${newClub.sport === sport
                                                        ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                                                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#1e1e24] border-white/5 text-white/50')}
                                    `}
                                            >
                                                {sport}
                                            </GlassSelectable>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Home Base</label>
                                    <div className="relative">
                                        <MapPin size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/30'}`} />
                                        <GlassInput
                                            value={newClub.location}
                                            onChange={(e) => setNewClub({ ...newClub, location: e.target.value })}
                                            placeholder="e.g. Central Park"
                                            className={`pl-12 !py-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e1e24] border-white/5'}`}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Mission</label>
                                    <div className="relative">
                                        <AlignLeft size={18} className={`absolute left-4 top-4 ${isLight ? 'text-slate-400' : 'text-white/30'}`} />
                                        <textarea
                                            value={newClub.description}
                                            onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                                            className={`w-full rounded-[24px] pl-12 pr-4 py-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#1e1e24] border border-white/5 text-white placeholder-white/30'}`}
                                            rows={3}
                                            placeholder="What's the vibe?"
                                        />
                                    </div>
                                </div>

                                <GlassButton onClick={handleCreateClub} className="w-full h-14 text-lg shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                                    Launch Club
                                </GlassButton>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* Event Creation Modal */}
                {showCreateEventModal && (
                    <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center backdrop-blur-md p-0 sm:p-4 animate-fade-in ${isLight ? 'bg-slate-50/95' : 'bg-black/95'}`}>
                        <div className="absolute inset-0" onClick={() => setShowCreateEventModal(false)} />
                        <GlassCard className={`w-full max-w-md p-6 relative animate-slide-up rounded-t-[32px] sm:rounded-[32px] ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>
                            <button onClick={() => setShowCreateEventModal(false)} className={`absolute top-4 right-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`}><X size={20} /></button>
                            <h2 className={`text-xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>New Club Event</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Event Title</label>
                                    <GlassInput
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="e.g. Weekly 5K Run"
                                        className={isLight ? 'bg-slate-50 border-slate-200' : ''}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Date</label>
                                        <GlassInput type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className={`!py-2 !text-xs ${isLight ? 'bg-slate-50 border-slate-200' : ''}`} />
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Time</label>
                                        <GlassInput type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className={`!py-2 !text-xs ${isLight ? 'bg-slate-50 border-slate-200' : ''}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Location</label>
                                    <GlassInput
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="Meeting Point"
                                        className={isLight ? 'bg-slate-50 border-slate-200' : ''}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Description</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className={`w-full rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-neon-blue/50 ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-black/20 border border-white/10 text-white placeholder-white/30'}`}
                                        rows={3}
                                        placeholder="Event details..."
                                    />
                                </div>
                                <GlassButton onClick={handleCreateEvent} className="w-full mt-2">Create Event</GlassButton>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
};
