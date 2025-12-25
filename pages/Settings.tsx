
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton, GlassInput, GlassSelectable } from '../components/ui/Glass';
import { ArrowLeft, Bell, LogOut, Shield, Globe, ChevronRight, Moon, Sun, Check, Wallet, Building2, User, Receipt, HelpCircle, MessageSquare, Star, Gem, History, ArrowUpRight, X, Clock, Smartphone, Watch, Layout, Activity, Heart, Bluetooth, Download, Loader2, EyeOff, Ghost, Trash2, FileText, Lock, AlertTriangle, ArrowUpCircle, Crown, LayoutGrid, Zap, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { useTheme, LANGUAGES, Language } from '../context/ThemeContext';
import { ProFinanceSettings } from '../types';
import { hapticFeedback } from '../services/hapticService';
import { subscriptionService } from '../services/subscriptionService';
import { supabase } from '../services/supabase';
import { userService } from '../services/userService';

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={onChange}
      className={`
        w-12 h-7 rounded-full p-1 transition-all duration-300 flex items-center border flex-shrink-0
        ${checked
          ? (isLight ? 'bg-slate-900 border-slate-900' : 'bg-white border-white')
          : (isLight ? 'bg-slate-200 border-slate-200' : 'bg-white/10 border-white/10')}
      `}
    >
      <div className={`
        w-4 h-4 rounded-full shadow-md transition-all duration-300 
        ${checked
          ? (isLight ? 'bg-white translate-x-[20px]' : 'bg-black translate-x-[20px]')
          : (isLight ? 'bg-white translate-x-0' : 'bg-white/50 translate-x-0')}
      `} />
    </button>
  );
};

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useTheme();
  const [notifications, setNotifications] = useState(false);

  const [showLangModal, setShowLangModal] = useState(false);

  // Privacy & Safety States
  const [incognito, setIncognito] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [showManageSubModal, setShowManageSubModal] = useState(false);
  const [selectedWidgetStyle, setSelectedWidgetStyle] = useState<'daily' | 'stats' | 'lockin'>('daily');

  // Integrations State
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [widgetActive, setWidgetActive] = useState(false);
  const [watchStatus, setWatchStatus] = useState<'disconnected' | 'searching' | 'connected'>('disconnected');

  // Finance Settings Modal State
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeTab, setFinanceTab] = useState<'bank' | 'billing'>('bank');
  const [financeData, setFinanceData] = useState<ProFinanceSettings>({
    bankName: '',
    iban: '',
    accountHolder: '',
    billingType: 'individual',
    taxId: '',
    companyName: '',
    taxOffice: '',
    billingAddress: '',
    payoutFrequency: 'monthly',
    ...(user?.proFinance || {})
  });

  const isLight = theme === 'light';

  useEffect(() => {
    setNotifications(notificationService.getPermissionStatus() === 'granted');

    // Load privacy settings from database
    if (user?.id) {
      loadPrivacySettings();
    }
  }, [user?.id]);

  useEffect(() => {
    // Setup realtime subscription for privacy settings
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-settings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Privacy settings updated:', payload);

          // Update local state with realtime changes
          if (payload.new) {
            const newData = payload.new as any;
            if (newData.incognito_mode !== undefined) {
              setIncognito(newData.incognito_mode);
            }
            if (newData.ghost_mode !== undefined) {
              setGhostMode(newData.ghost_mode);
            }
            if (newData.widget_style !== undefined) {
              setSelectedWidgetStyle(newData.widget_style);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadPrivacySettings = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('incognito_mode, ghost_mode, widget_style')
        .eq('id', user.id)
        .single();

      if (data) {
        setIncognito(data.incognito_mode || false);
        setGhostMode(data.ghost_mode || false);
        setSelectedWidgetStyle(data.widget_style || 'daily');
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notifications) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setNotifications(true);
        notificationService.showNotification("Notifications Active", { body: "You'll now receive updates about new matches." });
      }
    } else {
      setNotifications(false);
    }
  };

  const handleIncognitoToggle = async () => {
    const newValue = !incognito;
    setIncognito(newValue);
    hapticFeedback.medium();

    // Save to database
    if (user?.id) {
      try {
        await supabase
          .from('users')
          .update({ incognito_mode: newValue })
          .eq('id', user.id);

        updateUser({ incognitoMode: newValue });
        notificationService.showNotification(
          "Incognito Mode",
          { body: newValue ? "Hidden from discovery feed." : "Visible in discovery feed." }
        );
      } catch (error) {
        console.error('Error saving incognito mode:', error);
        setIncognito(!newValue); // Revert on error
      }
    }
  };

  const handleGhostModeToggle = async () => {
    const newValue = !ghostMode;
    setGhostMode(newValue);
    hapticFeedback.medium();

    // Save to database
    if (user?.id) {
      try {
        await supabase
          .from('users')
          .update({ ghost_mode: newValue })
          .eq('id', user.id);

        updateUser({ ghostMode: newValue });
        notificationService.showNotification(
          "Ghost Mode",
          { body: newValue ? "Location hidden on map." : "Location visible on map." }
        );
      } catch (error) {
        console.error('Error saving ghost mode:', error);
        setGhostMode(!newValue); // Revert on error
      }
    }
  };

  const handleDownloadData = async () => {
    hapticFeedback.medium();

    if (user?.id) {
      try {
        // Request data export
        await supabase
          .from('data_requests')
          .insert({
            user_id: user.id,
            request_type: 'export',
            status: 'pending',
            created_at: new Date().toISOString()
          });

        notificationService.showNotification(
          "Preparing Data",
          { body: "We'll email your archive within 24 hours." }
        );
      } catch (error) {
        console.error('Error requesting data:', error);
        notificationService.showNotification("Error", { body: "Failed to request data. Try again." });
      }
    }
  };

  const handleDeleteAccount = async () => {
    hapticFeedback.heavy();

    const confirmed = confirm(
      "⚠️ DELETE ACCOUNT\n\n" +
      "This will permanently delete:\n" +
      "• Your profile and photos\n" +
      "• All matches and messages\n" +
      "• Workout history and stats\n" +
      "• Premium subscription\n\n" +
      "This action CANNOT be undone.\n\n" +
      "Type 'DELETE' to confirm."
    );

    if (confirmed) {
      const verification = prompt("Type 'DELETE' to permanently delete your account:");

      if (verification === 'DELETE') {
        try {
          // Mark account for deletion (actual deletion handled by backend)
          await supabase
            .from('users')
            .update({
              deleted_at: new Date().toISOString(),
              is_deleted: true
            })
            .eq('id', user?.id);

          hapticFeedback.success();
          notificationService.showNotification("Account Deleted", { body: "Your data will be removed within 30 days." });

          setTimeout(() => {
            logout();
            navigate('/welcome');
          }, 2000);
        } catch (error) {
          console.error('Error deleting account:', error);
          notificationService.showNotification("Error", { body: "Failed to delete account. Contact support." });
        }
      }
    }
  };

  const handleSaveFinance = async () => {
    hapticFeedback.success();
    updateUser({ proFinance: financeData });
    setShowFinanceModal(false);
    notificationService.showNotification("Finance Details Saved", { body: "Your payout information has been updated." });

    // Persist to database
    if (user) {
      try {
        await supabase
          .from('users')
          .update({
            pro_finance: financeData
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving finance data:', error);
      }
    }
  };

  const handleRestore = async () => {
    if (!user?.id) return;
    hapticFeedback.medium();
    const { restored } = await subscriptionService.restorePurchases(user.id);
    if (restored) {
      updateUser({ isPremium: true });
      notificationService.showNotification("Purchases Restored", { body: "Welcome back!" });
    } else {
      notificationService.showNotification("No Purchases", { body: "No previous subscription found." });
    }
  };

  const handleActivateWidget = () => {
    hapticFeedback.medium();
    setTimeout(() => {
      setWidgetActive(true);
      setShowWidgetModal(false);
      hapticFeedback.success();
      notificationService.showNotification("Widget Added", { body: "Add the bind widget from your home screen." });
    }, 1500);
  };

  const handleConnectWatch = () => {
    hapticFeedback.medium();
    setWatchStatus('searching');
    setTimeout(() => {
      setWatchStatus('connected');
      hapticFeedback.success();
      notificationService.showNotification("Apple Watch Paired", { body: "Heart rate sync is now active." });
    }, 3000);
  };

  // Widget Designs Array
  const widgetDesigns = [
    {
      id: 'daily' as const,
      name: 'Daily Picks',
      description: 'See your top matches',
      preview: (
        <div className="w-36 h-36 rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-700 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="text-2xl font-black text-white">3 New</div>
            <div className="text-[10px] text-white/70">Matches</div>
          </div>
        </div>
      )
    },
    {
      id: 'stats' as const,
      name: 'Power Stats',
      description: 'Track your progress',
      preview: (
        <div className="w-36 h-36 rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-4 flex flex-col justify-between shadow-2xl">
          <div className="text-white">
            <div className="text-sm font-bold opacity-70">Level 12</div>
            <div className="text-3xl font-black">840 XP</div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-3/4 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      id: 'lockin' as const,
      name: 'Lock-In HUD',
      description: 'Minimal streak view',
      preview: (
        <div className="w-36 h-36 rounded-[24px] bg-gradient-to-br from-red-500 to-orange-600 p-4 flex flex-col justify-center items-center shadow-2xl">
          <div className="text-white text-center">
            <div className="text-5xl font-black">7</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">Day Streak</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-full pb-20 relative">
      {/* Header */}
      <div className={`sticky top-0 z-20 p-6 backdrop-blur-xl border-b flex items-center gap-4 transition-colors ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/80 border-white/5'}`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' : 'bg-white/5 hover:bg-white/10 text-white'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold font-display">{t('settings_title')}</h1>
      </div>

      <div className="p-6 space-y-8 animate-fade-in">

        {/* Pro Section (Only for Trainers) */}
        {user?.isTrainer && (
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Pro Settings</h3>
            <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
              <button
                onClick={() => setShowFinanceModal(true)}
                className={`w-full p-4 flex items-center justify-between transition text-left group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/30">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Wallet</div>
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Payouts, Billing & History</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.proFinance?.iban ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1">
                      <Check size={10} strokeWidth={3} /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-1 rounded-md">
                      Setup
                    </span>
                  )}
                  <ChevronRight size={16} className="opacity-30" />
                </div>
              </button>
            </GlassCard>
          </section>
        )}

        {/* Subscription Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('subscription')}</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            {user?.isPremium ? (
              <button
                onClick={() => setShowManageSubModal(true)}
                className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Star size={16} fill="currentColor" />
                  </div>
                  <div>
                    <span className={`font-medium block ${isLight ? 'text-slate-900' : 'text-white'}`}>Gold Member</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Active until Dec 2025</span>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-30" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/premium')}
                className={`w-full p-4 flex items-center justify-between transition text-left group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Gem size={16} />
                  </div>
                  <div>
                    <span className={`font-medium block ${isLight ? 'text-slate-900' : 'text-white'}`}>Get Gold</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Unlock unlimited access</span>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-30" />
              </button>
            )}
            <button
              onClick={handleRestore}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-white/40'}`}>
                  <History size={16} />
                </div>
                <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-white/90'}`}>{t('restore_purchases')}</span>
              </div>
            </button>
          </GlassCard>
        </section>

        {/* Integrations Section (NEW) */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Integrations</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            {/* Widget Item */}
            <button
              onClick={() => setShowWidgetModal(true)}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Layout size={16} />
                </div>
                <div>
                  <span className={`font-medium block ${isLight ? 'text-slate-900' : 'text-white'}`}>Home Widgets</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Daily matches on home screen</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {widgetActive ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-1 rounded">Active</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Setup</span>
                )}
                <ChevronRight size={16} className="opacity-30" />
              </div>
            </button>

            {/* Apple Watch Item */}
            <button
              onClick={() => setShowWatchModal(true)}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Watch size={16} />
                </div>
                <div>
                  <span className={`font-medium block ${isLight ? 'text-slate-900' : 'text-white'}`}>Apple Watch</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Heart rate & activity sync</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {watchStatus === 'connected' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-1">
                    <Bluetooth size={10} /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Pair</span>
                )}
                <ChevronRight size={16} className="opacity-30" />
              </div>
            </button>
          </GlassCard>
        </section>

        {/* Appearance & Language Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('preferences')}</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            {/* Theme Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-amber-400/20 text-amber-600'}`}>
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="font-medium">{t('app_theme')}</span>
              </div>

              {/* Custom Glass Switch for Theme */}
              <div className={`flex rounded-full p-1 border relative flex-shrink-0 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Moon size={14} fill={theme === 'dark' ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-white/40 hover:text-white'}`}
                >
                  <Sun size={14} fill={theme === 'light' ? "currentColor" : "none"} />
                </button>

                {/* Active Indicator */}
                <div className={`absolute top-1 w-8 h-8 rounded-full shadow-md transition-all duration-300 ${theme === 'light' ? 'left-[calc(100%-36px)] bg-white' : 'left-1 bg-white/20'}`} />
              </div>
            </div>

            {/* Language Selector */}
            <button
              onClick={() => setShowLangModal(true)}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                  <Globe size={16} />
                </div>
                <span className="font-medium">{t('language')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isLight ? 'text-slate-400' : 'text-white/60'}`}>{LANGUAGES[language].label}</span>
                <span className="text-lg leading-none">{LANGUAGES[language].flag}</span>
                <ChevronRight size={16} className="opacity-30" />
              </div>
            </button>
          </GlassCard>
        </section>

        {/* Notifications Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('notifications_title')}</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-600">
                  <Bell size={16} />
                </div>
                <span className="font-medium">{t('push_notifications')}</span>
              </div>
              <Toggle checked={notifications} onChange={handleNotificationToggle} />
            </div>
          </GlassCard>
        </section>

        {/* Privacy & Safety Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Privacy & Safety</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                  <EyeOff size={16} />
                </div>
                <div>
                  <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Incognito Mode</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Hide profile from discovery</div>
                </div>
              </div>
              <Toggle checked={incognito} onChange={handleIncognitoToggle} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Ghost size={16} />
                </div>
                <div>
                  <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Ghost Mode</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Hide location on map</div>
                </div>
              </div>
              <Toggle checked={ghostMode} onChange={handleGhostModeToggle} />
            </div>
            <button
              onClick={() => navigate('/blocked-users')}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Lock size={16} />
                </div>
                <span className="font-medium">Blocked Users</span>
              </div>
              <ChevronRight size={16} className="opacity-30" />
            </button>
          </GlassCard>
        </section>

        {/* Support Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('support')}</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            <button
              onClick={() => navigate('/faq')}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <HelpCircle size={16} />
                </div>
                <span className="font-medium">{t('faq')}</span>
              </div>
              <ChevronRight size={16} className="opacity-30" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                  <MessageSquare size={16} />
                </div>
                <span className="font-medium">{t('contact_us')}</span>
              </div>
              <ChevronRight size={16} className="opacity-30" />
            </button>
          </GlassCard>
        </section>

        {/* Legal Section */}
        <section>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>{t('legal_account')}</h3>
          <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
            <button
              onClick={() => navigate('/privacy')}
              className={`w-full p-4 flex items-center justify-between transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Shield size={16} />
                </div>
                <span className="font-medium">{t('privacy_policy')}</span>
              </div>
              <ChevronRight size={16} className="opacity-30" />
            </button>
          </GlassCard>
        </section>

        {/* Logout Button */}
        <div className="pt-4">
          <button
            onClick={async () => {
              hapticFeedback.medium();
              await logout();
            }}
            className={`w-full p-4 rounded-[2rem] border flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${isLight ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
          >
            <LogOut size={18} /> {t('sign_out')}
          </button>

          {/* Danger Zone */}
          <div className="mt-8">
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 text-red-500/70`}>Danger Zone</h3>
            <GlassCard className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
              <button
                onClick={handleDownloadData}
                className={`w-full p-4 flex items-center gap-3 transition text-left ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <FileText size={16} />
                </div>
                <div>
                  <div className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Download My Data</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Get a copy of your information</div>
                </div>
              </button>
              <button
                onClick={handleDeleteAccount}
                className={`w-full p-4 flex items-center gap-3 transition text-left ${isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/5'}`}
              >
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                  <Trash2 size={16} />
                </div>
                <div>
                  <div className="font-medium text-red-500">Delete Account</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Permanently delete all data</div>
                </div>
              </button>
            </GlassCard>
          </div>

          <div className={`text-center text-[10px] font-mono mt-6 ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
            {t('version')} • Build 2024.11.15
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* WIDGET INTEGRATION MODAL */}
      {showWidgetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/80">
          <div className="absolute inset-0" onClick={() => setShowWidgetModal(false)} />
          <GlassCard className="w-full max-w-sm relative z-10 animate-slide-up p-6 bg-[#18181b] border-white/10">
            <button onClick={() => setShowWidgetModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Home Screen</h2>
              <p className="text-white/60 text-sm">Stay updated without opening the app.</p>
            </div>

            {/* Widget Preview */}
            <div className="bg-black/50 rounded-[32px] p-6 mb-6 border border-white/10 flex justify-center">
              {/* Mock iOS Widget */}
              <div className="w-36 h-36 rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-700 p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"><Activity size={10} className="text-white" /></div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white/80">bind</span>
                  </div>
                  <div className="text-2xl font-black text-white">3 New</div>
                  <div className="text-[10px] text-white/70">Matches today</div>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-white/20 border border-white/10"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Check size={16} className="text-green-500" />
                <span className="text-sm text-white/80">Daily Matches Preview</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Check size={16} className="text-green-500" />
                <span className="text-sm text-white/80">Activity Stats</span>
              </div>
            </div>

            <GlassButton onClick={handleActivateWidget} className="w-full mt-6 h-14">
              {widgetActive ? 'Settings Updated' : 'Add to Home Screen'}
            </GlassButton>
          </GlassCard>
        </div>
      )}

      {/* APPLE WATCH INTEGRATION MODAL */}
      {showWatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/90">
          <div className="absolute inset-0" onClick={() => setShowWatchModal(false)} />
          <GlassCard className="w-full max-w-sm relative z-10 animate-slide-up p-0 overflow-hidden bg-[#000000] border-white/10 shadow-2xl">

            {/* Header Visual */}
            <div className="h-48 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center relative overflow-hidden">
              {/* Radar Animation */}
              {watchStatus === 'searching' && (
                <>
                  <div className="absolute w-64 h-64 border border-red-500/30 rounded-full animate-ping"></div>
                  <div className="absolute w-48 h-48 border border-red-500/50 rounded-full animate-ping delay-75"></div>
                </>
              )}

              <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${watchStatus === 'connected' ? 'bg-green-500/20 text-green-500 border-2 border-green-500' : 'bg-white/10 text-white border-2 border-white/20'}`}>
                {watchStatus === 'searching' ? <Loader2 size={40} className="animate-spin" /> : <Watch size={40} />}

                {watchStatus === 'connected' && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-black p-1 rounded-full">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-1">
                  {watchStatus === 'connected' ? 'Apple Watch Ultra' : (watchStatus === 'searching' ? 'Searching...' : 'Pair Apple Watch')}
                </h2>
                <p className="text-white/50 text-sm">
                  {watchStatus === 'connected' ? 'Battery: 84% • Connected' : 'Sync heart rate & workouts.'}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Heart size={18} className="text-red-500" />
                    <span className="text-sm text-white">Heart Rate Sync</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${watchStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-white/20'}`} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-blue-500" />
                    <span className="text-sm text-white">Workout Tracking</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${watchStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-white/20'}`} />
                </div>
              </div>

              {watchStatus === 'disconnected' ? (
                <GlassButton onClick={handleConnectWatch} className="w-full h-14 bg-white text-black hover:bg-gray-200 border-0">
                  Connect Device
                </GlassButton>
              ) : watchStatus === 'searching' ? (
                <GlassButton disabled className="w-full h-14 opacity-50">
                  Pairing...
                </GlassButton>
              ) : (
                <div className="flex gap-3">
                  <GlassButton onClick={() => setWatchStatus('disconnected')} variant="danger" className="flex-1">
                    Disconnect
                  </GlassButton>
                  <GlassButton className="flex-1 bg-white/10 border-white/10">
                    Settings
                  </GlassButton>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* FINANCE MODAL - FIXED LAYOUT */}
      {showFinanceModal && (
        <div className="fixed inset-0 z-[100] flex flex-col animate-fade-in font-sans">
          {/* REPLICATED LIQUID ATMOSPHERE - Matching Layout.tsx */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Base Background */}
            <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-gradient-to-br from-slate-50 via-blue-50/20 to-white' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#000000] to-[#000000]'}`}></div>

            {/* Vibrant Liquid Blobs */}
            <div className={`absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full mix-blend-screen filter blur-[100px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-blue-300/30 opacity-60' : 'bg-indigo-900/30 opacity-40'}`}></div>
            <div className={`absolute top-[20%] right-[-20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[80px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-purple-300/30 opacity-50' : 'bg-purple-900/20 opacity-30'}`} style={{ animationDelay: '2s' }}></div>
            <div className={`absolute bottom-[-20%] left-[10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[90px] animate-blob transition-opacity duration-700 ${isLight ? 'bg-amber-200/40 opacity-50' : 'bg-blue-900/20 opacity-20'}`} style={{ animationDelay: '4s' }}></div>

            {/* Noise Texture Overlay */}
            <div className={`absolute inset-0 opacity-[0.04] pointer-events-none ${isLight ? 'mix-blend-multiply' : 'mix-blend-overlay'}`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>
          </div>

          {/* Header */}
          <div className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between">
            <div>
              <h2 className={`text-3xl font-display font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Wallet</h2>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Manage earnings & billing.</p>
            </div>
            <button
              onClick={() => setShowFinanceModal(false)}
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 shadow-lg ${isLight ? 'bg-white/80 border-white text-slate-900' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-10 no-scrollbar space-y-8">

            {/* Virtual Card - Refined */}
            <div className="perspective-[1000px] animate-slide-up">
              <div className={`
                        relative w-full aspect-[1.586] rounded-[32px] p-8 shadow-2xl overflow-hidden
                        bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#000000] 
                        border border-white/10 text-white
                        transform transition-transform duration-500 hover:rotate-y-2
                    `}>
                {/* Card Background Effects */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-t from-blue-500/20 to-transparent blur-2xl rounded-full translate-y-1/3 -translate-x-1/3"></div>

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                        <Gem size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">bind Pro</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight drop-shadow-lg">$840.00</div>
                    </div>
                    {/* Chip */}
                    <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90 shadow-inner border border-yellow-600/30 flex items-center justify-center">
                      <div className="w-8 h-5 border border-black/10 rounded-sm opacity-50 grid grid-cols-2 gap-0.5"></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-8">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-1">Last Payout</div>
                        <div className="text-sm font-bold flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-400" /> $120.50</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-1">Next Payout</div>
                        <div className="text-sm font-bold flex items-center gap-1"><Clock size={12} className="text-blue-400" /> Dec 12</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="font-mono text-sm sm:text-base opacity-70 tracking-[0.2em]">•••• •••• •••• 4291</div>
                      <div className="text-[10px] font-bold opacity-50 uppercase">Visa Infinite</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              {/* Custom Tabs */}
              <div className={`flex p-1.5 rounded-2xl mb-6 backdrop-blur-xl border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <button
                  onClick={() => setFinanceTab('bank')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${financeTab === 'bank' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-lg border border-white/5') : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'}`}
                >
                  <Building2 size={14} /> Bank Details
                </button>
                <button
                  onClick={() => setFinanceTab('billing')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${financeTab === 'billing' ? (isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-lg border border-white/5') : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'}`}
                >
                  <Receipt size={14} /> Tax & Billing
                </button>
              </div>

              <GlassCard className={`p-6 space-y-6 backdrop-blur-3xl shadow-xl border-0 ${isLight ? 'bg-white/60' : 'bg-white/[0.02]'}`}>
                {financeTab === 'bank' ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Account Holder</label>
                        <GlassInput
                          value={financeData.accountHolder}
                          onChange={(e) => setFinanceData({ ...financeData, accountHolder: e.target.value })}
                          placeholder="Full Name on Account"
                          className={`!py-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>IBAN Number</label>
                        <div className="relative">
                          <GlassInput
                            value={financeData.iban}
                            onChange={(e) => setFinanceData({ ...financeData, iban: e.target.value })}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            className={`font-mono tracking-wide !py-3.5 pl-11 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                          />
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-white/60'}`}>TR</div>
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Bank Name</label>
                        <GlassInput
                          value={financeData.bankName}
                          onChange={(e) => setFinanceData({ ...financeData, bankName: e.target.value })}
                          placeholder="e.g. Garanti BBVA"
                          className={`!py-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Payout Frequency</label>
                        <div className="relative">
                          <select
                            value={financeData.payoutFrequency}
                            onChange={(e) => setFinanceData({ ...financeData, payoutFrequency: e.target.value as any })}
                            className={`w-full rounded-2xl px-4 py-3.5 appearance-none text-base focus:outline-none focus:ring-1 transition-all cursor-pointer ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-black/20 border border-white/10 text-white'}`}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronRight size={16} className="rotate-90" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex gap-3 mb-2">
                      <GlassSelectable
                        selected={financeData.billingType === 'individual'}
                        onClick={() => setFinanceData({ ...financeData, billingType: 'individual' })}
                        className="flex-1 !py-3 text-xs justify-center shadow-sm"
                      >
                        <User size={14} className="mr-2" /> Individual
                      </GlassSelectable>
                      <GlassSelectable
                        selected={financeData.billingType === 'company'}
                        onClick={() => setFinanceData({ ...financeData, billingType: 'company' })}
                        className="flex-1 !py-3 text-xs justify-center shadow-sm"
                      >
                        <Building2 size={14} className="mr-2" /> Company
                      </GlassSelectable>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Tax ID / TCKN</label>
                      <GlassInput
                        value={financeData.taxId}
                        onChange={(e) => setFinanceData({ ...financeData, taxId: e.target.value })}
                        placeholder="12345678901"
                        className={`!py-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                      />
                    </div>

                    {financeData.billingType === 'company' && (
                      <div className="grid grid-cols-2 gap-4 animate-slide-up">
                        <div className="col-span-2">
                          <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Company Name</label>
                          <GlassInput
                            value={financeData.companyName}
                            onChange={(e) => setFinanceData({ ...financeData, companyName: e.target.value })}
                            className={`!py-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Tax Office</label>
                          <GlassInput
                            value={financeData.taxOffice}
                            onChange={(e) => setFinanceData({ ...financeData, taxOffice: e.target.value })}
                            className={`!py-3.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2 block ml-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Billing Address</label>
                      <textarea
                        value={financeData.billingAddress}
                        onChange={(e) => setFinanceData({ ...financeData, billingAddress: e.target.value })}
                        className={`w-full rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 transition-all ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-slate-200' : 'bg-black/20 border border-white/10 text-white focus:ring-white/10'}`}
                        rows={3}
                        placeholder="Full address for invoices..."
                      />
                    </div>
                  </div>
                )}

                <div className={`h-px w-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                <GlassButton onClick={handleSaveFinance} className="w-full h-14 shadow-2xl shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-500 border-0 text-lg tracking-wide font-bold">
                  Save Changes
                </GlassButton>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm ${isLight ? 'bg-slate-900/20' : 'bg-black/80'}`}>
          <div className="absolute inset-0" onClick={() => setShowLangModal(false)} />
          <GlassCard className={`w-full max-w-xs relative z-10 animate-slide-up ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Select Language</h3>
            <div className="space-y-2">
              {Object.keys(LANGUAGES).map((langKey) => {
                const lang = langKey as Language;
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLangModal(false);
                      hapticFeedback.light();
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${isActive ? (isLight ? 'bg-slate-100 border border-slate-200' : 'bg-white/10 border border-white/10') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5')}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{LANGUAGES[lang].flag}</span>
                      <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-white'}`}>{LANGUAGES[lang].label}</span>
                    </div>
                    {isActive && <Check size={16} className="text-green-500" />}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Manage Subscription Modal */}
      {showManageSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl bg-black/80">
          <div className="absolute inset-0" onClick={() => setShowManageSubModal(false)} />
          <GlassCard className="w-full max-w-md relative z-10 animate-slide-up p-6 bg-[#18181b] border-white/10">
            <button onClick={() => setShowManageSubModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 border-2 border-amber-500/30">
                <Crown size={32} className="text-amber-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Gold Membership</h2>
              <p className="text-white/60 text-sm">Active until December 2025</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Plan Type</span>
                  <span className="text-white font-medium">Annual</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Next Billing</span>
                  <span className="text-white font-medium">Dec 15, 2025</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-amber-400" />
                  <span className="text-amber-400 font-medium text-sm">Active Benefits</span>
                </div>
                <ul className="text-white/70 text-xs space-y-1 ml-6">
                  <li>• Unlimited swipes & matches</li>
                  <li>• Advanced filters</li>
                  <li>• Priority support</li>
                  <li>• Ad-free experience</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/premium')}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <ArrowUpCircle size={18} />
                Upgrade to Pro
              </button>
              <button
                onClick={async () => {
                  const confirmed = confirm("Cancel Gold membership? You'll lose all premium benefits.");
                  if (confirmed) {
                    hapticFeedback.heavy();
                    updateUser({ isPremium: false });
                    setShowManageSubModal(false);
                    notificationService.showNotification("Subscription Cancelled", { body: "You'll retain access until Dec 2025." });
                  }
                }}
                className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 transition"
              >
                Cancel Subscription
              </button>
            </div>

            <p className="text-white/40 text-[10px] text-center mt-4">
              Refunds available within 14 days of purchase only.
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
