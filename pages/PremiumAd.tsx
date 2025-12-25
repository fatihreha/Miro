import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { X, Crown, Sparkles, Infinity, Bot, Eye, Rocket, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../services/hapticService';
import { useTheme } from '../context/ThemeContext';

export const PremiumAd: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    hapticFeedback.medium();
    navigate(-1);
  };

  const handleUpgrade = async () => {
    hapticFeedback.success();
    navigate('/premium');
  };

  const benefits = [
    { icon: Infinity, title: 'Sınırsız Eşleşme', desc: 'Günlük limit yok.' },
    { icon: Bot, title: 'AI Kişisel Antrenör', desc: '7/24 Performans Koçunuz.' },
    { icon: Crown, title: 'Kulüp Oluştur', desc: 'Kendi spor topluluğunuzu kurun.' },
    { icon: Rocket, title: 'Aylık Boost', desc: 'Bölgenizdeki en çok görülen profil olun.' },
    { icon: Eye, title: 'Seni Beğenenleri Gör', desc: 'Hayranlarınızı anında keşfedin.' }
  ];

  return (
    <div className="h-full w-full relative overflow-y-auto no-scrollbar font-sans bg-black">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-b from-slate-100 via-white to-white' : 'bg-[#000000]'}`} />
         <div className={`absolute top-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-blue-300/30' : 'bg-brand-indigo/30'}`} />
         <div className={`absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-lime-200/30' : 'bg-brand-lime/20'}`} style={{ animationDelay: '2s' }} />
         <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="relative z-10 px-6 py-8 pb-32 max-w-lg mx-auto flex flex-col min-h-full">
        
        {/* Close Button */}
        <div className="flex justify-end mb-4">
            <button 
            onClick={handleClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border ${isLight ? 'bg-white/50 border-slate-200 text-slate-500 hover:bg-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
            <X size={20} />
            </button>
        </div>

        {/* Header Brand */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="relative inline-block mb-6">
             {/* Glow */}
             <div className={`absolute inset-0 blur-3xl opacity-60 rounded-full animate-pulse-slow ${isLight ? 'bg-slate-400' : 'bg-brand-lime/40'}`}></div>
             {/* Squircle - Black Glass */}
             <div className={`relative w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 border border-white/10 ${isLight ? 'bg-slate-900' : 'bg-black/80 backdrop-blur-xl'}`}>
                <Crown size={48} className="text-brand-lime drop-shadow-[0_0_15px_rgba(222,255,144,0.6)]" strokeWidth={1.5} />
             </div>
             {/* PRO Badge */}
             <div className="absolute -top-3 -right-3 bg-brand-lime text-black font-display font-bold text-xs px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(222,255,144,0.5)] animate-pop rotate-12 border-2 border-black">
                 PRO
             </div>
          </div>
          
          <h1 className={`text-4xl font-display font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            bind <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-emerald-400">Pro</span>
          </h1>
          <p className={`text-lg font-light ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            En iyi deneyimi aç.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 gap-3 mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {benefits.map((item, idx) => (
                <GlassCard 
                    key={idx} 
                    className={`p-4 flex items-center gap-4 border-0 ${isLight ? 'bg-white/70 shadow-sm border border-slate-200' : 'bg-white/5'}`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-brand-lime/20 text-brand-lime'}`}>
                        <item.icon size={20} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{item.desc}</p>
                    </div>
                </GlassCard>
            ))}
        </div>

        {/* Offer Showcase */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className={`
                relative rounded-[24px] border transition-all duration-300 overflow-hidden mb-8
                border-brand-lime bg-brand-lime/10 shadow-[0_0_30px_rgba(222,255,144,0.1)] scale-[1.02]
            `}>
                <div className="absolute top-0 right-0 bg-brand-lime text-black text-[9px] font-bold px-3 py-1.5 rounded-bl-xl shadow-lg z-10">
                    7 GÜN ÜCRETSİZ
                </div>

                <div className="p-5 flex justify-between items-center relative z-0">
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                            border-brand-lime bg-brand-lime text-black
                        `}>
                            <Check size={14} strokeWidth={4} />
                        </div>
                        <div>
                            <div className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Yıllık Pro</div>
                            <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                                Yıllık ödeme (₺1,199)
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            ₺99
                        </div>
                        <div className="text-[10px] font-bold text-brand-lime opacity-80">
                            / ay
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto space-y-4 animate-fade-in">
            <GlassButton 
                onClick={handleUpgrade}
                disabled={isProcessing}
                className={`
                    w-full h-16 text-lg font-bold shadow-[0_0_30px_rgba(222,255,144,0.3)] transition-all
                    bg-brand-lime border-0 text-black hover:bg-[#caff70] hover:scale-[1.01] active:scale-[0.98]
                `}
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2"><Sparkles className="animate-spin" /> Etkinleştiriliyor...</span>
                ) : (
                    'Ücretsiz Dene'
                )}
            </GlassButton>

            <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-widest text-white/30">
                <button onClick={() => navigate('/premium')} className="hover:text-white transition">Tüm Planlar</button>
            </div>
        </div>

      </div>
    </div>
  );
};
