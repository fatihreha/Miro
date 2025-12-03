
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { ArrowLeft, Calendar, Clock, MapPin, ChevronRight, Video, CheckCircle2, XCircle, MessageCircle, Dumbbell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';

import { trainerService } from '../services/trainerService';
import { useAuth } from '../context/AuthContext';

export const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadBookings = async () => {
      const data = await trainerService.getUserBookings(user.id);
      const formatted = data.map(b => ({
        id: b.id,
        trainerId: b.trainer_id,
        trainerName: b.trainer?.user?.name || 'Trainer',
        trainerAvatar: b.trainer?.user?.avatar_url || '',
        service: b.service_type || b.trainer?.specialties?.[0] || 'Training Session',
        date: new Date(b.scheduled_date).toLocaleDateString(),
        fullDate: b.scheduled_date,
        time: b.scheduled_time,
        status: b.status,
        price: b.price,
        location: b.location || b.trainer?.location || 'Location',
        type: b.session_type || 'in-person'
      }));
      setBookings(formatted);
    };
    loadBookings();
  }, [user]);

  const filteredBookings = bookings.filter(b =>
    activeTab === 'upcoming'
      ? (b.status === 'confirmed' || b.status === 'pending')
      : (b.status === 'completed' || b.status === 'cancelled')
  );

  const handleCancelBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      hapticFeedback.medium();
      
      // Optimistic update
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      
      try {
        // Persist to database
        await trainerService.cancelBooking(id);
        notificationService.showNotification("Booking Cancelled", { body: "The trainer has been notified." });
      } catch (error) {
        // Rollback on error
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
        notificationService.showNotification("Error", { body: "Failed to cancel booking. Please try again." });
      }
    }
  };

  const handleMessageTrainer = (trainerId: string) => {
    hapticFeedback.light();
    navigate(`/chat/${trainerId}`);
  };

  return (
    <div className="min-h-full px-6 pt-6 pb-24 relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-3xl font-semibold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>My Sessions</h1>
          <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Manage your training schedule.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl mb-6 backdrop-blur-md border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/10 border-white/10'}`}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upcoming' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white text-black shadow-md') : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/60 hover:text-white')}`}
        >
          History
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, index) => (
            <GlassCard
              key={booking.id}
              className={`p-0 overflow-hidden animate-slide-up ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={booking.trainerAvatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div>
                      <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{booking.service}</h3>
                      <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'}`}>with {booking.trainerName}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${booking.status === 'confirmed'
                    ? 'bg-green-500/20 text-green-500 border-green-500/20'
                    : booking.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/20'
                      : 'bg-red-500/20 text-red-500 border-red-500/20'
                    }`}>
                    {booking.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/5 text-white/80'}`}>
                    <Calendar size={14} className="text-neon-blue" /> {booking.date}
                  </div>
                  <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/5 text-white/80'}`}>
                    <Clock size={14} className="text-neon-blue" /> {booking.time}
                  </div>
                  <div className={`col-span-2 flex items-center gap-2 text-xs p-2 rounded-lg ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/5 text-white/80'}`}>
                    {booking.type === 'online' ? <Video size={14} className="text-neon-blue" /> : <MapPin size={14} className="text-neon-blue" />}
                    {booking.location}
                  </div>
                </div>

                {activeTab === 'upcoming' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleMessageTrainer(booking.trainerId)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/10 text-white hover:bg-white/5'}`}
                    >
                      <MessageCircle size={14} /> Message
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${isLight ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-red-500/20 text-red-400 hover:bg-red-500/10'}`}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                )}

                {activeTab === 'history' && booking.status === 'completed' && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/trainers/${booking.trainerId}`)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-white/10 text-white hover:bg-white/5'}`}
                    >
                      <Dumbbell size={14} /> Book Again
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-12 flex flex-col items-center animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-white/20'}`}>
              <Calendar size={32} />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>No Sessions</h3>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>You don't have any {activeTab} bookings.</p>
            {activeTab === 'upcoming' && (
              <GlassButton onClick={() => navigate('/trainers')} className="mt-6 px-8 !h-10 text-xs">
                Find a Trainer
              </GlassButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
