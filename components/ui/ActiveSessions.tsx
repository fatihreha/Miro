import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { sessionService } from '../../services/sessionService';
import { hapticFeedback } from '../../services/hapticService';
import { notificationService } from '../../services/notificationService';
import { GlassCard, GlassButton } from './Glass';
import {
    Smartphone,
    Monitor,
    Tablet,
    LogOut,
    Loader2,
    Shield,
    CheckCircle2,
    XCircle,
    Clock,
    MapPin
} from 'lucide-react';

interface DeviceSession {
    id: string;
    device_id: string;
    device_name: string | null;
    device_type: 'ios' | 'android' | 'web';
    ip_address: string | null;
    created_at: string;
    last_active_at: string;
    is_current: boolean;
}

interface ActiveSessionsProps {
    onClose?: () => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ onClose }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isLight = theme === 'light';

    const [sessions, setSessions] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
    }, [user]);

    const loadSessions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await sessionService.getSessions(user.id);
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutDevice = async (sessionId: string) => {
        if (!user) return;
        setActionLoading(sessionId);
        hapticFeedback.medium();

        try {
            await sessionService.logoutDevice(user.id, sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            notificationService.showNotification('Cihaz Çıkış Yapıldı', {
                body: 'Oturum başarıyla sonlandırıldı.'
            });
        } catch (error) {
            console.error('Failed to logout device:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogoutAllOthers = async () => {
        if (!user) return;
        setActionLoading('all');
        hapticFeedback.heavy();

        try {
            await sessionService.logoutAllOtherDevices(user.id);
            setSessions(prev => prev.filter(s => s.is_current));
            notificationService.showNotification('Tüm Cihazlar Çıkış Yapıldı', {
                body: 'Diğer tüm cihazlardaki oturumlar sonlandırıldı.'
            });
        } catch (error) {
            console.error('Failed to logout all devices:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'ios':
            case 'android':
                return Smartphone;
            case 'web':
                return Monitor;
            default:
                return Tablet;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
                        <Shield size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Aktif Oturumlar
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            {sessions.length} cihaz bağlı
                        </p>
                    </div>
                </div>
                {sessions.length > 1 && (
                    <button
                        onClick={handleLogoutAllOthers}
                        disabled={actionLoading === 'all'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${isLight
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                    >
                        {actionLoading === 'all' ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <LogOut size={12} />
                        )}
                        Diğerlerini Çıkar
                    </button>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className={`animate-spin ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
                </div>
            )}

            {/* Sessions List */}
            {!loading && sessions.length === 0 && (
                <div className={`text-center py-12 ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
                    <p className="text-sm">Aktif oturum bulunamadı</p>
                </div>
            )}

            {!loading && sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type);
                const isCurrent = session.is_current;

                return (
                    <GlassCard
                        key={session.id}
                        className={`p-4 relative overflow-hidden ${isCurrent
                                ? (isLight ? 'border-green-200 bg-green-50/50' : 'border-green-500/30 bg-green-500/5')
                                : ''
                            }`}
                    >
                        {/* Current Badge */}
                        {isCurrent && (
                            <div className="absolute top-0 right-0 px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded-bl-lg">
                                BU CİHAZ
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            {/* Device Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'bg-slate-100' : 'bg-white/5'
                                }`}>
                                <DeviceIcon size={24} className={isLight ? 'text-slate-600' : 'text-white/60'} />
                            </div>

                            {/* Device Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {session.device_name || 'Bilinmeyen Cihaz'}
                                    </h4>
                                    {isCurrent && (
                                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                    )}
                                </div>

                                <div className={`flex items-center gap-3 text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatDate(session.last_active_at)}
                                    </span>
                                    <span className="uppercase font-bold text-[10px] px-1.5 py-0.5 rounded bg-black/5">
                                        {session.device_type}
                                    </span>
                                </div>
                            </div>

                            {/* Logout Button */}
                            {!isCurrent && (
                                <button
                                    onClick={() => handleLogoutDevice(session.id)}
                                    disabled={actionLoading === session.id}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isLight
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                        }`}
                                >
                                    {actionLoading === session.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <XCircle size={18} />
                                    )}
                                </button>
                            )}
                        </div>
                    </GlassCard>
                );
            })}

            {/* Security Tips */}
            <div className={`mt-6 p-4 rounded-xl border ${isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                <p className={`text-xs ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
                    💡 <strong>Güvenlik İpucu:</strong> Tanımadığınız cihazları hemen çıkış yaptırın ve şifrenizi değiştirin.
                </p>
            </div>
        </div>
    );
};

export default ActiveSessions;
