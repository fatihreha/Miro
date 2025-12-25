
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Search, Zap, Shield, Users, Crown, MapPin, Trophy } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQCategory {
  title: string;
  icon: any;
  items: FAQItem[];
}

// Fallback FAQ items (used if DB is empty or fails)
const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does the matching algorithm work?',
    answer: 'Our AI analyzes your sports interests, skill levels, location, and availability to suggest the most compatible training partners. The more you use the app, the smarter it gets!',
    category: 'Basics'
  },
  {
    question: 'Is bind free to use?',
    answer: 'Yes! bind is free to download and use. We offer a Pro subscription that unlocks premium features like unlimited swipes, advanced filters, and the AI Coach.',
    category: 'Basics'
  },
  {
    question: 'How do I cancel my Gold subscription?',
    answer: 'You can manage your subscription in the Settings menu under the "Subscription" section. If you subscribed via Apple or Google Play, you will need to cancel through their respective store settings.',
    category: 'Pro'
  },
  {
    question: 'Can I change my location manually?',
    answer: 'Currently, bind uses your device\'s GPS to find matches nearby. If you are traveling, the app will automatically update to your new location.',
    category: 'Privacy'
  },
  {
    question: 'How do I report a user?',
    answer: 'Go to the user\'s profile, tap the three dots icon in the top right corner, and select "Report". Our safety team reviews all reports within 24 hours.',
    category: 'Safety'
  },
  {
    question: 'What are Clubs?',
    answer: 'Clubs are communities centered around specific sports or locations. You can join existing clubs to find group events or create your own if you are a verified Pro user.',
    category: 'Clubs'
  },
  {
    question: 'How do I earn XP?',
    answer: 'You earn XP by completing activities like matching with users, attending events, joining clubs, and staying active. XP helps you level up and unlock rewards.',
    category: 'Gamification'
  },
  {
    question: 'What happens if I miss a booked session?',
    answer: 'Missing a booked session may affect your reliability score. Pro trainers may have specific cancellation policies listed on their profiles.',
    category: 'Pro'
  },
  {
    question: 'Is my personal data secure?',
    answer: 'Yes. We use industry-standard encryption and comply with GDPR and KVKK regulations. You can review our full privacy policy in Settings.',
    category: 'Privacy'
  },
  {
    question: 'How do I verify my Pro account?',
    answer: 'Go to Settings → Become Pro and submit your certifications or proof of training experience. Our team reviews applications within 48 hours.',
    category: 'Pro'
  }
];

const CATEGORY_CONFIG: { [key: string]: { icon: any; title: string } } = {
  'Basics': { icon: Zap, title: 'Getting Started' },
  'Safety': { icon: Shield, title: 'Safety & Privacy' },
  'Clubs': { icon: Users, title: 'Clubs & Events' },
  'Pro': { icon: Crown, title: 'Pro Features' },
  'Privacy': { icon: MapPin, title: 'Location & Privacy' },
  'Gamification': { icon: Trophy, title: 'Rewards & XP' }
};

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqItems, setFaqItems] = useState<FAQItem[]>(DEFAULT_FAQ_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  // Load FAQ from database
  useEffect(() => {
    const loadFAQ = async () => {
      try {
        const { data, error } = await supabase
          .from('faq_items')
          .select('question, answer, category')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (data && data.length > 0 && !error) {
          setFaqItems(data as FAQItem[]);
        }
        // If no data or error, keep default items
      } catch (e) {
        console.error('Error loading FAQ:', e);
        // Keep default items on error
      }
    };
    loadFAQ();
  }, []);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Filter FAQs by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;
    const query = searchQuery.toLowerCase();
    return faqItems.filter(
      item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [faqItems, searchQuery]);

  // Group filtered FAQs by category
  const categorizedFAQs = useMemo(() => {
    const categories: FAQCategory[] = [];
    const categoryMap = new Map<string, FAQItem[]>();

    filteredItems.forEach(item => {
      const cat = item.category || 'Basics';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(item);
    });

    // Sort categories by predefined order
    const order = ['Basics', 'Safety', 'Clubs', 'Pro', 'Privacy', 'Gamification'];
    order.forEach(catKey => {
      if (categoryMap.has(catKey)) {
        const config = CATEGORY_CONFIG[catKey];
        categories.push({
          title: config.title,
          icon: config.icon,
          items: categoryMap.get(catKey)!
        });
      }
    });

    // Add any remaining categories not in order
    categoryMap.forEach((items, catKey) => {
      if (!order.includes(catKey)) {
        categories.push({
          title: catKey,
          icon: Zap,
          items
        });
      }
    });

    return categories;
  }, [filteredItems]);

  return (
    <div className="min-h-full px-6 pt-6 pb-20 relative">
      {/* Liquid Atmosphere Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-transparent blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-transparent blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/4 left-1/3 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-green-500/30 via-emerald-500/30 to-transparent blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md ${isLight ? 'bg-white/40 border border-slate-200 text-slate-600 hover:bg-white' : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
        >
           <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>FAQ</h1>
      </div>

      {/* Search Input */}
      <div className="mb-6 relative z-10">
        <div className="relative">
          <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className={`w-full pl-12 pr-4 py-3 rounded-xl border backdrop-blur-md text-sm transition-all ${isLight ? 'bg-white/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10'}`}
          />
        </div>
      </div>

      {/* Categorized FAQs */}
      <div className="space-y-6 animate-slide-up relative z-10">
        {categorizedFAQs.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              No FAQs found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          categorizedFAQs.map((category, catIndex) => {
            const IconComponent = category.icon;
            return (
              <div key={catIndex} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}>
                    <IconComponent size={16} className={isLight ? 'text-slate-600' : 'text-white/70'} />
                  </div>
                  <h2 className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                    {category.title}
                  </h2>
                </div>

                {/* Category Items */}
                {category.items.map((item, itemIndex) => {
                  const globalIndex = catIndex * 100 + itemIndex;
                  return (
                    <GlassCard 
                      key={globalIndex}
                      className={`overflow-hidden transition-all duration-300 ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}
                    >
                      <button 
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full p-5 flex items-center justify-between text-left"
                      >
                        <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.question}</span>
                        {openIndex === globalIndex ? (
                          <ChevronUp size={18} className={isLight ? 'text-slate-400' : 'text-white/40'} />
                        ) : (
                          <ChevronDown size={18} className={isLight ? 'text-slate-400' : 'text-white/40'} />
                        )}
                      </button>
                      
                      <div 
                        className={`px-5 text-sm leading-relaxed transition-all duration-300 overflow-hidden ${openIndex === globalIndex ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <p className={isLight ? 'text-slate-600' : 'text-white/70'}>{item.answer}</p>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-8 text-center relative z-10">
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
