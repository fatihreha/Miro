/**
 * Analytics Tracking Utility
 * Track user behavior and events for analytics services
 */

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    timestamp?: Date;
}

class Analytics {
    private events: AnalyticsEvent[] = [];
    private userId: string | null = null;

    /**
     * Track an event
     */
    track(event: string, properties?: Record<string, any>): void {
        const analyticsEvent: AnalyticsEvent = {
            name: event,
            properties,
            timestamp: new Date()
        };

        this.events.push(analyticsEvent);
        console.log('[Analytics]', event, properties);

        // Send to analytics service (PostHog, Mixpanel, etc.)
        // Example for PostHog:
        // if (typeof window !== 'undefined' && (window as any).posthog) {
        //   (window as any).posthog.capture(event, properties);
        // }

        // Example for Mixpanel:
        // if (typeof window !== 'undefined' && (window as any).mixpanel) {
        //   (window as any).mixpanel.track(event, properties);
        // }
    }

    /**
     * Identify user
     */
    identify(userId: string, traits?: Record<string, any>): void {
        this.userId = userId;
        console.log('[Analytics] Identify', userId, traits);

        // Example for PostHog:
        // if (typeof window !== 'undefined' && (window as any).posthog) {
        //   (window as any).posthog.identify(userId, traits);
        // }
    }

    /**
     * Track page view
     */
    page(name: string, properties?: Record<string, any>): void {
        this.track('Page View', { page: name, ...properties });
    }

    /**
     * Get tracked events
     */
    getEvents(): AnalyticsEvent[] {
        return this.events;
    }

    /**
     * Clear tracked events
     */
    clearEvents(): void {
        this.events = [];
    }
}

export const analytics = new Analytics();

// Common event names
export const ANALYTICS_EVENTS = {
    // User Actions
    SIGN_UP: 'Sign Up',
    LOGIN: 'Login',
    LOGOUT: 'Logout',

    // Swipe Actions
    SWIPE_LIKE: 'Swipe Like',
    SWIPE_PASS: 'Swipe Pass',
    SWIPE_SUPERLIKE: 'Swipe Superlike',

    // Match Events
    MATCH_CREATED: 'Match Created',
    MATCH_AI_ANALYZED: 'Match AI Analyzed',

    // Chat Events
    MESSAGE_SENT: 'Message Sent',
    MESSAGE_RECEIVED: 'Message Received',
    AI_ICEBREAKER_USED: 'AI Icebreaker Used',
    AI_PLAN_GENERATED: 'AI Plan Generated',

    // Request Events
    WORKOUT_REQUEST_SENT: 'Workout Request Sent',
    WORKOUT_REQUEST_ACCEPTED: 'Workout Request Accepted',
    WORKOUT_REQUEST_REJECTED: 'Workout Request Rejected',

    // Club Events
    CLUB_JOINED: 'Club Joined',
    CLUB_LEFT: 'Club Left',
    CLUB_CREATED: 'Club Created',

    // Trainer Events
    TRAINER_BOOKED: 'Trainer Session Booked',
    TRAINER_BOOKING_CANCELLED: 'Trainer Booking Cancelled',

    // Gamification
    XP_EARNED: 'XP Earned',
    BADGE_UNLOCKED: 'Badge Unlocked',
    LEVEL_UP: 'Level Up',

    // Premium
    PREMIUM_VIEWED: 'Premium Page Viewed',
    PREMIUM_PURCHASED: 'Premium Purchased'
};
