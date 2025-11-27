
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';

const FAQ_ITEMS = [
  {
    question: 'How does the matching algorithm work?',
    answer: 'Our AI analyzes your sports interests, skill levels, location, and availability to suggest the most compatible training partners. The more you use the app, the smarter it gets!'
  },
  {
    question: 'Is SportPulse free to use?',
    answer: 'Yes! SportPulse is free to download and use. We offer a Gold subscription that unlocks premium features like unlimited swipes, advanced filters, and the AI Coach.'
  },
  {
    question: 'How do I cancel my Gold subscription?',
    answer: 'You can manage your subscription in the Settings menu under the "Subscription" section. If you subscribed via Apple or Google Play, you will need to cancel through their respective store settings.'
  },
  {
    question: 'Can I change my location manually?',
    answer: 'Currently, SportPulse uses your device\'s GPS to find matches nearby. If you are traveling, the app will automatically update to your new location.'
  },
  {
    question: 'How do I report a user?',
    answer: 'Go to the user\'s profile, tap the three dots icon in the top right corner, and select "Report". Our safety team reviews all reports within 24 hours.'
  },
  {
    question: 'What are Clubs?',
    answer: 'Clubs are communities centered around specific sports or locations. You can join existing clubs to find group events or create your own if you are a verified Pro user.'
  }
];

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>FAQ</h1>
      </div>

      <div className="space-y-4 animate-slide-up">
        {FAQ_ITEMS.map((item, index) => (
          <GlassCard 
            key={index}
            className={`overflow-hidden transition-all duration-300 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}
          >
            <button 
              onClick={() => toggleItem(index)}
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.question}</span>
              {openIndex === index ? (
                <ChevronUp size={18} className={isLight ? 'text-slate-400' : 'text-white/40'} />
              ) : (
                <ChevronDown size={18} className={isLight ? 'text-slate-400' : 'text-white/40'} />
              )}
            </button>
            
            <div 
              className={`px-5 text-sm leading-relaxed transition-all duration-300 overflow-hidden ${openIndex === index ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className={isLight ? 'text-slate-600' : 'text-white/70'}>{item.answer}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Still have questions?</p>
        <button 
          onClick={() => navigate('/contact')}
          className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isLight ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};
