import { PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

// Check if running on native platform
const isNative = Capacitor.isNativePlatform();

export interface NotificationPayload {
    userId: string;
    title: string;
    body: string;
    data?: any;
    type?: 'match' | 'message' | 'request' | 'booking' | 'club';
}

class PushNotificationService {
    private initialized = false;

    /**
     * Initialize push notifications
     * Call this on app startup after user login
     */
    async initialize(userId: string) {
        if (!isNative || this.initialized) {
            console.log('Push notifications not available or already initialized');
            return;
        }

        try {
            // Request permission
            const permStatus = await PushNotifications.requestPermissions();

            if (permStatus.receive === 'granted') {
                // Register with Apple / Google
                await PushNotifications.register();
                this.initialized = true;
                console.log('✅ Push notifications initialized');
            } else {
                console.warn('⚠️ Push notification permission denied');
            }

            // Setup listeners
            this.setupListeners(userId);
        } catch (error) {
            console.error('❌ Push notification initialization failed:', error);
        }
    }

    /**
     * Setup notification event listeners
     */
    private setupListeners(userId: string) {
        // Handle successful registration
        PushNotifications.addListener('registration', async (token: Token) => {
            console.log('📱 Push token:', token.value);

            // Save token to Supabase
            await this.saveToken(userId, token.value);
        });

        // Handle registration error
        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('❌ Push registration error:', error);
        });

        // Handle notification received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('🔔 Notification received (foreground):', notification);

            // Show in-app notification
            this.showInAppNotification(notification);
        });

        // Handle notification tap (app in background/closed)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
            console.log('👆 Notification tapped:', notification);

            // Navigate to relevant screen based on notification type
            this.handleNotificationTap(notification.notification);
        });
    }

    /**
     * Save FCM token to Supabase
     */
    private async saveToken(userId: string, token: string) {
        try {
            const platform = Capacitor.getPlatform(); // 'ios' or 'android'

            const { error } = await supabase
                .from('push_tokens')
                .upsert({
                    user_id: userId,
                    token: token,
                    platform: platform
                }, {
                    onConflict: 'user_id,token'
                });

            if (error) {
                console.error('Failed to save push token:', error);
            } else {
                console.log('✅ Push token saved to database');
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    /**
     * Show in-app notification (when app is in foreground)
     */
    private showInAppNotification(notification: PushNotificationSchema) {
        // You can use a toast library or custom component here
        const notificationElement = document.createElement('div');
        notificationElement.className = 'in-app-notification';
        notificationElement.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        z-index: 9999;
        max-width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
      ">
        <strong>${notification.title}</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px;">${notification.body}</p>
      </div>
    `;

        document.body.appendChild(notificationElement);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notificationElement.remove();
        }, 4000);
    }

    /**
     * Handle notification tap navigation
     */
    private handleNotificationTap(notification: any) {
        const data = notification.data;

        if (!data) return;

        // Navigate based on notification type
        switch (data.type) {
            case 'match':
                window.location.href = '/matches';
                break;
            case 'message':
                window.location.href = `/chat/${data.partnerId}`;
                break;
            case 'request':
                window.location.href = '/matches?tab=requests';
                break;
            case 'booking':
                window.location.href = '/bookings';
                break;
            case 'club':
                window.location.href = `/club/${data.clubId}`;
                break;
            default:
                window.location.href = '/';
        }
    }

    /**
     * Remove token when user logs out
     */
    async removeToken(userId: string) {
        try {
            const { error } = await supabase
                .from('push_tokens')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error('Failed to remove push token:', error);
            } else {
                console.log('✅ Push token removed');
            }
        } catch (error) {
            console.error('Error removing token:', error);
        }
    }

    /**
     * Get notification permission status
     */
    async getPermissionStatus() {
        if (!isNative) return 'not_available';

        try {
            const permStatus = await PushNotifications.checkPermissions();
            return permStatus.receive;
        } catch (error) {
            console.error('Error checking permission:', error);
            return 'denied';
        }
    }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Helper function to send notification via Supabase Edge Function
export async function sendPushNotification(payload: NotificationPayload) {
    try {
        // This will call a Supabase Edge Function that sends FCM notifications
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: payload
        });

        if (error) {
            console.error('Failed to send push notification:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
    }
}
