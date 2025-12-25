import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Database, Users, Lock, Globe, Mail, Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/Glass';
import { useTheme } from '../context/ThemeContext';

export const LegalPrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const sections = [
    {
      icon: Database,
      title: '1. Veri Sorumlusu',
      content: `Bind Spor Teknolojileri A.Ş. ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.

Adres: İstanbul, Türkiye
E-posta: privacy@bind.app
Telefon: +90 212 XXX XX XX`
    },
    {
      icon: FileText,
      title: '2. İşlenen Kişisel Veriler',
      content: `Aşağıdaki kategorilerde kişisel verilerinizi işlemekteyiz:

• Kimlik Bilgileri: Ad, soyad, doğum tarihi, cinsiyet
• İletişim Bilgileri: E-posta adresi, telefon numarası
• Konum Bilgileri: GPS koordinatları, şehir/ilçe bilgisi
• Görsel Veriler: Profil fotoğrafı, galeri fotoğrafları
• Sağlık/Fitness Verileri: Spor tercihleri, antrenman geçmişi
• Kullanım Verileri: Uygulama içi aktiviteler, eşleşme tercihleri
• Ödeme Bilgileri: Fatura adresi, ödeme geçmişi (kart bilgileri saklanmaz)`
    },
    {
      icon: Shield,
      title: '3. Verilerin İşlenme Amaçları',
      content: `Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:

• Hesap oluşturma ve kimlik doğrulama
• Spor partneri eşleştirme hizmetinin sunulması
• Konum bazlı eşleştirme ve harita özellikleri
• AI destekli analiz ve öneriler
• Antrenör rezervasyonu ve ödeme işlemleri
• Kullanıcı güvenliği ve dolandırıcılık önleme
• Yasal yükümlülüklerin yerine getirilmesi
• Hizmet kalitesinin iyileştirilmesi`
    },
    {
      icon: Lock,
      title: '4. Verilerin İşlenmesinin Hukuki Sebepleri',
      content: `KVKK madde 5 ve 6 kapsamında:

• Açık rızanız (konum paylaşımı, bildirimler)
• Sözleşmenin ifası (hesap yönetimi, hizmet sunumu)
• Yasal yükümlülük (vergi, denetim gereksinimleri)
• Meşru menfaat (hizmet iyileştirme, güvenlik)
• Bir hakkın tesisi (hukuki süreçler)`
    },
    {
      icon: Users,
      title: '5. Verilerin Aktarılması',
      content: `Kişisel verileriniz aşağıdaki alıcı gruplarına aktarılabilir:

• Bulut Hizmet Sağlayıcıları: Supabase (veritabanı), Cloudflare (CDN)
• Ödeme İşlemcileri: RevenueCat (abonelik yönetimi)
• Analitik Sağlayıcıları: Google Analytics, Sentry
• Yasal Makamlar: Yasal zorunluluk halinde

Yurt dışı aktarımlar KVKK madde 9'a uygun olarak, yeterli koruma sağlayan ülkelere veya açık rızanız ile gerçekleştirilmektedir.`
    },
    {
      icon: Clock,
      title: '6. Saklama Süresi',
      content: `Kişisel verileriniz:

• Hesap aktif olduğu sürece saklanır
• Hesap silinmesinden itibaren 30 gün içinde anonimleştirilir
• Yasal zorunluluklar gereği bazı veriler 10 yıla kadar saklanabilir
• Ödeme kayıtları yasal düzenlemeler gereği 10 yıl saklanır`
    },
    {
      icon: Shield,
      title: '7. KVKK Kapsamındaki Haklarınız',
      content: `KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:

• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
• Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme
• Silinmesini veya yok edilmesini isteme
• Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme
• Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme
• Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme`
    },
    {
      icon: Mail,
      title: '8. İletişim',
      content: `Haklarınızı kullanmak veya sorularınız için:

E-posta: kvkk@bind.app
Posta: Bind Spor Teknolojileri A.Ş.
        KVKK Başvuru Birimi
        İstanbul, Türkiye

Başvurularınız 30 gün içinde yanıtlanacaktır.`
    }
  ];

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
            KVKK Aydınlatma Metni
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Header Card */}
        <GlassCard className="p-6 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'} flex items-center justify-center`}>
            <Shield size={32} className="text-blue-500" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Kişisel Verilerin Korunması
          </h2>
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            6698 Sayılı KVKK Kapsamında Aydınlatma Metni
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
            Son güncelleme: 19 Aralık 2025
          </p>
        </GlassCard>

        {/* Sections */}
        {sections.map((section, index) => (
          <GlassCard key={index} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${isLight ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
                <section.icon size={20} className="text-blue-500" />
              </div>
              <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {section.title}
              </h3>
            </div>
            <p className={`text-sm whitespace-pre-line ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              {section.content}
            </p>
          </GlassCard>
        ))}

        {/* Footer */}
        <div className={`text-center py-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
          <p className="text-xs">
            Bu aydınlatma metni KVKK uyarınca hazırlanmıştır.
          </p>
          <button 
            onClick={() => navigate('/privacy')}
            className="text-xs text-cyan-500 hover:underline mt-2"
          >
            Genel Gizlilik Politikası →
          </button>
        </div>
      </div>
    </div>
  );
};
