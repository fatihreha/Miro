
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { User, SportType, Booking } from '../types';
import { ArrowLeft, Star, MapPin, CheckCircle2, Share2, Clock, Calendar, DollarSign, X, MessageCircle, Award, Sparkles, ShieldAlert, ChevronRight, Edit2, Save, Plus, TrendingUp, Users, Bell, Check, CreditCard, Wallet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { enhanceTrainerBio } from '../services/geminiService';
import { ReportModal } from '../components/modals/ReportModal';
import { trainerService } from '../services/trainerService';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { supabase } from '../services/supabase';

// Mock data removed

// Default slots - will be overridden by trainer's actual availability
const DEFAULT_SLOTS = [
    '07:00 AM', '08:30 AM', '10:00 AM',
    '01:00 PM', '02:30 PM', '04:00 PM',
    '05:30 PM', '07:00 PM'
];

// Helper to generate time slots from trainer availability
const generateTimeSlotsFromAvailability = (availability: { days: string[], startHour: string, endHour: string } | undefined): string[] => {
    if (!availability || !availability.startHour || !availability.endHour) {
        return DEFAULT_SLOTS;
    }
    
    const slots: string[] = [];
    const [startH] = availability.startHour.split(':').map(Number);
    const [endH] = availability.endHour.split(':').map(Number);
    
    for (let hour = startH; hour < endH; hour++) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        slots.push(`${displayHour.toString().padStart(2, '0')}:00 ${period}`);
        if (hour + 1 < endH) {
            slots.push(`${displayHour.toString().padStart(2, '0')}:30 ${period}`);
        }
    }
    
    return slots.length > 0 ? slots : DEFAULT_SLOTS;
};

const SPECIALTIES_LIST = [
    'Weight Loss', 'Muscle Building', 'HIIT', 'Yoga', 'Pilates',
    'Rehab', 'Nutrition', 'Marathon Prep', 'Boxing', 'CrossFit'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper to generate next 14 days
const getNextDays = (days: number) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
};

