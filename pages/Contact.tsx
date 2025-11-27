
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { hapticFeedback } from '../services/hapticService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [subject, setSubject] = useState('Support');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    hapticFeedback.medium();

    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      hapticFeedback.success();
      notificationService.showNotification("Message Sent", { body: "We'll get back to you shortly." });
      navigate(-1);
    }, 1500);
  };

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
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Contact Us</h1>
      </div>

      <GlassCard className={`p-6 animate-slide-up ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* User Info (Read Only) */}
          <div className="space-y-1">
             <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>From</label>
             <div className={`p-3 rounded-xl text-sm font-medium border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/20 border-white/5 text-white/70'}`}>
                {user?.email || 'Guest User'}
             </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-1">
             <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Topic</label>
             <div className="relative">
                <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 appearance-none text-sm font-bold focus:outline-none focus:ring-1 transition-all cursor-pointer ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-black/20 border border-white/10 text-white'}`}
                >
                    <option value="Support">Technical Support</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="Feedback">Feedback & Suggestions</option>
                    <option value="Partnership">Partnership Inquiry</option>
                    <option value="Other">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
             </div>
          </div>

          {/* Message Input */}
          <div className="space-y-1">
             <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Message</label>
             <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`w-full h-40 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-black/20 border border-white/10 text-white placeholder-white/30'}`}
                placeholder="How can we help you today?"
                required
             />
          </div>

          <GlassButton 
            type="submit" 
            disabled={isSending || !message.trim()} 
            className="w-full h-14 shadow-lg shadow-blue-500/20"
          >
            {isSending ? 'Sending...' : (
                <span className="flex items-center gap-2">Send Message <Send size={18} /></span>
            )}
          </GlassButton>

        </form>
      </GlassCard>

      <div className={`mt-8 text-center text-xs leading-relaxed px-4 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
        Support ID: {user?.id || 'N/A'} <br/>
        v1.0.3 (Build 2024.11.15)
      </div>
    </div>
  );
};
