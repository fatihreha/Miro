import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassButton } from '../components/ui/Glass';
import {
    Shield, Download, Trash2, Check, X, AlertTriangle,
    FileText, ArrowLeft, Eye, EyeOff, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { privacyService, UserConsents } from '../services/privacyService';

export const PrivacySettings: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const isLight = theme === 'light';

    const [consents, setConsents] = useState<UserConsents>({
        marketing: false,
        analytics: false,
        location: false,
        thirdParty: false
    });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletionRequest, setDeletionRequest] = useState<any>(null);

    useEffect(() => {
        loadConsents();
        checkDeletionRequest();
    }, [user]);

    const loadConsents = async () => {
        if (!user) return;

        try {
            const userConsents = await privacyService.getConsent(user.id);
            if (userConsents) {
                setConsents(userConsents);
            }
        } catch (error) {
            console.error('Failed to load consents:', error);
        }
    };

    const checkDeletionRequest = async () => {
        if (!user) return;

        try {
            const request = await privacyService.getDeletionRequest(user.id);
            setDeletionRequest(request);
        } catch (error) {
            console.error('Failed to check deletion request:', error);
        }
    };

    const handleConsentToggle = async (key: keyof UserConsents) => {
        if (!user) return;

        setLoading(true);
        try {
            const newConsents = { ...consents, [key]: !consents[key] };
            await privacyService.updateConsent(user.id, { [key]: !consents[key] });
            setConsents(newConsents);
        } catch (error) {
            alert('Rıza ayarı güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        if (!user) return;

        setExporting(true);
        try {
            const blob = await privacyService.exportUserData(user.id);

            // Download ZIP
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sportpulse_data_${user.id}_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Verileriniz başarıyla indirildi!');
        } catch (error) {
            alert('Veri dışa aktarma başarısız oldu');
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await privacyService.deleteUserAccount(user.id, deleteReason);
            alert('Hesap silme talebiniz alındı. 30 gün içinde hesabınız kalıcı olarak silinecektir.');
            setShowDeleteConfirm(false);
            checkDeletionRequest();
        } catch (error) {
            alert('Hesap silme işlemi başarısız oldu');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDeletion = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await privacyService.cancelDeletion(user.id);
            alert('Hesap silme talebiniz iptal edildi');
            setDeletionRequest(null);
        } catch (error) {
            alert('İşlem başarısız oldu');
        } finally {
            setLoading(false);
        }
    };

    const consentItems = [
        {
            key: 'marketing' as keyof UserConsents,
            title: 'Pazarlama İletişimi',
            description: 'Kampanyalar ve özel teklifler hakkında bilgilendirme',
            icon: <FileText className="w-5 h-5" />,
            required: false
        },
        {
            key: 'analytics' as keyof UserConsents,
            title: 'Analitik Veriler',
            description: 'Uygulama kullanım verilerinin toplanması',
            icon: <Eye className="w-5 h-5" />,
            required: false
        },
        {
            key: 'location' as keyof UserConsents,
            title: 'Konum Takibi',
            description: 'Yakınındaki kullanıcıları görmek için gerekli',
            icon: <Shield className="w-5 h-5" />,
            required: true
        },
        {
            key: 'thirdParty' as keyof UserConsents,
            title: '3. Taraf Paylaşımı',
            description: 'RevenueCat ve analitik servisleriyle veri paylaşımı',
            icon: <AlertTriangle className="w-5 h-5" />,
            required: false
        }
    ];

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen px-6 pt-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="p-2">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Gizlilik Ayarları</h1>
                <div className="w-10" />
            </div>

            {/* Deletion Request Warning */}
            {deletionRequest && (
                <GlassCard className="p-4 mb-6 border-2 border-red-500">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-red-500 mb-1">Hesap Silme Talebi Aktif</h3>
                            <p className="text-sm mb-2">
                                Hesabınız {new Date(deletionRequest.scheduled_deletion_date).toLocaleDateString('tr-TR')} tarihinde kalıcı olarak silinecektir.
                            </p>
                            <GlassButton
                                onClick={handleCancelDeletion}
                                disabled={loading}
                                className="mt-2 bg-red-500 text-white text-sm py-2"
                            >
                                İptal Et
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Consent Management */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    Rıza Yönetimi
                </h2>
                <div className="space-y-3">
                    {consentItems.map((item) => (
                        <GlassCard key={item.key} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="text-blue-500">{item.icon}</div>
                                        <h3 className="font-semibold">{item.title}</h3>
                                        {item.required && (
                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                                Gerekli
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {item.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => !item.required && handleConsentToggle(item.key)}
                                    disabled={loading || item.required}
                                    className={`ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${consents[item.key] ? 'bg-green-500' : 'bg-gray-400'
                                        } ${item.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${consents[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Data Export */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Download className="w-6 h-6" />
                    Verilerimi İndir
                </h2>
                <GlassCard className="p-5">
                    <p className={`mb-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Tüm kişisel verilerinizi ZIP dosyası olarak indirin. İçerik:
                    </p>
                    <ul className={`mb-4 space-y-1 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        <li>• Profil bilgileri</li>
                        <li>• Mesajlar</li>
                        <li>• Eşleşmeler</li>
                        <li>• Antrenman davetleri</li>
                        <li>• Kulüp üyelikleri</li>
                        <li>• Rıza geçmişi</li>
                    </ul>
                    <GlassButton
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full bg-blue-500 text-white py-3"
                    >
                        {exporting ? 'İndiriliyor...' : 'Verilerimi İndir'}
                    </GlassButton>
                </GlassCard>
            </div>

            {/* Account Deletion */}
            {!deletionRequest && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                        <Trash2 className="w-6 h-6" />
                        Hesabı Sil
                    </h2>

                    {!showDeleteConfirm ? (
                        <GlassCard className="p-5">
                            <p className={`mb-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                Hesabınızı kalıcı olarak silmek isterseniz, bu işlem geri alınamaz.
                            </p>
                            <GlassButton
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full bg-red-500 text-white py-3"
                            >
                                Hesabı Silmeye Başla
                            </GlassButton>
                        </GlassCard>
                    ) : (
                        <GlassCard className="p-5 border-2 border-red-500">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-red-500 mb-2">Emin misiniz?</h3>
                                    <p className={`text-sm mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Bu işlem:
                                    </p>
                                    <ul className={`text-sm space-y-1 mb-3 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                        <li>• Verilerinizi hemen anonimleştirir</li>
                                        <li>• 30 gün sonra kalıcı olarak siler</li>
                                        <li>• Eşleşmelerinizi sonlandırır</li>
                                        <li>• Geri alınamaz (30 gün içinde iptal edebilirsiniz)</li>
                                    </ul>
                                </div>
                            </div>

                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Neden ayrılıyorsunuz? (İsteğe bağlı)"
                                className={`w-full p-3 rounded-xl mb-3 ${isLight ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-white'
                                    } placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500`}
                                rows={3}
                            />

                            <div className="flex gap-3">
                                <GlassButton
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 border border-gray-400 py-3"
                                >
                                    İptal
                                </GlassButton>
                                <GlassButton
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 text-white py-3"
                                >
                                    {loading ? 'İşleniyor...' : 'Hesabı Sil'}
                                </GlassButton>
                            </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {/* Legal Documents */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Yasal Belgeler
                </h2>
                <div className="space-y-3">
                    <GlassCard
                        className="p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => navigate('/legal/privacy-policy')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">KVKK Aydınlatma Metni</h3>
                                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Kişisel verilerinizin işlenmesi hakkında bilgi
                                </p>
                            </div>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </GlassCard>

                    <GlassCard
                        className="p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => navigate('/legal/consent-form')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Açık Rıza Beyanı</h3>
                                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                    Verdiğiniz rızaların detayları
                                </p>
                            </div>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
