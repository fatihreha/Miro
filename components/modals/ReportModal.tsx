
import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { GlassCard, GlassButton } from '../ui/Glass';
import { ReportReason } from '../../types';
import { reportService } from '../../services/reportService';
import { useTheme } from '../../context/ThemeContext';
import { hapticFeedback } from '../../services/hapticService';
import { notificationService } from '../../services/notificationService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  reportedUserId, 
  reportedUserName,
  reporterId
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    hapticFeedback.medium();

    try {
      await reportService.submitReport(reporterId, reportedUserId, selectedReason, details);
      setIsSuccess(true);
      hapticFeedback.success();
      notificationService.showNotification("Report Received", {
        body: "Thank you for keeping our community safe."
      });
      
      // Close after showing success state briefly
      setTimeout(() => {
        onClose();
        // Reset state
        setIsSuccess(false);
        setSelectedReason(null);
        setDetails('');
        setIsSubmitting(false);
      }, 2000);
      
    } catch (error) {
      console.error("Report failed", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <GlassCard className={`w-full max-w-sm relative z-10 animate-slide-up p-0 overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${isLight ? 'bg-red-50 border-red-100' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-500" />
            <h3 className={`font-bold ${isLight ? 'text-red-900' : 'text-red-200'}`}>Report User</h3>
          </div>
          <button onClick={onClose} className={`opacity-60 hover:opacity-100 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center animate-pop">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
              <Check size={32} className="text-white" strokeWidth={3} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Thanks for reporting</h3>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              We will review this report and take appropriate action against {reportedUserName}.
            </p>
          </div>
        ) : (
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <p className={`text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              Why are you reporting <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{reportedUserName}</span>? This is anonymous.
            </p>

            {/* Reasons List */}
            <div className="space-y-2 mb-6">
              {Object.values(ReportReason).map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                    selectedReason === reason
                      ? (isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/20 border-red-500/50 text-red-200')
                      : (isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10')
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Optional Details */}
            <div className="mb-6">
              <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Additional Details (Optional)</label>
              <textarea 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className={`w-full rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-black/20 border border-white/10 text-white'}`}
                rows={3}
                placeholder="Please provide more context..."
              />
            </div>

            <GlassButton 
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              variant="danger"
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
