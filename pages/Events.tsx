
import React, { useState, useEffect } from 'react';
import { clubService } from '../services/clubService';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassSelectable, GlassInput, GlassButton } from '../components/ui/Glass';
import { SportType, SportEvent } from '../types';
import { ArrowLeft, Calendar, MapPin, Clock, Search, Filter, Plus, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { VerificationModal } from '../components/modals/VerificationModal';

// Mock data removed

export const Events: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isLight = theme === 'light';

    const [events, setEvents] = useState<SportEvent[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');

    // Creation States
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<SportEvent>>({
        title: '',
        date: '',
        time: '',
        location: '',
        description: ''
    });

    // Load Events
    useEffect(() => {
        const loadEvents = async () => {
            const fetchedEvents = await clubService.getEvents();
            const formattedEvents = fetchedEvents.map(e => ({
                id: e.id,
                hostId: e.host_id,
                hostName: e.host?.name || 'Host',
                hostAvatar: e.host?.avatar_url || '',
                title: e.title,
                sport: e.sport,
                date: new Date(e.date).toLocaleDateString(),
                time: e.time,
                location: e.location,
                description: e.description,
                attendees: e.attendees || 0,
                attendeeAvatars: [], // TODO: Fetch attendees
                isJoined: false, // TODO: Check if joined
                attendanceStatus: 'guest'
            }));
            setEvents(formattedEvents);
        };
        loadEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || event.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSport = selectedSport === 'All' || event.sport === selectedSport;
        return matchesSearch && matchesSport;
    });

    const toggleRSVP = (e: React.MouseEvent, eventId: string) => {
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

    const handleCreateClick = () => {
        hapticFeedback.medium();
        if (user?.verificationStatus === 'verified') {
            setShowCreateEventModal(true);
        } else {
            setShowVerificationModal(true);
        }
    };

    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        setTimeout(() => setShowCreateEventModal(true), 500);
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date) {
            notificationService.showNotification("Missing Info", { body: "Please fill in event details." });
            return;
        }

        try {
            const created = await clubService.createEvent({
                title: newEvent.title!,
                sport: newEvent.sport || SportType.RUNNING,
                date: newEvent.date!,
                time: newEvent.time || 'TBD',
                location: newEvent.location || 'TBD',
                description: newEvent.description || '',
                hostId: user?.id || 'me'
            });

            if (created) {
                const formattedEvent: SportEvent = {
                    id: created.id,
                    hostId: user?.id || 'me',
                    hostName: user?.name || 'Me',
                    hostAvatar: user?.avatarUrl || '',
                    title: created.title,
                    sport: created.sport,
                    date: new Date(created.date).toLocaleDateString(),
                    time: created.time,
                    location: created.location,
                    description: created.description,
                    attendees: 1,
                    attendeeAvatars: [user?.avatarUrl || ''],
                    isJoined: true,
                    attendanceStatus: 'going'
                };

                setEvents([formattedEvent, ...events]);
                hapticFeedback.success();
                notificationService.showNotification("Event Created", { body: `${newEvent.title} is live!` });
                setShowCreateEventModal(false);
                setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
            }
        } catch (e) {
            console.error('Error creating event:', e);
            notificationService.showNotification("Error", { body: "Failed to create event." });
        }
    };

    return (
        <div className="min-h-full px-6 pt-10 pb-24 relative">
            {/* Global Modal for Verification */}
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onSuccess={handleVerificationSuccess}
                description="To host community events, please verify your identity."
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={`text-3xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Events</h1>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Upcoming activities.</p>
                    </div>
                </div>

                {/* Create Button */}
                <button
                    onClick={handleCreateClick}
                    className={`w-12 h-12 rounded-[20px] flex items-center justify-center shadow-lg transition-all active:scale-95 ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <GlassInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className={`pl-11 !py-3.5 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}`}
                />
                <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 -mx-6 px-6">
                <GlassSelectable
                    selected={selectedSport === 'All'}
                    onClick={() => setSelectedSport('All')}
                    className="!px-4 !py-2 whitespace-nowrap"
                >
                    All Events
                </GlassSelectable>
                {Object.values(SportType).map(sport => (
                    <GlassSelectable
                        key={sport}
                        selected={selectedSport === sport}
                        onClick={() => setSelectedSport(sport)}
                        className="!px-4 !py-2 whitespace-nowrap"
                    >
                        {sport}
                    </GlassSelectable>
                ))}
            </div>

            {/* Events List */}
            <div className="space-y-4">
                {filteredEvents.map((event, index) => {
                    const status = event.attendanceStatus || (event.isJoined ? 'going' : 'guest');

                    return (
                        <div
                            key={event.id}
                            className={`
                    p-5 rounded-[32px] border relative overflow-hidden group animate-slide-up backdrop-blur-xl
                    ${isLight ? 'bg-white/60 border-slate-200 shadow-lg' : 'bg-white/5 border-white/10 shadow-xl'}
                `}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{event.sport}</div>
                                        <h3 className={`text-xl font-display font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{event.title}</h3>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-[16px] text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${isLight ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-white/10 border-white/10 text-white'}`}>
                                        {event.date}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                                </div>

                                <p className={`text-sm mb-6 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                    {event.description}
                                </p>

                                <div className="flex justify-between items-center pt-4 border-t border-dashed border-white/10">
                                    <div className="flex -space-x-2">
                                        {event.attendeeAvatars?.slice(0, 3).map((av, i) => (
                                            <img key={i} src={av} className={`w-8 h-8 rounded-full border-2 ${isLight ? 'border-white' : 'border-black/50'}`} alt="" />
                                        ))}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isLight ? 'bg-slate-100 border-white text-slate-600' : 'bg-white/10 border-black/50 text-white'}`}>
                                            +{event.attendees}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => toggleRSVP(e, event.id)}
                                        className={`
                                px-6 py-2.5 rounded-[24px] text-xs font-bold transition-all duration-300 shadow-lg
                                ${status === 'going'
                                                ? 'bg-green-50 text-green-600 border border-green-200'
                                                : status === 'pending'
                                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    : (isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-gray-200')}
                            `}
                                    >
                                        {status === 'going' ? 'Going' : (status === 'pending' ? 'Pending' : 'Request Spot')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {filteredEvents.length === 0 && (
                    <div className="text-center py-12 opacity-50">
                        No events found.
                    </div>
                )}
            </div>

            {/* Event Creation Modal */}
            {showCreateEventModal && (
                <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center backdrop-blur-md p-0 sm:p-4 animate-fade-in ${isLight ? 'bg-slate-50/95' : 'bg-black/95'}`}>
                    <div className="absolute inset-0" onClick={() => setShowCreateEventModal(false)} />
                    <GlassCard className={`w-full max-w-md p-6 relative animate-slide-up rounded-t-[32px] sm:rounded-[32px] ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>
                        <button onClick={() => setShowCreateEventModal(false)} className={`absolute top-4 right-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`}><X size={20} /></button>
                        <h2 className={`text-xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>Create New Event</h2>
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
                            <div>
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Sport</label>
                                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                                    {Object.values(SportType).map(sport => (
                                        <button
                                            key={sport}
                                            onClick={() => setNewEvent({ ...newEvent, sport })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border ${newEvent.sport === sport ? 'bg-neon-blue text-black border-neon-blue' : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10')}`}
                                        >
                                            {sport}
                                        </button>
                                    ))}
                                </div>
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
                            <GlassButton onClick={handleCreateEvent} className="w-full mt-2">Publish Event</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
