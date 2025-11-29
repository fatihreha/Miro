
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Share2, Users, MapPin, Clock, Image as ImageIcon, Send, CheckCircle2, MessageCircle, Check, Shield, Gavel, Plus, X, Edit2, UserX, ShieldCheck, Calendar, Star, Settings, UserPlus, UserMinus, AlertCircle, Timer } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { SportType, Club, SportEvent, User } from '../types';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { clubService } from '../services/clubService';

// Mock data removed

export const ClubDetail: React.FC = () => {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { theme } = useTheme();

    const initialClub = (location.state as { club: Club })?.club || null;
    const [club, setClub] = useState<any>(initialClub);

    const [activeTab, setActiveTab] = useState<'info' | 'events' | 'chat' | 'dashboard'>('info');
    const [events, setEvents] = useState<SportEvent[]>([]);
    const [chatMessage, setChatMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);

    // Dashboard State
    const [members, setMembers] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [rules, setRules] = useState<string[]>([]);
    const [newRule, setNewRule] = useState('');
    const [dashSection, setDashSection] = useState<'requests' | 'members' | 'rules' | 'settings'>('requests');

    // Edit Club State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLoc, setEditLoc] = useState('');

    // Event Creation State
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<SportEvent>>({
        title: '',
        date: '',
        time: '',
        location: '',
        description: ''
    });

    const chatEndRef = useRef<HTMLDivElement>(null);
    const isLight = theme === 'light';
    const isOwner = user && (club?.ownerId === user.id);

    useEffect(() => {
        if (activeTab === 'chat') {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [activeTab]);

    useEffect(() => {
        const loadClubData = async () => {
            if (!clubId && !initialClub) return;

            // 1. Fetch Club Details (if not passed in state)
            if (!initialClub && clubId) {
                const fetchedClub = await clubService.getClubById(clubId);
                if (fetchedClub) {
                    setClub({
                        ...fetchedClub,
                        ownerId: fetchedClub.owner_id, // Map snake_case to camelCase
                        image: fetchedClub.avatar_url || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=60',
                        members: fetchedClub.member_count,
                        isMember: false, // TODO: Check membership
                        membershipStatus: 'guest' // TODO: Check status
                    });

                    // Check membership status
                    if (user) {
                        const userClubs = await clubService.getUserClubs(user.id);
                        const isMember = userClubs.some(c => c.id === fetchedClub.id);
                        if (isMember) {
                            setClub(prev => ({ ...prev, isMember: true, membershipStatus: 'member' }));
                        }
                    }
                }
            }

            // 2. Fetch Events
            const allEvents = await clubService.getEvents();
            // Filter events where host is the club owner (simple approximation for Club Events)
            // Ideally we'd filter by club_id if events table had it, but it uses host_id
            if (club?.ownerId) {
                const clubEvents = allEvents.filter(e => e.host_id === club.ownerId).map(e => ({
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
                    attendeeAvatars: [],
                    isJoined: false,
                    attendanceStatus: 'guest'
                }));
                setEvents(clubEvents);
            }

            // 3. Fetch Members & Applicants (if owner)
            if (clubId) {
                const fetchedClub = await clubService.getClubById(clubId);
                if (fetchedClub?.members) {
                    setMembers(fetchedClub.members.map((m: any) => ({
                        id: m.user_id,
                        name: m.user?.name || 'User',
                        avatar: m.user?.avatar_url || 'https://i.pravatar.cc/150',
                        role: m.role === 'owner' ? 'Admin' : 'Member'
                    })));
                }

                if (isOwner) {
                    const requests = await clubService.getJoinRequests(clubId);
                    setApplicants(requests.map(r => ({
                        id: r.id, // Request ID
                        userId: r.user_id,
                        name: r.user?.name || 'Applicant',
                        avatar: r.user?.avatar_url || 'https://i.pravatar.cc/150',
                        bio: r.user?.bio || ''
                    })));
                }
            }
        };
        loadClubData();
    }, [clubId, user, isOwner]); // removed 'club' from dependency to avoid infinite loop if we update club inside

    useEffect(() => {
        if (club) {
            setRules(club.rules || []);
            setEditName(club.name);
            setEditDesc(club.description);
            setEditLoc(club.location);
        }
    }, [club]);

    const handleJoinToggle = async () => {
        if (!club || !user) return;

        const currentStatus = club.membershipStatus || (club.isMember ? 'member' : 'guest');

        if (currentStatus === 'guest') {
            // Send Request
            const success = await clubService.joinClub(club.id, user.id);
            if (success) {
                setClub({ ...club, isMember: false, membershipStatus: 'pending' });
                hapticFeedback.success();
                notificationService.showNotification(`Request Sent`, {
                    body: `The owner of ${club.name} will review your request.`
                });
            }
        } else if (currentStatus === 'pending') {
            // Cancel Request (Not implemented in service yet, effectively leave)
            const success = await clubService.leaveClub(club.id, user.id); // Assuming leave cancels request too
            if (success) {
                setClub({ ...club, isMember: false, membershipStatus: 'guest' });
                hapticFeedback.medium();
            }
        } else {
            // Leave
            const success = await clubService.leaveClub(club.id, user.id);
            if (success) {
                setClub({ ...club, isMember: false, membershipStatus: 'guest' });
                hapticFeedback.medium();
            }
        }
    };

    const handleToggleEventRSVP = (eventId: string) => {
        hapticFeedback.medium();
        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
                const currentStatus = ev.attendanceStatus || (ev.isJoined ? 'going' : 'guest');

                if (currentStatus === 'guest') {
                    // Join/Request
                    const newStatus = 'going'; // Or 'pending' if we wanted granular event approvals too
                    hapticFeedback.success();
                    notificationService.showNotification("You're In!", { body: `RSVP confirmed for ${ev.title}` });
                    return { ...ev, isJoined: true, attendanceStatus: newStatus, attendees: ev.attendees + 1 };
                } else {
                    // Leave
                    return { ...ev, isJoined: false, attendanceStatus: 'guest', attendees: ev.attendees - 1 };
                }
            }
            return ev;
        }));
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        hapticFeedback.light();
        const newMessage = {
            id: Date.now().toString(),
            sender: 'You',
            text: chatMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: user?.avatarUrl || 'https://i.pravatar.cc/150',
            read: false
        };
        setMessages(prev => [...prev, newMessage]);
        setChatMessage('');
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date) {
            notificationService.showNotification("Missing Info", { body: "Please fill in event details." });
            return;
        }

        const created = await clubService.createEvent({
            title: newEvent.title!,
            sport: club.sport,
            date: newEvent.date!,
            time: newEvent.time || 'TBD',
            location: newEvent.location || 'TBD',
            description: newEvent.description || '',
            hostId: user?.id || 'me'
        });

        if (created) {
            const createdEvent: SportEvent = {
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

            setEvents([...events, createdEvent]);
            hapticFeedback.success();
            notificationService.showNotification("Event Published", { body: `Members notified about ${newEvent.title}` });
            setShowCreateEventModal(false);
            setNewEvent({ title: '', date: '', time: '', location: '', description: '' });
        }
    };

    // --- MANAGER FUNCTIONS ---

    const handleAddRule = () => {
        if (newRule.trim()) {
            const updatedRules = [...rules, newRule.trim()];
            setRules(updatedRules);
            setClub({ ...club, rules: updatedRules });
            setNewRule('');
            hapticFeedback.success();
        }
    };

    const handleDeleteRule = (idx: number) => {
        const updatedRules = rules.filter((_, i) => i !== idx);
        setRules(updatedRules);
        setClub({ ...club, rules: updatedRules });
        hapticFeedback.medium();
    };

    const handleAcceptApplicant = async (requestId: string) => {
        const success = await clubService.approveJoinRequest(requestId);
        if (success) {
            hapticFeedback.success();
            const applicant = applicants.find(a => a.id === requestId);
            if (applicant) {
                setMembers([...members, { ...applicant, role: 'Member' }]);
                setApplicants(applicants.filter(a => a.id !== requestId));
                setClub({ ...club, applications: Math.max(0, (club.applications || 0) - 1), members: club.members + 1 });
                notificationService.showNotification("Member Accepted", { body: `${applicant.name} joined the club.` });
            }
        }
    };

    const handleRejectApplicant = async (requestId: string) => {
        const success = await clubService.rejectJoinRequest(requestId);
        if (success) {
            hapticFeedback.medium();
            setApplicants(applicants.filter(a => a.id !== requestId));
            setClub({ ...club, applications: Math.max(0, (club.applications || 0) - 1) });
        }
    };

    const handleUpdateClubDetails = () => {
        setClub({ ...club, name: editName, description: editDesc, location: editLoc });
        setIsEditing(false);
        hapticFeedback.success();
        notificationService.showNotification("Club Updated", { body: "Details saved successfully." });
    };

    if (!club) return null;

    // Derived Status
    const membershipStatus = club.membershipStatus || (club.isMember ? 'member' : 'guest');

    return (
        <div className="min-h-full pb-24 relative bg-transparent">

            {/* EDIT CLUB MODAL */}
            {isEditing && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-lg ${isLight ? 'bg-white/80' : 'bg-black/80'}`}>
                    <GlassCard className={`w-full max-w-md animate-slide-up p-6 ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Edit Club</h2>
                            <button onClick={() => setIsEditing(false)}><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={`text-xs font-bold uppercase mb-1 block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Club Name</label>
                                <GlassInput value={editName} onChange={e => setEditName(e.target.value)} className={isLight ? 'bg-slate-50 border-slate-200' : ''} />
                            </div>
                            <div>
                                <label className={`text-xs font-bold uppercase mb-1 block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    className={`w-full rounded-xl p-3 text-sm resize-none focus:outline-none border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-black/20 border-white/10 text-white'}`}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className={`text-xs font-bold uppercase mb-1 block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Location</label>
                                <GlassInput value={editLoc} onChange={e => setEditLoc(e.target.value)} className={isLight ? 'bg-slate-50 border-slate-200' : ''} />
                            </div>
                            <GlassButton onClick={handleUpdateClubDetails} className="w-full mt-2">Save Changes</GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Hero Image Area */}
            <div className="relative h-72 w-full">
                <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-b ${isLight ? 'from-black/10 via-transparent to-white/20' : 'from-black/30 via-transparent to-black/80'}`} />

                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                    <button
                        onClick={() => navigate('/clubs')}
                        className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition">
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-neon-blue text-black text-[10px] font-bold uppercase tracking-wider">
                            {club.sport}
                        </span>
                        <div className="flex items-center gap-1 text-white/80 text-xs font-medium bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                            <MapPin size={10} /> {club.location}
                        </div>
                        {isOwner && (
                            <div className="flex items-center gap-1 text-white text-[10px] font-bold uppercase bg-purple-500/80 px-2 py-1 rounded-md backdrop-blur-sm border border-purple-400/50">
                                <Shield size={10} /> Manager
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{club.name}</h1>
                    <div className="flex items-center text-white/80 text-sm drop-shadow-sm">
                        <Users size={14} className="mr-1" /> {club.members} members
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={`px-6 py-4 border-b backdrop-blur-md sticky top-0 z-20 ${isLight ? 'border-slate-200/50 bg-white/80' : 'border-white/5 bg-black/80'}`}>
                <div className={`flex rounded-xl p-1 backdrop-blur-md ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
                    {['info', 'events', 'chat'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            disabled={tab !== 'info' && membershipStatus !== 'member'}
                            className={`
                        flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative
                        ${activeTab === tab
                                    ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-lg')
                                    : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white')}
                        ${(tab !== 'info' && membershipStatus !== 'member') ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                        >
                            {tab}
                            {tab === 'chat' && <span className="ml-1">🚧</span>}
                        </button>
                    ))}
                    {isOwner && (
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${activeTab === 'dashboard' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-lg') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white')}`}
                        >
                            <Shield size={12} /> Admin
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                {/* INFO TAB */}
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-slide-up">
                        <div>
                            <h3 className={`font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>About</h3>
                            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                {club.description}
                            </p>
                        </div>

                        {/* Rules Display */}
                        {club.rules && club.rules.length > 0 && (
                            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                                <h3 className={`font-bold mb-3 text-xs uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                    <ShieldCheck size={12} /> Club Rules
                                </h3>
                                <ul className="space-y-2">
                                    {club.rules.map((rule: string, i: number) => (
                                        <li key={i} className={`text-sm flex items-start gap-2 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                                            <span className="text-neon-blue mt-1">•</span> {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Join/Leave Button */}
                        {!isOwner && (
                            <GlassButton
                                onClick={handleJoinToggle}
                                className={`w-full h-14 ${membershipStatus === 'pending' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : ''}`}
                                variant={membershipStatus === 'member' ? 'secondary' : 'primary'}
                            >
                                {membershipStatus === 'member'
                                    ? 'Leave Club'
                                    : membershipStatus === 'pending'
                                        ? 'Request Sent'
                                        : 'Request to Join'
                                }
                            </GlassButton>
                        )}
                    </div>
                )}

                {/* EVENTS TAB */}
                {activeTab === 'events' && (
                    <div className="space-y-4 animate-slide-up">
                        {events.length > 0 ? (
                            events.map((event, idx) => (
                                <div
                                    key={event.id}
                                    className={`
                                p-5 rounded-[24px] border relative overflow-hidden
                                ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}
                            `}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{event.date} @ {event.time}</div>
                                            <h3 className={`text-lg font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{event.title}</h3>
                                        </div>
                                        {event.isJoined && (
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    <div className={`text-sm mb-4 flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                                        <MapPin size={14} /> {event.location}
                                    </div>

                                    <p className={`text-xs mb-5 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                        {event.description}
                                    </p>

                                    <div className="flex justify-between items-center border-t pt-4 border-white/10">
                                        <div className="flex -space-x-2">
                                            {event.attendeeAvatars?.map((av, i) => (
                                                <img key={i} src={av} className={`w-7 h-7 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#18181b]'}`} alt="" />
                                            ))}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${isLight ? 'bg-slate-100 border-white text-slate-500' : 'bg-white/10 border-[#18181b] text-white'}`}>
                                                +{event.attendees}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleEventRSVP(event.id)}
                                            className={`
                                        px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95
                                        ${event.isJoined
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : (isLight ? 'bg-slate-900 text-white shadow-lg hover:bg-slate-800' : 'bg-white text-black shadow-lg hover:bg-gray-200')}
                                    `}
                                        >
                                            {event.isJoined ? 'Going' : 'RSVP Now'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                No upcoming events.
                            </div>
                        )}
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="h-[calc(100vh-350px)] flex flex-col items-center justify-center text-center p-6">
                        <div className="text-4xl mb-4">🚧</div>
                        <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Coming Soon</h3>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                            Club chat is currently under development. Check back later!
                        </p>
                    </div>
                )}
                {/* DASHBOARD TAB (ADMIN - FULLY REDESIGNED) */}
                {activeTab === 'dashboard' && isOwner && (
                    <div className="space-y-6 animate-slide-up">
                        {/* Overview Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <GlassCard className={`p-3 flex flex-col items-center justify-center ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20'}`}>
                                <div className="text-blue-500 mb-1"><Users size={20} /></div>
                                <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{club.members}</div>
                                <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Members</div>
                            </GlassCard>
                            <GlassCard
                                onClick={() => setDashSection('requests')}
                                className={`p-3 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform ${applicants.length > 0 ? (isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-500/20') : (isLight ? 'bg-slate-50' : 'bg-white/5')}`}
                            >
                                <div className={applicants.length > 0 ? "text-amber-500 mb-1" : "opacity-50 mb-1"}><UserPlus size={20} /></div>
                                <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{applicants.length}</div>
                                <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Pending</div>
                            </GlassCard>
                            <GlassCard className={`p-3 flex flex-col items-center justify-center ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/10 border-purple-500/20'}`}>
                                <div className="text-purple-500 mb-1"><Calendar size={20} /></div>
                                <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{events.length}</div>
                                <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Events</div>
                            </GlassCard>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-3">
                            <GlassButton onClick={() => setShowCreateEventModal(true)} className="flex-1 h-12 text-xs !bg-neon-blue !text-black shadow-neon-blue/20">
                                <Plus size={14} className="mr-1" /> New Event
                            </GlassButton>
                            <GlassButton onClick={() => setIsEditing(true)} variant="secondary" className="flex-1 h-12 text-xs">
                                <Edit2 size={14} className="mr-1" /> Edit Details
                            </GlassButton>
                        </div>

                        {/* Management Tabs */}
                        <div className="flex gap-3 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setDashSection('requests')}
                                className={`text-xs font-bold pb-2 whitespace-nowrap transition-colors flex items-center gap-1 ${dashSection === 'requests' ? 'text-neon-blue border-b-2 border-neon-blue' : (isLight ? 'text-slate-500' : 'text-white/40')}`}
                            >
                                Requests ({applicants.length})
                            </button>
                            <button
                                onClick={() => setDashSection('members')}
                                className={`text-xs font-bold pb-2 whitespace-nowrap transition-colors ${dashSection === 'members' ? 'text-neon-blue border-b-2 border-neon-blue' : (isLight ? 'text-slate-500' : 'text-white/40')}`}
                            >
                                Members
                            </button>
                            <button
                                onClick={() => setDashSection('rules')}
                                className={`text-xs font-bold pb-2 whitespace-nowrap transition-colors ${dashSection === 'rules' ? 'text-neon-blue border-b-2 border-neon-blue' : (isLight ? 'text-slate-500' : 'text-white/40')}`}
                            >
                                Rules
                            </button>
                        </div>

                        {/* DYNAMIC SECTION CONTENT */}

                        {/* 1. REQUESTS */}
                        {dashSection === 'requests' && (
                            <div className="space-y-3 animate-slide-up">
                                {applicants.length === 0 ? (
                                    <div className={`text-center py-8 text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>No pending requests.</div>
                                ) : (
                                    applicants.map(app => (
                                        <GlassCard key={app.id} className={`p-3 flex items-center justify-between ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={app.avatar} className="w-10 h-10 rounded-full" alt="" />
                                                <div>
                                                    <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{app.name}</div>
                                                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{app.bio}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleRejectApplicant(app.id)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition"><X size={14} /></button>
                                                <button onClick={() => handleAcceptApplicant(app.id)} className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition"><Check size={14} /></button>
                                            </div>
                                        </GlassCard>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 2. MEMBERS */}
                        {dashSection === 'members' && (
                            <div className="space-y-3 animate-slide-up">
                                {members.map(member => (
                                    <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl border ${isLight ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} className="w-10 h-10 rounded-full" alt="" />
                                            <div>
                                                <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{member.name}</div>
                                                <div className={`text-[10px] ${member.role === 'Admin' ? 'text-purple-500 font-bold' : (isLight ? 'text-slate-500' : 'text-white/50')}`}>{member.role}</div>
                                            </div>
                                        </div>
                                        {member.role !== 'Admin' && (
                                            <button className={`p-2 rounded-full transition hover:bg-red-500 hover:text-white ${isLight ? 'bg-red-50 text-red-500' : 'bg-red-500/10 text-red-400'}`}>
                                                <UserX size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 3. RULES */}
                        {dashSection === 'rules' && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="flex gap-2">
                                    <GlassInput
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        placeholder="Add a new rule..."
                                        className={`!py-2 !text-sm ${isLight ? 'bg-slate-50 border-slate-200' : ''}`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                    />
                                    <button onClick={handleAddRule} className={`px-4 rounded-xl border font-bold ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>+</button>
                                </div>
                                <div className="space-y-2">
                                    {rules.map((rule, idx) => (
                                        <div key={idx} className={`flex justify-between items-center p-3 rounded-lg text-sm border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 text-white/80'}`}>
                                            <div className="flex items-center gap-2">
                                                <Gavel size={14} className="opacity-50" /> {rule}
                                            </div>
                                            <button onClick={() => handleDeleteRule(idx)}><X size={14} className="opacity-50 hover:opacity-100 hover:text-red-500" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
    );
};
