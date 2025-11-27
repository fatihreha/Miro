
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassSelectable, GlassInput } from '../components/ui/Glass';
import { User, SportType } from '../types';
import { Star, MapPin, Clock, DollarSign, X, Dumbbell, ChevronRight, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { notificationService } from '../services/notificationService';
import { hapticFeedback } from '../services/hapticService';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';

const MOCK_TRAINERS: User[] = [
    {
        id: 't1',
        name: 'Coach David',
        age: 32,
        bio: 'Certified Personal Trainer specializing in HIIT and Strength Training. Let\'s crush your goals.',
        location: 'Downtown Gym',
        avatarUrl: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=800&auto=format&fit=crop&q=60',
        interests: [SportType.GYM, SportType.BOXING],
        level: 'Pro',
        isTrainer: true,
        hourlyRate: 60,
        rating: 4.9,
        reviewCount: 124,
        specialties: ['Weight Loss', 'Muscle Building', 'HIIT']
    },
    {
        id: 't2',
        name: 'Sarah Jenkins',
        age: 28,
        bio: 'Yoga Alliance certified instructor. Focusing on flexibility, mindfulness, and core strength.',
        location: 'Zen Studio',
        avatarUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&auto=format&fit=crop&q=60',
        interests: [SportType.YOGA],
        level: 'Pro',
        isTrainer: true,
        hourlyRate: 45,
        rating: 5.0,
        reviewCount: 89,
        specialties: ['Vinyasa', 'Meditation', 'Rehab']
    },
    {
        id: 't3',
        name: 'Mike Ross',
        age: 35,
        bio: 'Professional Tennis Coach. Former ATP player ready to improve your serve and volley.',
        location: 'City Courts',
        avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&auto=format&fit=crop&q=60',
        interests: [SportType.TENNIS],
        level: 'Pro',
        isTrainer: true,
        hourlyRate: 80,
        rating: 4.8,
        reviewCount: 56,
        specialties: ['Serve Technique', 'Match Strategy']
    }
];

export const Trainers: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const isLight = theme === 'light';

    const [selectedSport, setSelectedSport] = useState<SportType | 'All'>('All');
    const [selectedTrainer, setSelectedTrainer] = useState<User | null>(null);
    const [bookingStep, setBookingStep] = useState<'date' | 'confirm'>('date');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [allTrainers, setAllTrainers] = useState<User[]>([]);

    // Load trainers from Supabase
    useEffect(() => {
        const loadTrainers = async () => {
            try {
                const data = await trainerService.getTrainers({
                    sport: selectedSport !== 'All' ? selectedSport : undefined
                });

                let trainers = data.length > 0 ? data : MOCK_TRAINERS;

                // Add current user if they're a trainer
                if (currentUser?.isTrainer) {
                    trainers = [currentUser, ...trainers.filter(t => t.id !== currentUser.id)];
                }

                setAllTrainers(trainers);
            } catch (e) {
                console.error('Error loading trainers:', e);
                setAllTrainers(MOCK_TRAINERS); // Fallback
            }
        };
        loadTrainers();
    }, [selectedSport, currentUser]);

    const filteredTrainers = selectedSport === 'All'
        ? allTrainers
        : allTrainers.filter(t => t.interests.includes(selectedSport));

    const handleBookClick = (trainer: User, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking book button

        // If user clicks book on themselves, go to dashboard
        if (currentUser && trainer.id === currentUser.id) {
            navigate(`/trainers/${trainer.id}`);
            return;
        }

        setSelectedTrainer(trainer);
        setBookingStep('date');
        setBookingDate('');
        setBookingTime('');
    };

    const handleTrainerClick = (trainer: User) => {
        navigate(`/trainers/${trainer.id}`, { state: { trainer } });
    };

    const handleConfirmBooking = async () => {
        if (selectedTrainer && currentUser) {
            hapticFeedback.success();

            // Save to Supabase
            try {
                await trainerService.bookSession({
                    trainerId: selectedTrainer.id,
                    userId: currentUser.id,
                    scheduledDate: bookingDate,
                    scheduledTime: bookingTime,
                    price: selectedTrainer.hourlyRate || 60,
                });
            } catch (e) {
                console.error('Error booking session:', e);
            }

            notificationService.showNotification("Session Booked!", {
                body: `Confirmed with ${selectedTrainer.name} for ${bookingDate} at ${bookingTime}`,
                icon: selectedTrainer.avatarUrl
            });
            setSelectedTrainer(null);
        }
    };

    return (
        <div className="min-h-full px-6 pt-10 pb-24 relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className={`text-3xl font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Trainers</h1>
                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Book professionals.</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
                    <Dumbbell size={20} />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 -mx-6 px-6">
                <GlassSelectable
                    selected={selectedSport === 'All'}
                    onClick={() => setSelectedSport('All')}
                    className="!px-4 !py-2 whitespace-nowrap"
                >
                    All Pros
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

            {/* Trainers List */}
            <div className="space-y-5">
                {filteredTrainers.map((trainer, index) => {
                    const isMe = currentUser?.id === trainer.id;
                    return (
                        <div
                            key={trainer.id}
                            onClick={() => handleTrainerClick(trainer)}
                            className={`relative group rounded-[32px] border overflow-hidden transition-all hover:scale-[1.01] cursor-pointer animate-slide-up ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {isMe && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.5)] z-10" />
                            )}

                            <div className="flex p-4 gap-4">
                                <div className="relative w-20 h-20 rounded-[24px] overflow-hidden flex-shrink-0">
                                    <img src={trainer.avatarUrl} className="w-full h-full object-cover" alt={trainer.name} />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm py-0.5 text-center">
                                        <div className="text-[10px] font-bold text-white flex items-center justify-center gap-1">
                                            <Star size={8} fill="currentColor" className="text-amber-400" /> {trainer.rating || 'New'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <h3 className={`font-bold text-lg leading-none mb-1 hover:text-neon-blue transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                    {isMe ? 'You (Pro Profile)' : trainer.name}
                                                </h3>
                                                {!isMe && <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity -ml-1 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />}
                                            </div>
                                            <div className={`text-xs flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                                <MapPin size={10} /> {trainer.location}
                                            </div>
                                        </div>
                                        <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                            ${trainer.hourlyRate}<span className="text-xs font-normal opacity-60">/hr</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {trainer.specialties?.map((s, i) => (
                                            <span key={i} className={`px-2 py-0.5 rounded-[12px] text-[10px] font-medium border ${isLight ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-white/5 text-white/60 border-white/5'}`}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 pb-4 pt-0`}>
                                <button
                                    onClick={(e) => handleBookClick(trainer, e)}
                                    className={`w-full py-3 rounded-[24px] text-sm font-bold transition-all active:scale-95 shadow-lg ${isMe ? 'bg-neon-blue text-black shadow-neon-blue/20' : (isLight ? 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800' : 'bg-white text-black shadow-white/20 hover:bg-gray-200')}`}
                                >
                                    {isMe ? 'Manage Dashboard' : 'Book Session'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Booking Modal (Inline quick book) */}
            {selectedTrainer && (
                <div className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center backdrop-blur-md p-0 sm:p-4 animate-fade-in ${isLight ? 'bg-slate-50/95' : 'bg-black/95'}`}>
                    <div className="absolute inset-0" onClick={() => setSelectedTrainer(null)} />
                    <GlassCard className={`w-full max-w-md p-6 relative animate-slide-up rounded-t-[32px] sm:rounded-[32px] ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b]'}`}>
                        <button onClick={() => setSelectedTrainer(null)} className={`absolute top-4 right-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`}><X size={20} /></button>

                        {bookingStep === 'date' ? (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <img src={selectedTrainer.avatarUrl} className="w-14 h-14 rounded-full object-cover" alt="" />
                                    <div>
                                        <div className={`text-xs uppercase tracking-wider font-bold opacity-50 ${isLight ? 'text-slate-900' : 'text-white'}`}>Booking with</div>
                                        <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedTrainer.name}</h3>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Select Date</label>
                                        <GlassInput type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className={isLight ? 'bg-slate-50 border-slate-200' : ''} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Select Time</label>
                                        <GlassInput type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className={isLight ? 'bg-slate-50 border-slate-200' : ''} />
                                    </div>
                                </div>

                                <GlassButton
                                    disabled={!bookingDate || !bookingTime}
                                    onClick={() => setBookingStep('confirm')}
                                    className="w-full"
                                >
                                    Continue
                                </GlassButton>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-4">
                                        <DollarSign size={32} />
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Payment</h3>
                                    <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Secure checkout</p>
                                </div>

                                <div className={`p-4 rounded-[24px] mb-6 space-y-3 ${isLight ? 'bg-slate-50' : 'bg-white/5'}`}>
                                    <div className="flex justify-between text-sm">
                                        <span className={isLight ? 'text-slate-500' : 'text-white/60'}>Session Rate</span>
                                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${selectedTrainer.hourlyRate}.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className={isLight ? 'text-slate-500' : 'text-white/60'}>Service Fee</span>
                                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>$2.50</span>
                                    </div>
                                    <div className={`h-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className={isLight ? 'text-slate-900' : 'text-white'}>Total</span>
                                        <span className={isLight ? 'text-slate-900' : 'text-white'}>${(selectedTrainer.hourlyRate || 0) + 2.50}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <GlassButton onClick={handleConfirmBooking} className="w-full bg-green-600 hover:bg-green-700 border-0 shadow-lg shadow-green-900/20">
                                        Pay & Book
                                    </GlassButton>
                                    <button onClick={() => setBookingStep('date')} className={`w-full py-3 text-xs font-bold ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                        Back
                                    </button>
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};