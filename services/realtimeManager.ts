import { supabase } from './supabase';
import { chatService } from './chatService';
import { matchService } from './matchService';
import { requestService } from './requestService';
import { clubService } from './clubService';
import { presenceService } from './presenceService';

/**
 * Central Real-time Subscription Manager
 * Manages all Supabase real-time subscriptions in one place
 * Prevents memory leaks and duplicate subscriptions
 */

// Maximum subscriptions before warning about potential leak
const MAX_SUBSCRIPTIONS = 20;

export class RealtimeManager {
    private subscriptions: Map<string, () => void> = new Map();

    /**
     * Check for subscription leaks and warn if threshold exceeded
     */
    private checkForLeaks(): void {
        if (this.subscriptions.size > MAX_SUBSCRIPTIONS) {
            console.warn(
                `⚠️ SUBSCRIPTION LEAK WARNING: ${this.subscriptions.size} active subscriptions (max: ${MAX_SUBSCRIPTIONS})`,
                '\nActive subscriptions:', this.listActive()
            );
        }
    }

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

        // Check for potential leaks
        this.checkForLeaks();

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
     * Subscribe to club join requests (for club owners/admins)
     */
    subscribeToClubJoinRequests(clubId: string, callback: (requests: any[]) => void): string {
        const key = `club_join_requests:${clubId}`;

        this.unsubscribe(key);

        const unsubscribe = clubService.subscribeToClubJoinRequests(clubId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to events updates
     */
    subscribeToEvents(callback: (events: any[]) => void): string {
        const key = `events:all`;

        this.unsubscribe(key);

        const channel = supabase
            .channel('events-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'events'
                },
                async () => {
                    const { data } = await supabase
                        .from('events')
                        .select('*, host:users!events_host_id_fkey(*)')
                        .order('date', { ascending: true });
                    callback(data || []);
                }
            )
            .subscribe();

        this.subscriptions.set(key, () => channel.unsubscribe());

        return key;
    }

    /**
     * Subscribe to trainer bookings
     */
    subscribeToBookings(trainerId: string, callback: (bookings: any[]) => void): string {
        const key = `bookings:${trainerId}`;

        this.unsubscribe(key);

        const channel = supabase
            .channel(`bookings-${trainerId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `trainer_id=eq.${trainerId}`
                },
                async () => {
                    const { data } = await supabase
                        .from('bookings')
                        .select('*, user:users(*)')
                        .eq('trainer_id', trainerId)
                        .order('scheduled_date', { ascending: true });
                    callback(data || []);
                }
            )
            .subscribe();

        this.subscriptions.set(key, () => channel.unsubscribe());

        return key;
    }

    /**
     * Subscribe to typing indicator for a chat
     */
    subscribeToTyping(fromUserId: string, callback: (isTyping: boolean) => void): string {
        const key = `typing:${fromUserId}`;

        this.unsubscribe(key);

        const unsubscribe = chatService.subscribeToTyping(fromUserId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to user online presence
     */
    subscribeToUserPresence(userId: string, callback: (state: any) => void): string {
        const key = `presence:${userId}`;

        this.unsubscribe(key);

        const unsubscribe = presenceService.subscribeToUserPresence(userId, callback);
        this.subscriptions.set(key, unsubscribe);

        return key;
    }

    /**
     * Subscribe to event attendees updates
     */
    subscribeToEventAttendees(eventId: string, callback: (attendees: any[]) => void): string {
        const key = `event-attendees:${eventId}`;

        this.unsubscribe(key);

        const channel = supabase
            .channel(`event-attendees-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'event_attendees',
                    filter: `event_id=eq.${eventId}`
                },
                async () => {
                    const { data } = await supabase
                        .from('event_attendees')
                        .select('*, user:users(*)')
                        .eq('event_id', eventId);
                    callback(data || []);
                }
            )
            .subscribe();

        this.subscriptions.set(key, () => channel.unsubscribe());

        return key;
    }

    /**
     * Unsubscribe from a specific channel
     */
    unsubscribe(key: string): void {
        const unsubscribeFn = this.subscriptions.get(key);
        if (typeof unsubscribeFn === 'function') {
            try {
                unsubscribeFn();
                console.log(`Unsubscribed from: ${key}`);
            } catch (err) {
                console.error(`Error unsubscribing from ${key}:`, err);
            }
            this.subscriptions.delete(key);
        } else if (unsubscribeFn !== undefined) {
            console.warn(`RealtimeManager: Subscription for ${key} is not a function (${typeof unsubscribeFn})`, unsubscribeFn);
            this.subscriptions.delete(key);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll(): void {
        this.subscriptions.forEach((unsubscribe, key) => {
            if (typeof unsubscribe === 'function') {
                try {
                    unsubscribe();
                } catch (err) {
                    console.error(`Error unsubscribing all (${key}):`, err);
                }
            }
        });
        this.subscriptions.clear();
        console.log('Unsubscribed from all channels');
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
if (import.meta.env.MODE === 'development') {
    (window as any).realtimeManager = realtimeManager;
    console.log('💡 Realtime Manager available at window.realtimeManager');
}
