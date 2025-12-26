import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { twoFactorService } from '../../services/twoFactorService';
import { hapticFeedback } from '../../services/hapticService';
import { notificationService } from '../../services/notificationService';
import { GlassCard, GlassButton, GlassInput } from './Glass';
import {
    ShieldCheck,
    ShieldOff,
    Loader2,
    QrCode,
    Key,
    Copy,
    Check,
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw
} from 'lucide-react';

interface TwoFactorStatus {
    isEnabled: boolean;
    lastVerifiedAt: string | null;
    hasBackupCodes: boolean;
}

export const TwoFactorSettings: React.FC = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isLight = theme === 'light';

    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Setup Flow State
    const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify' | 'backup'>('idle');
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [showSecret, setShowSecret] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, [user]);

    const loadStatus = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await twoFactorService.getStatus(user.id);
            setStatus(data);
        } catch (error) {
            console.error('Failed to load 2FA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSetup = async () => {
        if (!user?.email) return;
        setActionLoading(true);
        hapticFeedback.medium();

        try {
            const result = await twoFactorService.generateSecret(user.id, user.email);
            setQrCodeUrl(result.qrCodeUrl);
            setSecret(result.secret);
            setBackupCodes(result.backupCodes);
            setSetupStep('qr');
        } catch (error) {
            console.error('Failed to generate 2FA secret:', error);
            notificationService.showNotification('Hata', {
                body: '2FA kurulumu başlatılamadı.'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (!user || !verificationCode) return;
        setActionLoading(true);
        hapticFeedback.medium();

        try {
            const success = await twoFactorService.verifyAndEnable(user.id, verificationCode);

            if (success) {
                hapticFeedback.success();
                setSetupStep('backup');
                setStatus(prev => prev ? { ...prev, isEnabled: true } : null);
                notificationService.showNotification('2FA Aktif!', {
                    body: 'İki faktörlü doğrulama başarıyla etkinleştirildi.'
                });
            } else {
                hapticFeedback.error();
                notificationService.showNotification('Hatalı Kod', {
                    body: 'Girdiğiniz kod geçersiz. Lütfen tekrar deneyin.'
                });
            }
        } catch (error) {
            console.error('Failed to verify 2FA:', error);
            hapticFeedback.error();
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!user) return;

        const code = prompt('2FA\'yı devre dışı bırakmak için doğrulama kodunuzu girin:');
        if (!code) return;

        setActionLoading(true);
        hapticFeedback.heavy();

        try {
            const success = await twoFactorService.disable(user.id, code);

            if (success) {
                hapticFeedback.success();
                setStatus(prev => prev ? { ...prev, isEnabled: false } : null);
                setSetupStep('idle');
                notificationService.showNotification('2FA Devre Dışı', {
                    body: 'İki faktörlü doğrulama kapatıldı.'
                });
            } else {
                hapticFeedback.error();
                notificationService.showNotification('Hatalı Kod', {
                    body: 'Girdiğiniz kod geçersiz.'
                });
            }
        } catch (error) {
            console.error('Failed to disable 2FA:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        hapticFeedback.light();
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleCopySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            hapticFeedback.light();
            notificationService.showNotification('Kopyalandı', { body: 'Secret key panoya kopyalandı.' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className={`animate-spin ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.isEnabled
                        ? (isLight ? 'bg-green-100' : 'bg-green-500/20')
                        : (isLight ? 'bg-slate-100' : 'bg-white/5')
                    }`}>
                    {status?.isEnabled ? (
                        <ShieldCheck size={20} className="text-green-500" />
                    ) : (
                        <ShieldOff size={20} className={isLight ? 'text-slate-400' : 'text-white/40'} />
                    )}
                </div>
                <div>
                    <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        İki Faktörlü Doğrulama
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                        {status?.isEnabled ? 'Aktif - Hesabınız korunuyor' : 'Devre dışı'}
                    </p>
                </div>
            </div>

            {/* Not Enabled State */}
            {!status?.isEnabled && setupStep === 'idle' && (
                <GlassCard className="p-6">
                    <div className="text-center space-y-4">
                        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'
                            }`}>
                            <Key size={32} className="text-indigo-500" />
                        </div>
                        <div>
                            <h4 className={`font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                Ekstra Güvenlik Katmanı
                            </h4>
                            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                                Google Authenticator veya benzeri bir uygulama ile hesabınızı koruyun.
                            </p>
                        </div>
                        <GlassButton
                            onClick={handleStartSetup}
                            disabled={actionLoading}
                            className="w-full"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" /> : '2FA\'yı Etkinleştir'}
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* QR Code Step */}
            {setupStep === 'qr' && (
                <GlassCard className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <QrCode size={20} className="text-indigo-500" />
                            <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                Adım 1: QR Kodu Tara
                            </h4>
                        </div>

                        {/* QR Code */}
                        <div className={`p-4 rounded-xl mx-auto max-w-[200px] ${isLight ? 'bg-white' : 'bg-white'}`}>
                            {qrCodeUrl && (
                                <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-auto" />
                            )}
                        </div>

                        <p className={`text-xs text-center ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            Google Authenticator, Authy veya benzeri bir uygulama ile tarayın
                        </p>

                        {/* Manual Entry */}
                        <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                                    Manuel Giriş
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className={`p-1 rounded ${isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'}`}
                                    >
                                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        onClick={handleCopySecret}
                                        className={`p-1 rounded ${isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'}`}
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                            <code className={`text-xs font-mono break-all ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                                {showSecret ? secret : '••••••••••••••••••••'}
                            </code>
                        </div>

                        <GlassButton
                            onClick={() => setSetupStep('verify')}
                            className="w-full"
                        >
                            Kodu Taradım, Devam Et
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Verification Step */}
            {setupStep === 'verify' && (
                <GlassCard className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Key size={20} className="text-indigo-500" />
                            <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                Adım 2: Doğrulama Kodu
                            </h4>
                        </div>

                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                            Authenticator uygulamanızdan 6 haneli kodu girin:
                        </p>

                        <GlassInput
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="text-center text-2xl font-mono tracking-[0.5em]"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSetupStep('qr')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/60'
                                    }`}
                            >
                                Geri
                            </button>
                            <GlassButton
                                onClick={handleVerifyAndEnable}
                                disabled={verificationCode.length !== 6 || actionLoading}
                                className="flex-1"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" /> : 'Doğrula'}
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Backup Codes Step */}
            {setupStep === 'backup' && (
                <GlassCard className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Check size={20} className="text-green-500" />
                            <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                2FA Aktif!
                            </h4>
                        </div>

                        <div className={`p-4 rounded-xl border ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
                            }`}>
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className={`text-sm font-bold mb-1 ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
                                        Yedek Kodlarınızı Kaydedin!
                                    </p>
                                    <p className={`text-xs ${isLight ? 'text-amber-700' : 'text-amber-300/80'}`}>
                                        Telefonunuza erişemezseniz bu kodları kullanabilirsiniz. Her kod sadece bir kez kullanılır.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCopyCode(code)}
                                    className={`p-2 rounded-lg font-mono text-sm flex items-center justify-between transition-all ${copiedCode === code
                                            ? (isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400')
                                            : (isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-white/80 hover:bg-white/10')
                                        }`}
                                >
                                    <span>{code}</span>
                                    {copiedCode === code ? <Check size={14} /> : <Copy size={14} className="opacity-40" />}
                                </button>
                            ))}
                        </div>

                        <GlassButton
                            onClick={() => setSetupStep('idle')}
                            className="w-full"
                        >
                            Tamamla
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Enabled State - Management */}
            {status?.isEnabled && setupStep === 'idle' && (
                <GlassCard className="p-6">
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${isLight ? 'bg-green-50' : 'bg-green-500/10'
                            }`}>
                            <ShieldCheck size={24} className="text-green-500" />
                            <div>
                                <p className={`font-bold text-sm ${isLight ? 'text-green-800' : 'text-green-300'}`}>
                                    2FA Aktif
                                </p>
                                <p className={`text-xs ${isLight ? 'text-green-600' : 'text-green-400/70'}`}>
                                    Hesabınız iki faktörlü doğrulama ile korunuyor
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDisable2FA}
                            disabled={actionLoading}
                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${isLight
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                }`}
                        >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
                            2FA'yı Devre Dışı Bırak
                        </button>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

export default TwoFactorSettings;
