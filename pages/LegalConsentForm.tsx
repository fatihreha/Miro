import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Shield, MapPin, Bell, BarChart3, Share2, Save } from 'lucide-react';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { hapticFeedback as hapticService } from '../services/hapticService';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  enabled: boolean;
}

export const LegalConsentForm: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';

  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: 'location',
      title: 'Konum Verileri',
      description: 'Yakınlarınızdaki spor partnerlerini bulmak ve harita özelliklerini kullanmak için konum bilginize erişilmesine izin veriyorum.',
      icon: MapPin,
      required: false,
      enabled: true
    },
    {
      id: 'notifications',
      title: 'Bildirimler',
      description: 'Eşleşmeler, mesajlar ve etkinlikler hakkında push bildirimleri almak istiyorum.',
      icon: Bell,
      required: false,
      enabled: true
    },
    {
      id: 'analytics',
      title: 'Analitik ve İyileştirme',
      description: 'Uygulama kullanım verilerimin hizmet kalitesini artırmak için anonim olarak analiz edilmesine izin veriyorum.',
      icon: BarChart3,
      required: false,
      enabled: true
    },
    {
      id: 'marketing',
      title: 'Pazarlama İletişimi',
      description: 'Özel teklifler, yeni özellikler ve etkinlikler hakkında e-posta almak istiyorum.',
      icon: Share2,
      required: false,
      enabled: false
    },
    {
      id: 'thirdParty',
      title: 'Üçüncü Taraf Paylaşımı',
      description: 'Verilerimin hizmet sağlayıcılarıyla (bulut, ödeme işlemcileri) paylaşılmasına izin veriyorum.',
      icon: Shield,
      required: true,
      enabled: true
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadUserConsents();
  }, [user]);

  const loadUserConsents = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setConsents(prev => prev.map(consent => ({
          ...consent,
          enabled: data[consent.id] ?? consent.enabled
        })));
      }
    } catch (error) {
      // Tablo yoksa veya kayıt yoksa varsayılanları kullan
      console.log('Using default consents');
    }
  };

  const toggleConsent = (id: string) => {
    const consent = consents.find(c => c.id === id);
    if (consent?.required) return; // Zorunlu olanlar değiştirilemez

    hapticService.light();
    setConsents(prev => prev.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      hapticService.medium();

      const consentData = {
        user_id: user.id,
        location: consents.find(c => c.id === 'location')?.enabled,
        notifications: consents.find(c => c.id === 'notifications')?.enabled,
        analytics: consents.find(c => c.id === 'analytics')?.enabled,
        marketing: consents.find(c => c.id === 'marketing')?.enabled,
        thirdParty: consents.find(c => c.id === 'thirdParty')?.enabled,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_consents')
        .upsert(consentData, { onConflict: 'user_id' });

      if (error && error.code !== '42P01') {
        throw error;
      }

      setSaved(true);
      hapticService.success();
    } catch (error) {
      console.error('Error saving consents:', error);
      hapticService.error();
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = consents.filter(c => c.enabled).length;

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${isLight ? 'bg-white/80' : 'bg-slate-900/80'} backdrop-blur-xl border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
          >
            <ArrowLeft size={24} className={isLight ? 'text-slate-900' : 'text-white'} />
          </button>
          <h1 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Açık Rıza Beyanı
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Header Card */}
        <GlassCard className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isLight ? 'bg-green-100' : 'bg-green-500/20'} flex items-center justify-center`}>
            <Shield size={32} className="text-green-500" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Veri İşleme Tercihleri
          </h2>
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            KVKK kapsamında verdiğiniz açık rızaları buradan yönetebilirsiniz.
          </p>
        </GlassCard>

        {/* Summary */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className={isLight ? 'text-slate-600' : 'text-white/60'}>
              Aktif izinler
            </span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {enabledCount} / {consents.length}
            </span>
          </div>
          <div className={`mt-2 h-2 rounded-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all"
              style={{ width: `${(enabledCount / consents.length) * 100}%` }}
            />
          </div>
        </GlassCard>

        {/* Consent Items */}
        <div className="space-y-3">
          {consents.map((consent) => (
            <GlassCard
              key={consent.id}
              className={`p-4 cursor-pointer transition-all ${consent.required ? 'opacity-80' : ''}`}
              onClick={() => toggleConsent(consent.id)}
            >
              <div className="flex items-start gap-4">
                {/* Toggle */}
                <div className="pt-1">
                  {consent.enabled ? (
                    <CheckCircle size={24} className="text-green-500" />
                  ) : (
                    <Circle size={24} className={isLight ? 'text-slate-300' : 'text-white/20'} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <consent.icon size={16} className={consent.enabled ? 'text-cyan-500' : (isLight ? 'text-slate-400' : 'text-white/40')} />
                    <h3 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {consent.title}
                    </h3>
                    {consent.required && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-medium">
                        Zorunlu
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    {consent.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Legal Note */}
        <GlassCard className="p-4">
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            <strong>Yasal Bilgilendirme:</strong> KVKK madde 5 ve 6 kapsamında,
            zorunlu işaretli izinler hizmetin sunulabilmesi için gereklidir.
            Diğer izinleri istediğiniz zaman geri çekebilirsiniz. İzin değişiklikleri
            gelecekteki veri işleme aktivitelerini etkiler, geçmişe dönük uygulanmaz.
          </p>
        </GlassCard>
      </div>

      {/* Save Button */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${isLight ? 'bg-white/90' : 'bg-slate-900/90'} backdrop-blur-xl border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <GlassButton
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle size={20} />
              <span>Kaydedildi</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Tercihleri Kaydet</span>
            </>
          )}
        </GlassButton>
      </div>
    </div>
  );
};
