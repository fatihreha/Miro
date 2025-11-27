import { supabase } from './supabase';
import { chatService } from './chatService';
import { matchService } from './matchService';
import { requestService } from './requestService';
import { clubService } from './clubService';

/**
 * Central Real-time Subscription Manager
 * Manages all Supabase real-time subscriptions in one place
 * Prevents memory leaks and duplicate subscriptions
 */

export class RealtimeManager {
    private subscriptions: Map<string, () => void> = new Map();

    /**
     * Subscribe to messages for a specific conversation
     */
    subscribeToMessages(
        userId: string,
        partnerId: string,
        callback: (messages: any[]) => void
    ): string {
        const key = `messages:${userId}:${partnerId}`;

        // Unsubscribe existing if any
        this.unsubscribe(key);

        // Create new subscription
        const unsubscribe = chatService.subscribeToMessages(userId, partnerId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to matches for a user
     */
    subscribeToMatches(userId: string, callback: (matches: any[]) => void): string {
        const key = `matches:${userId}`;

        this.unsubscribe(key);

        const unsubscribe = matchService.subscribeToMatches(userId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to workout requests
     */
    subscribeToRequests(userId: string, callback: (requests: any[]) => void): string {
        const key = `requests:${userId}`;

        this.unsubscribe(key);

        const unsubscribe = requestService.subscribeToRequests(userId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to club updates
     */
    subscribeToClub(clubId: string, callback: () => void): string {
        const key = `club:${clubId}`;

        this.unsubscribe(key);

        const unsubscribe = clubService.subscribeToClubUpdates(clubId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Unsubscribe from a specific channel
     */
    unsubscribe(key: string): void {
        const unsubscribeFn = this.subscriptions.get(key);
        if (unsubscribeFn) {
            unsubscribeFn();
            this.subscriptions.delete(key);
            console.log(`Unsubscribed from: ${key}`);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll(): void {
        this.subscriptions.forEach((unsubscribe, key) => {
            unsubscribe();
            console.log(`Unsubscribed from: ${key}`);
        });
        this.subscriptions.clear();
    }

    /**
     * Get active subscription count
     */
    getActiveCount(): number {
        return this.subscriptions.size;
    }

    /**
     * List all active subscriptions
     */
    listActive(): string[] {
        return Array.from(this.subscriptions.keys());
    }
}

// Export singleton
export const realtimeManager = new RealtimeManager();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        realtimeManager.unsubscribeAll();
    });

    // Cleanup on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Page hidden - maintaining subscriptions');
            // Keep subscriptions alive for quick return
        } else {
            console.log('Page visible - subscriptions active:', realtimeManager.getActiveCount());
        }
    });
}

// Development helper
if (process.env.NODE_ENV === 'development') {
    (window as any).realtimeManager = realtimeManager;
    console.log('💡 Realtime Manager available at window.realtimeManager');
}
