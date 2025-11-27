
import React, { useState } from 'react';
import { GlassCard, GlassButton } from '../ui/Glass';
import { X, ShieldCheck, Camera, CreditCard, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { hapticFeedback } from '../../services/hapticService';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Identity Verification",
  description = "To host events or create clubs, we need to verify your identity to keep our community safe."
}) => {
  const { theme } = useTheme();
  const { updateUser } = useAuth();
  const isLight = theme === 'light';
  
  const [step, setStep] = useState<'intro' | 'selfie' | 'id' | 'processing' | 'success'>('intro');
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      hapticFeedback.success();
      const fileName = e.target.files[0].name;
      if (type === 'selfie') setSelfieFile(fileName);
      else setIdFile(fileName);
    }
  };

  const handleNext = () => {
    hapticFeedback.light();
    if (step === 'intro') setStep('selfie');
    else if (step === 'selfie') setStep('id');
    else if (step === 'id') handleSubmit();
  };

  const handleSubmit = async () => {
    setStep('processing');
    hapticFeedback.medium();

    // Simulate API verification process
    setTimeout(async () => {
        await updateUser({ verificationStatus: 'verified' });
        setStep('success');
        hapticFeedback.success();
        notificationService.showNotification("Identity Verified", { body: "You can now create events and clubs!" });
        
        setTimeout(() => {
            onSuccess();
            onClose();
            // Reset state after closing
            setTimeout(() => {
                setStep('intro');
                setSelfieFile(null);
                setIdFile(null);
            }, 500);
        }, 1500);
    }, 2500);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
      <div className="absolute inset-0" onClick={onClose} />

      <GlassCard className={`w-full max-w-sm relative z-10 animate-slide-up p-0 overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
        
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg leading-none mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Verified Host</h3>
                        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Step {step === 'intro' ? 1 : step === 'selfie' ? 2 : step === 'id' ? 3 : 4} of 3</p>
                    </div>
                </div>
                <button onClick={onClose} className={`p-2 rounded-full ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-white/40'}`}>
                    <X size={20} />
                </button>
            </div>

            {/* Content Based on Step */}
            {step === 'intro' && (
                <div className="animate-fade-in">
                    <h4 className={`font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h4>
                    <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        {description}
                    </p>
                    <ul className="space-y-3 mb-8">
                        <li className={`flex items-center gap-3 text-sm ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <CheckCircle2 size={16} className="text-green-500" /> Take a selfie
                        </li>
                        <li className={`flex items-center gap-3 text-sm ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <CheckCircle2 size={16} className="text-green-500" /> Upload Government ID
                        </li>
                        <li className={`flex items-center gap-3 text-sm ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                            <CheckCircle2 size={16} className="text-green-500" /> Instant Review
                        </li>
                    </ul>
                    <GlassButton onClick={handleNext} className="w-full">Start Verification</GlassButton>
                </div>
            )}

            {step === 'selfie' && (
                <div className="animate-slide-up">
                    <h4 className={`font-bold mb-4 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>Take a Selfie</h4>
                    
                    <div className={`border-2 border-dashed rounded-2xl p-8 mb-6 flex flex-col items-center justify-center transition-all ${selfieFile ? 'border-green-500/50 bg-green-500/5' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5')}`}>
                        <input type="file" id="selfie-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'selfie')} />
                        <label htmlFor="selfie-upload" className="cursor-pointer flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${selfieFile ? 'bg-green-500 text-white' : (isLight ? 'bg-white text-slate-400 shadow-sm' : 'bg-white/10 text-white/40')}`}>
                                {selfieFile ? <CheckCircle2 size={32} /> : <Camera size={32} />}
                            </div>
                            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selfieFile ? 'Selfie Uploaded' : 'Tap to Upload'}</div>
                        </label>
                    </div>

                    <GlassButton onClick={handleNext} disabled={!selfieFile} className="w-full">Next Step</GlassButton>
                </div>
            )}

            {step === 'id' && (
                <div className="animate-slide-up">
                    <h4 className={`font-bold mb-4 text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>Upload ID</h4>
                    
                    <div className={`border-2 border-dashed rounded-2xl p-8 mb-6 flex flex-col items-center justify-center transition-all ${idFile ? 'border-green-500/50 bg-green-500/5' : (isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5')}`}>
                        <input type="file" id="id-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'id')} />
                        <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${idFile ? 'bg-green-500 text-white' : (isLight ? 'bg-white text-slate-400 shadow-sm' : 'bg-white/10 text-white/40')}`}>
                                {idFile ? <CheckCircle2 size={32} /> : <CreditCard size={32} />}
                            </div>
                            <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{idFile ? 'ID Uploaded' : 'Tap to Upload'}</div>
                        </label>
                    </div>

                    <GlassButton onClick={handleNext} disabled={!idFile} className="w-full">Submit for Review</GlassButton>
                </div>
            )}

            {step === 'processing' && (
                <div className="py-8 flex flex-col items-center text-center animate-fade-in">
                    <Loader2 size={48} className={`animate-spin mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`} />
                    <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Verifying...</h3>
                    <p className={`text-sm mt-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Analyzing biometric data.</p>
                </div>
            )}

            {step === 'success' && (
                <div className="py-8 flex flex-col items-center text-center animate-pop">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-green-500/30">
                        <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
                    </div>
                    <h3 className={`font-bold text-xl ${isLight ? 'text-slate-900' : 'text-white'}`}>You are Verified!</h3>
                    <p className={`text-sm mt-2 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>You can now create events and clubs.</p>
                </div>
            )}
        </div>
      </GlassCard>
    </div>
  );
};
