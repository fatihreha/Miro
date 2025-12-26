import { supabase } from './supabase';

/**
 * Session Management Service
 * Handles device sessions, logout from all devices, etc.
 */

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

class SessionService {
    private deviceId: string | null = null;

    /**
     * Get or generate device ID
     */
    getDeviceId(): string {
        if (this.deviceId) return this.deviceId;

        // Try to get from localStorage
        let storedId = localStorage.getItem('pulse_device_id');
        if (!storedId) {
            storedId = crypto.randomUUID();
            localStorage.setItem('pulse_device_id', storedId);
        }
        this.deviceId = storedId;
        return storedId;
    }

    /**
     * Detect device type
     */
    getDeviceType(): 'ios' | 'android' | 'web' {
        const ua = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) return 'ios';
        if (/android/.test(ua)) return 'android';
        return 'web';
    }

    /**
     * Get device name
     */
    getDeviceName(): string {
        const ua = navigator.userAgent;

        // iOS
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';

        // Android
        const androidMatch = ua.match(/Android.*?;\s*([^;)]+)/);
        if (androidMatch) return androidMatch[1].trim();

        // Desktop
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        if (/Linux/.test(ua)) return 'Linux PC';

        return 'Unknown Device';
    }

    /**
     * Register current session on login
     */
    async registerSession(userId: string): Promise<void> {
        try {
            const deviceId = this.getDeviceId();
            const deviceType = this.getDeviceType();
            const deviceName = this.getDeviceName();

            await supabase.from('user_sessions').upsert({
                user_id: userId,
                device_id: deviceId,
                device_name: deviceName,
                device_type: deviceType,
                user_agent: navigator.userAgent,
                last_active_at: new Date().toISOString(),
                is_current: true,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            }, {
                onConflict: 'user_id,device_id'
            });

            // Mark other sessions as not current
            await supabase
                .from('user_sessions')
                .update({ is_current: false })
                .eq('user_id', userId)
                .neq('device_id', deviceId);

            // Log security event
            await this.logSecurityEvent(userId, 'session_created', {
                device_id: deviceId,
                device_type: deviceType
            });
        } catch (error) {
            console.error('Failed to register session:', error);
        }
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(userId: string): Promise<void> {
        const deviceId = this.getDeviceId();

        await supabase
            .from('user_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('device_id', deviceId);
    }

    /**
     * Get all active sessions for user
     */
    async getSessions(userId: string): Promise<DeviceSession[]> {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString())
            .order('last_active_at', { ascending: false });

        if (error) throw error;

        const currentDeviceId = this.getDeviceId();
        return (data || []).map(session => ({
            ...session,
            is_current: session.device_id === currentDeviceId
        }));
    }

    /**
     * Logout from specific device
     */
    async logoutDevice(userId: string, sessionId: string): Promise<void> {
        await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId)
            .eq('user_id', userId);

        await this.logSecurityEvent(userId, 'session_revoked', { session_id: sessionId });
    }

    /**
     * Logout from all devices except current
     */
    async logoutAllOtherDevices(userId: string): Promise<void> {
        const currentDeviceId = this.getDeviceId();

        await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', userId)
            .neq('device_id', currentDeviceId);

        await this.logSecurityEvent(userId, 'all_sessions_revoked');
    }

    /**
     * Logout from all devices (including current)
     */
    async logoutAllDevices(userId: string): Promise<void> {
        await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', userId);

        await this.logSecurityEvent(userId, 'full_logout');
    }

    /**
     * Log security event
     */
    private async logSecurityEvent(
        userId: string,
        action: string,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        try {
            await supabase.rpc('log_security_event', {
                p_user_id: userId,
                p_action: action,
                p_metadata: metadata
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
}

export const sessionService = new SessionService();