export const TrainerDetail: React.FC = () => {
    const { trainerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser, updateUser } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const initialTrainer = (location.state as { trainer: User })?.trainer || null;
    const [trainer, setTrainer] = useState<User | null>(initialTrainer);

    const isOwner = currentUser?.id === trainer?.id;

    // View Mode for Owner: 'preview' (what others see) or 'dashboard' (management)
    const [viewMode, setViewMode] = useState<'preview' | 'dashboard'>(isOwner ? 'dashboard' : 'preview');

    const [bookingStep, setBookingStep] = useState<'date' | 'confirm' | null>(null);
    const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());
    const [bookingTime, setBookingTime] = useState('');
    const [calendarDays] = useState(getNextDays(14));
    
    // Available slots based on trainer's availability
    const availableSlots = trainer?.availability 
        ? generateTimeSlotsFromAvailability(trainer.availability)
        : DEFAULT_SLOTS;

    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Edit Mode States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editRate, setEditRate] = useState('');
    const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
    const [editAvailability, setEditAvailability] = useState<{ days: string[], startHour: string, endHour: string }>({
        days: [], startHour: '09:00', endHour: '17:00'
    });
    const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

    // Dashboard Data
    const [myBookings, setMyBookings] = useState<Booking[]>([]);

    const [inquiries, setInquiries] = useState<any[]>([]);

    // Load Trainer Data
    useEffect(() => {
        const loadTrainer = async () => {
            if (!trainer && trainerId) {
                const data = await trainerService.getTrainerById(trainerId);
                if (data) setTrainer(data);
            }
        };
        loadTrainer();
    }, [trainerId, trainer]);

    // Load Dashboard Data (Owner Only)
    useEffect(() => {
        if (isOwner && trainer) {
            // Load Bookings
            const loadBookings = async () => {
                const data = await trainerService.getTrainerBookings(trainer.id);
                // Map Supabase data to component format
                const formatted = data.map(b => ({
                    id: b.id,
                    clientId: b.user_id,
                    clientName: b.user?.name || 'Unknown',
                    clientAvatar: b.user?.avatar_url || 'https://i.pravatar.cc/150',
                    date: new Date(b.scheduled_date).toLocaleDateString(),
                    time: b.scheduled_time,
                    status: b.status,
                    price: b.price
                }));
                setMyBookings(formatted);
            };
            loadBookings();

            // Load Inquiries
            const loadInquiries = async () => {
                const chats = await chatService.getConversations(currentUser.id);
                // We need to fetch user details for each chat partner
                // For now, we'll just use what we have or fetch individually if needed
                // Assuming chatService returns basic info, but we might need to enhance it
                // Actually chatService.getConversations returns { partnerId, lastMessage, timestamp }
                // We need name and avatar. 
                // Let's fetch them.
                const enhancedChats = await Promise.all(chats.map(async (chat) => {
                    const chatUser = await trainerService.getTrainerById(chat.partnerId) || await import('../services/userService').then(m => m.userService.getUserById(chat.partnerId));
                    
                    // Get unread count from supabase
                    const { count: unreadCount } = await import('../services/supabase').then(m => 
                        m.supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('recipient_id', currentUser.id)
                            .eq('sender_id', chat.partnerId)
                            .eq('is_read', false)
                    );

                    return {
                        id: chat.partnerId,
                        senderId: chat.partnerId,
                        senderName: chatUser?.name || 'User',
                        avatar: chatUser?.avatarUrl || 'https://i.pravatar.cc/150',
                        lastMessage: chat.lastMessage,
                        time: new Date(chat.timestamp).toLocaleTimeString(),
                        unread: unreadCount || 0
                    };
                }));
                setInquiries(enhancedChats);
            };
            loadInquiries();
        }
    }, [isOwner, trainer, currentUser]);

    useEffect(() => {
        if (trainer) {
            setEditName(trainer.name);
            setEditLocation(trainer.location);
            setEditBio(trainer.bio || '');
            setEditRate(trainer.hourlyRate?.toString() || '');
            setEditSpecialties(trainer.specialties || []);
            if (trainer.availability) {
                setEditAvailability(trainer.availability);
            }
        }
    }, [trainer]);

    if (!trainer) {
        return (
            <div className="flex items-center justify-center h-full text-white/50">
                Trainer not found.
            </div>
        );
    }

    const handleEnhanceBio = async () => {
        hapticFeedback.light();
        setIsEnhancing(true);
        try {
            const currentBio = isEditing ? editBio : trainer.bio;
            const specs = isEditing ? editSpecialties : (trainer.specialties || []);
            const newBio = await enhanceTrainerBio(currentBio, specs);

            if (isEditing) {
                setEditBio(newBio);
            } else {
                setIsEditing(true);
                setEditBio(newBio);
            }
            hapticFeedback.success();
        } catch (error) {
            console.error(error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!trainer) return;
        const updatedData: Partial<User> = {
            name: editName,
            location: editLocation,
            bio: editBio,
            hourlyRate: parseInt(editRate),
            specialties: editSpecialties,
            availability: editAvailability
        };

        setTrainer({ ...trainer, ...updatedData });
        updateUser(updatedData);

        // Persist to database
        try {
            await trainerService.updateAvailability(trainer.id, editAvailability);
            
            // Also update user profile
            await supabase
                .from('users')
                .update({
                    name: editName,
                    location: editLocation,
                    bio: editBio,
                    hourly_rate: parseInt(editRate)
                })
                .eq('id', trainer.id);

            await supabase
                .from('trainers')
                .update({
                    specialties: editSpecialties,
                    hourly_rate: parseInt(editRate),
                    availability: editAvailability
                })
                .eq('user_id', trainer.id);
        } catch (error) {
            console.error('Error saving trainer data:', error);
        }

        setIsEditing(false);
        hapticFeedback.success();
        notificationService.showNotification("Profile Updated", { body: "Your pro details are saved." });
    };

    const toggleSpecialty = (spec: string) => {
        hapticFeedback.light();
        if (editSpecialties.includes(spec)) {
            setEditSpecialties(editSpecialties.filter(s => s !== spec));
        } else {
            if (editSpecialties.length < 10) {
                setEditSpecialties([...editSpecialties, spec]);
            }
        }
    };

    const toggleAvailabilityDay = (day: string) => {
        hapticFeedback.light();
        setEditAvailability(prev => {
            const days = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days };
        });
    };

    const handleMessage = () => {
        hapticFeedback.medium();
        navigate(`/chat/${trainer.id}`);
    };

    const handleConfirmBooking = async () => {
        if (!currentUser || !trainer) return;
        
        hapticFeedback.success();
        const dateStr = selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        // Save booking to database
        try {
            await trainerService.bookSession({
                userId: currentUser.id,
                trainerId: trainer.id,
                scheduledDate: selectedDateObj.toISOString().split('T')[0],
                scheduledTime: bookingTime,
                price: trainer.hourlyRate || 60
            });
        } catch (error) {
            console.error('Error saving booking:', error);
        }

        notificationService.showNotification("Session Booked!", {
            body: `Confirmed with ${trainer.name} for ${dateStr} at ${bookingTime}`,
            icon: trainer.avatarUrl
        });
        setBookingStep(null);
    };

    const handleAcceptBooking = async (bookingId: string) => {
        hapticFeedback.success();
        
        // Optimistic update
        setMyBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
        notificationService.showNotification("Booking Confirmed", { body: "Client has been notified." });

        // Persist to database
        try {
            await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', bookingId);
        } catch (error) {
            console.error('Error confirming booking:', error);
        }
    };

    const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
    const getDayNum = (date: Date) => date.getDate();

    // --- RENDER: DASHBOARD VIEW (OWNER ONLY) ---
    if (isOwner && viewMode === 'dashboard') {
        return (
            <div className="min-h-full pb-24 relative bg-transparent px-6 pt-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Dashboard</h1>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Welcome back, Coach.</p>
                    </div>
                    <GlassButton
                        onClick={() => setViewMode('preview')}
                        variant="secondary"
                        className="!px-4 !py-2 text-xs !h-10"
                    >
                        View Profile
                    </GlassButton>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
                    <GlassCard className={`p-3 flex flex-col items-center justify-center ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/10 border-green-500/20'}`}>
                        <div className="text-green-500 mb-1"><DollarSign size={20} /></div>
                        <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>$840</div>
                        <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Earnings</div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20'}`}>
                        <div className="text-blue-500 mb-1"><Calendar size={20} /></div>
                        <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>12</div>
                        <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Sessions</div>
                    </GlassCard>
                    <GlassCard className={`p-3 flex flex-col items-center justify-center ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/10 border-purple-500/20'}`}>
                        <div className="text-purple-500 mb-1"><TrendingUp size={20} /></div>
                        <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>4.9</div>
                        <div className={`text-[9px] uppercase font-bold tracking-wider opacity-60 ${isLight ? 'text-slate-600' : 'text-white'}`}>Rating</div>
                    </GlassCard>
                </div>

                {/* Availability Manager */}
                <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Weekly Schedule</h3>
                        <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Tap to toggle</span>
                    </div>
                    <GlassCard className={`p-4 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex justify-between mb-4">
                            {WEEKDAYS.map(day => {
                                const isActive = editAvailability.days.includes(day);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => toggleAvailabilityDay(day)}
                                        className={`
                                        w-10 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all
                                        ${isActive
                                                ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20 scale-105'
                                                : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/30 hover:bg-white/10')}
                                    `}
                                    >
                                        {day.charAt(0)}
                                        {isActive && <div className="w-1 h-1 bg-black rounded-full mt-1" />}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Start</label>
                                <GlassInput
                                    type="time"
                                    value={editAvailability.startHour}
                                    onChange={(e) => setEditAvailability({ ...editAvailability, startHour: e.target.value })}
                                    className={`!py-2 !text-xs ${isLight ? 'bg-slate-50' : ''}`}
                                />
                            </div>
                            <div className="flex-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>End</label>
                                <GlassInput
                                    type="time"
                                    value={editAvailability.endHour}
                                    onChange={(e) => setEditAvailability({ ...editAvailability, endHour: e.target.value })}
                                    className={`!py-2 !text-xs ${isLight ? 'bg-slate-50' : ''}`}
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveChanges} className="w-full mt-4 py-2 text-xs font-bold text-neon-blue uppercase tracking-widest border border-dashed border-neon-blue/30 rounded-lg hover:bg-neon-blue/10 transition">
                            Update Availability
                        </button>
                    </GlassCard>
                </div>

                {/* Bookings Section */}
                <div className="mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Recent Bookings</h3>
                    <div className="space-y-3">
                        {myBookings.map(booking => (
                            <div key={booking.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                <img src={booking.clientAvatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                                <div className="flex-1">
                                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{booking.clientName}</div>
                                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>{booking.date} • {booking.time}</div>
                                    <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'text-green-500' : 'text-amber-500'}`}>
                                        {booking.status}
                                    </div>
                                </div>
                                {booking.status === 'pending' && (
                                    <button onClick={() => handleAcceptBooking(booking.id)} className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition">
                                        <Check size={20} />
                                    </button>
                                )}
                                <button onClick={() => navigate(`/chat/${booking.clientId}`)} className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/10'}`}>
                                    <MessageCircle size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inbox Section */}
                <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Client Inquiries</h3>
                    <div className="space-y-3">
                        {inquiries.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => navigate(`/chat/${chat.senderId}`)}
                                className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition hover:scale-[1.01] ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}
                            >
                                <div className="relative">
                                    <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                    {chat.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#18181b]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{chat.senderName}</span>
                                        <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{chat.time}</span>
                                    </div>
                                    <div className={`text-xs truncate ${chat.unread ? (isLight ? 'text-slate-900 font-bold' : 'text-white font-bold') : (isLight ? 'text-slate-500' : 'text-white/50')}`}>
                                        {chat.lastMessage}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`opacity-30 ${isLight ? 'text-slate-900' : 'text-white'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: PROFILE VIEW (PUBLIC + EDIT) ---
    return (
        <div className="min-h-full pb-24 relative bg-transparent">
            {/* Report Modal */}
            {currentUser && !isOwner && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={trainer.id}
                    reportedUserName={trainer.name}
                    reporterId={currentUser.id}
                />
            )}

            {/* Header Image */}
            <div className="relative h-80 w-full">
                <img src={trainer.avatarUrl} className="w-full h-full object-cover" alt={trainer.name} />
                <div className={`absolute inset-0 bg-gradient-to-b ${isLight ? 'from-black/10 via-transparent to-white/50' : 'from-black/40 via-transparent to-black/80'}`} />

                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition"><ArrowLeft size={20} /></button>

                    <div className="flex gap-2">
                        {isOwner ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('dashboard')}
                                    className="px-4 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider hover:bg-black/60 transition"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition ${isEditing ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'bg-black/20 text-white hover:bg-white/10'}`}
                                >
                                    {isEditing ? <X size={20} /> : <Edit2 size={18} />}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setIsReportModalOpen(true)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-white/10 transition"><ShieldAlert size={20} /></button>
                                <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition"><Share2 size={20} /></button>
                            </>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-neon-blue text-black text-[10px] font-bold uppercase tracking-wider">
                            {trainer.interests[0] || 'Pro'}
                        </span>
                        {isOwner && (
                            <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-green-400" /> Owner View
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2 mb-2 animate-fade-in">
                            <GlassInput
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="!bg-black/40 !border-white/20 text-white placeholder-white/50 !text-2xl font-bold !py-1 !px-3"
                                placeholder="Your Name"
                            />
                            <GlassInput
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="!bg-black/40 !border-white/20 text-white placeholder-white/50 !text-sm !py-1 !px-3 w-2/3"
                                placeholder="Location"
                            />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{trainer.name}</h1>
                            <div className="flex items-center gap-3 text-white/90 text-sm drop-shadow-sm">
                                <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {trainer.rating} ({trainer.reviewCount})</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><MapPin size={14} /> {trainer.location}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* Bio */}
                <div className="animate-slide-up">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>About</h3>
                        {(isOwner || isEditing) && (
                            <button
                                onClick={handleEnhanceBio}
                                disabled={isEnhancing}
                                className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all 
                            ${isEnhancing ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'} 
                            ${isLight
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                                        : 'bg-white/5 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/10 hover:text-white shadow-[0_0_15px_rgba(0,242,255,0.1)]'}
                        `}
                            >
                                <Sparkles size={12} className={isEnhancing ? "animate-spin" : ""} />
                                {isEnhancing ? 'Optimizing...' : 'AI Enhance'}
                            </button>
                        )}
                    </div>
                    {isEditing ? (
                        <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            className={`w-full h-32 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all ${isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-white/5 border border-white/10 text-white'}`}
                            placeholder="Describe your training style..."
                        />
                    ) : (
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>{trainer.bio}</p>
                    )}
                </div>

                {/* Specialties */}
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                        {(isEditing ? editSpecialties : trainer.specialties)?.map(s => (
                            <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${isLight ? 'bg-white/60 border-slate-200 text-slate-700 shadow-sm' : 'bg-white/5 border-white/10 text-white/80'}`}>
                                <Award size={12} className={isLight ? 'text-blue-500' : 'text-neon-blue'} /> {s}
                                {isEditing && <button onClick={() => toggleSpecialty(s)}><X size={12} className="opacity-50 hover:opacity-100" /></button>}
                            </span>
                        ))}
                        {isEditing && (
                            <button
                                onClick={() => setShowSpecialtyModal(true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed flex items-center gap-1 ${isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-50' : 'border-white/20 text-white/40 hover:bg-white/5'}`}
                            >
                                <Plus size={12} /> Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Availability Preview (Public View) */}
                <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                    <h3 className={`font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Availability</h3>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {calendarDays.slice(0, 7).map((date) => {
                            const dayName = getDayName(date);
                            const dateNum = getDayNum(date);
                            const isAvailable = trainer.availability?.days.includes(dayName) || true; // Default true for demo

                            if (!isAvailable) return null;

                            return (
                                <GlassCard
                                    key={date.toString()}
                                    className={`min-w-[70px] p-3 flex flex-col items-center justify-center cursor-pointer border transition-all hover:scale-105 active:scale-95 ${isLight ? 'bg-white/60 border-slate-200 hover:border-neon-blue' : 'bg-white/5 border-white/10 hover:border-neon-blue/50'}`}
                                    onClick={() => { setSelectedDateObj(date); setBookingStep('date'); }}
                                >
                                    <div className={`text-[10px] uppercase font-bold mb-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{dayName}</div>
                                    <div className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{dateNum}</div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <GlassCard className={`p-4 flex items-center gap-3 ${isLight ? 'bg-white/60 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>150+</div>
                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Sessions Done</div>
                        </div>
                    </GlassCard>
                    <GlassCard className={`p-4 flex items-center gap-3 ${isLight ? 'bg-white/60 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Star size={20} />
                        </div>
                        <div>
                            <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{trainer.rating}</div>
                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Rating</div>
                        </div>
                    </GlassCard>
                </div>

                {/* Reviews Preview */}
                <GlassCard className={`p-5 animate-slide-up ${isLight ? 'bg-white/60 border-slate-200' : 'bg-white/5 border-white/10'}`} style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Client Reviews</h3>
                        <button className="text-xs font-bold text-neon-blue hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-3 pb-3 border-b border-dashed border-white/10 last:border-0 last:pb-0">
                                <img src={`https://i.pravatar.cc/150?u=${i + 20}`} className="w-8 h-8 rounded-full" alt="" />
                                <div>
                                    <div className={`text-xs font-bold mb-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>Satisfied Client</div>
                                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Great session! Really pushed me to my limits. Highly recommend for anyone looking to improve.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Fixed Bottom Action */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 backdrop-blur-xl border-t z-20 flex items-center gap-4 safe-area-bottom ${isLight ? 'bg-white/80 border-slate-200/50' : 'bg-black/80 border-white/10'}`}>
                <div className="flex-1">
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Hourly Rate</div>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <span className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>$</span>
                            <input
                                type="number"
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                                className={`bg-transparent border-none outline-none w-20 text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}
                            />
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${trainer.hourlyRate}</span>
                            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/40'}`}>/ session</span>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <GlassButton onClick={handleSaveChanges} className="px-8 !rounded-xl shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-500 border-0">
                        <Save size={18} className="mr-2" /> Save
                    </GlassButton>
                ) : (
                    <div className="flex gap-3">
                        {isOwner ? (
                            <GlassButton onClick={() => setIsEditing(true)} className="px-8 !rounded-xl shadow-lg shadow-neon-blue/20">
                                Edit Profile
                            </GlassButton>
                        ) : (
                            <>
                                <GlassButton
                                    onClick={handleMessage}
                                    variant="secondary"
                                    className="!px-4 !rounded-xl"
                                >
                                    <MessageCircle size={20} />
                                </GlassButton>
                                <GlassButton onClick={() => setBookingStep('date')} className="px-8 !rounded-xl shadow-lg shadow-neon-blue/20">
                                    Book Now
                                </GlassButton>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Specialty Selection Modal (Reused) */}
            {showSpecialtyModal && (
                <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-fade-in backdrop-blur-md ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
                    <div className="absolute inset-0" onClick={() => setShowSpecialtyModal(false)} />
                    <GlassCard className={`w-full max-w-md p-6 relative z-10 animate-slide-up rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] flex flex-col ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Select Specialties</h3>
                            <button onClick={() => setShowSpecialtyModal(false)}><X size={24} /></button>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center mb-8 overflow-y-auto flex-1">
                            {SPECIALTIES_LIST.map((spec) => (
                                <GlassSelectable
                                    key={spec}
                                    selected={editSpecialties.includes(spec)}
                                    onClick={() => toggleSpecialty(spec)}
                                    className="!py-2.5 !px-5 !text-sm flex-grow text-center"
                                >
                                    {spec}
                                </GlassSelectable>
                            ))}
                        </div>
                        <GlassButton onClick={() => setShowSpecialtyModal(false)} className="w-full flex-shrink-0">
                            Done
                        </GlassButton>
                    </GlassCard>
                </div>
            )}

            {/* Enhanced Booking Modal */}
            {bookingStep && (
                <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center backdrop-blur-md p-0 sm:p-4 animate-fade-in ${isLight ? 'bg-slate-50/95' : 'bg-black/95'}`}>
                    <div className="absolute inset-0" onClick={() => setBookingStep(null)} />
                    <GlassCard className={`w-full max-w-md p-0 relative animate-slide-up rounded-t-[32px] sm:rounded-[32px] overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>

                        {/* Modal Header */}
                        <div className={`p-5 flex justify-between items-center border-b ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <img src={trainer.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div>
                                    <div className={`text-[10px] font-bold uppercase tracking-wider opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Booking</div>
                                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{trainer.name}</div>
                                </div>
                            </div>
                            <button onClick={() => setBookingStep(null)} className={`p-2 rounded-full ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white'}`}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {bookingStep === 'date' ? (
                                <div className="space-y-6 animate-slide-up">
                                    {/* Calendar Strip */}
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                            <Calendar size={12} /> Select Date
                                        </label>
                                        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar -mx-2 px-2">
                                            {calendarDays.map((date) => {
                                                const isSelected = date.getDate() === selectedDateObj.getDate();
                                                return (
                                                    <button
                                                        key={date.toString()}
                                                        onClick={() => { hapticFeedback.light(); setSelectedDateObj(date); }}
                                                        className={`
                                                    flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border
                                                    ${isSelected
                                                                ? 'bg-neon-blue border-neon-blue text-black shadow-lg shadow-neon-blue/20 scale-105'
                                                                : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10')}
                                                `}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase">{getDayName(date)}</span>
                                                        <span className="text-xl font-bold">{getDayNum(date)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time Grid */}
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                            <Clock size={12} /> Select Time
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {availableSlots.map(slot => {
                                                const isSelected = bookingTime === slot;
                                                return (
                                                    <button
                                                        key={slot}
                                                        onClick={() => { hapticFeedback.light(); setBookingTime(slot); }}
                                                        className={`
                                                    py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2
                                                    ${isSelected
                                                                ? (isLight ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-black border-white shadow-lg')
                                                                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10')}
                                                `}
                                                    >
                                                        {slot}
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <GlassButton
                                        disabled={!bookingTime}
                                        onClick={() => setBookingStep('confirm')}
                                        className="w-full h-14 text-sm"
                                    >
                                        Continue
                                    </GlassButton>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-slide-up">
                                    {/* Ticket/Receipt Card */}
                                    <div className={`rounded-3xl border overflow-hidden relative ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                        {/* Perforated Line Visual */}
                                        <div className="absolute top-2/3 left-0 w-full h-[1px] border-t-2 border-dashed border-gray-500/20 z-10"></div>
                                        <div className={`absolute top-2/3 -left-3 w-6 h-6 rounded-full z-20 ${isLight ? 'bg-white border border-slate-200' : 'bg-[#18181b] border border-white/10'}`} style={{ marginTop: '-12px' }}></div>
                                        <div className={`absolute top-2/3 -right-3 w-6 h-6 rounded-full z-20 ${isLight ? 'bg-white border border-slate-200' : 'bg-[#18181b] border border-white/10'}`} style={{ marginTop: '-12px' }}></div>

                                        <div className="p-6 pb-8">
                                            <div className={`text-xs uppercase font-bold tracking-widest mb-4 opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Session Details</div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDateObj.getDate()} {selectedDateObj.toLocaleDateString('en-US', { month: 'short' })}</div>
                                                    <div className={`text-sm opacity-60 ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                                </div>
                                                <div className={`text-right`}>
                                                    <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{bookingTime}</div>
                                                    <div className={`text-sm opacity-60 ${isLight ? 'text-slate-900' : 'text-white'}`}>1 Hour</div>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-medium p-2 rounded-lg ${isLight ? 'bg-white border border-slate-200 text-slate-600' : 'bg-black/30 border border-white/10 text-white/70'}`}>
                                                <MapPin size={12} /> {trainer.location}
                                            </div>
                                        </div>

                                        <div className={`p-6 pt-8 ${isLight ? 'bg-slate-100/50' : 'bg-white/5'}`}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className={isLight ? 'text-slate-500' : 'text-white/60'}>Trainer Rate</span>
                                                <span className={isLight ? 'text-slate-900' : 'text-white'}>${trainer.hourlyRate}.00</span>
                                            </div>
                                            <div className="flex justify-between text-sm mb-4">
                                                <span className={isLight ? 'text-slate-500' : 'text-white/60'}>Platform Fee</span>
                                                <span className={isLight ? 'text-slate-900' : 'text-white'}>$2.50</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Total</span>
                                                <span className="text-2xl font-black text-green-500">${((trainer.hourlyRate || 0) + 2.50).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Selector Mock */}
                                    <div className="flex gap-3">
                                        <button className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'}`}>
                                            <span className="font-bold">Pay</span> <span className="text-[10px] bg-white/20 px-1 rounded">US</span>
                                        </button>
                                        <button className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 ${isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-white/5 text-white/50 border-white/10'}`}>
                                            <CreditCard size={16} /> Card
                                        </button>
                                    </div>

                                    <GlassButton onClick={handleConfirmBooking} className="w-full h-14 text-lg shadow-xl shadow-green-500/20 bg-green-600 hover:bg-green-500 border-0">
                                        Slide to Confirm
                                    </GlassButton>

                                    <button
                                        onClick={() => setBookingStep('date')}
                                        className={`w-full text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white'}`}
                                    >
                                        Back to Date
                                    </button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
