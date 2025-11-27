/**
 * Premium Feature Gating Utility
 * 
 * Controls access to premium features based on subscription status
 */

export const PREMIUM_FEATURES = {
    UNLIMITED_SWIPES: 'unlimited_swipes',
    ADVANCED_FILTERS: 'advanced_filters',
    TRAINER_BOOKING: 'trainer_booking',
    EVENT_PRIORITY: 'event_priority',
    WHO_LIKES_YOU: 'who_likes_you',
    NO_ADS: 'no_ads',
    PREMIUM_BADGE: 'premium_badge',
} as const;

export const PREMIUM_LIMITS = {
    FREE_DAILY_SWIPES: 10,
    FREE_MESSAGES_PER_DAY: 50,
    FREE_CLUB_MEMBERSHIPS: 3,
} as const;

export class PremiumGate {
    /**
     * Check if user has premium access
     */
    static hasPremium(user: any): boolean {
        return user?.isPremium === true;
    }

    /**
     * Check if user can swipe (daily limit for free users)
     */
    static canSwipe(user: any, dailySwipesUsed: number): boolean {
        if (this.hasPremium(user)) {
            return true; // Unlimited for premium
        }

        return dailySwipesUsed < PREMIUM_LIMITS.FREE_DAILY_SWIPES;
    }

    /**
     * Get remaining swipes for free users
     */
    static getRemainingSwipes(user: any, dailySwipesUsed: number): number | 'unlimited' {
        if (this.hasPremium(user)) {
            return 'unlimited';
        }

        const remaining = PREMIUM_LIMITS.FREE_DAILY_SWIPES - dailySwipesUsed;
        return Math.max(0, remaining);
    }

    /**
     * Check if user can use advanced filters
     */
    static canUseAdvancedFilters(user: any): boolean {
        return this.hasPremium(user);
    }

    /**
     * Check if user can book trainers
     */
    static canBookTrainer(user: any): boolean {
        return this.hasPremium(user);
    }

    /**
     * Check if user can see who liked them
     */
    static canSeeWhoLikesYou(user: any): boolean {
        return this.hasPremium(user);
    }

    /**
     * Check if user can join more clubs
     */
    static canJoinClub(user: any, currentClubCount: number): boolean {
        if (this.hasPremium(user)) {
            return true;
        }

        return currentClubCount < PREMIUM_LIMITS.FREE_CLUB_MEMBERSHIPS;
    }

    /**
     * Get premium feature description for upgrade prompt
     */
    static getFeatureDescription(feature: string): string {
        const descriptions: Record<string, string> = {
            [PREMIUM_FEATURES.UNLIMITED_SWIPES]: 'Swipe unlimited times per day',
            [PREMIUM_FEATURES.ADVANCED_FILTERS]: 'Filter by location, age, and skill level',
            [PREMIUM_FEATURES.TRAINER_BOOKING]: 'Book sessions with personal trainers',
            [PREMIUM_FEATURES.EVENT_PRIORITY]: 'Get early access to events',
            [PREMIUM_FEATURES.WHO_LIKES_YOU]: 'See who liked you before matching',
            [PREMIUM_FEATURES.NO_ADS]: 'Enjoy ad-free experience',
            [PREMIUM_FEATURES.PREMIUM_BADGE]: 'Show premium badge on your profile',
        };

        return descriptions[feature] || 'Premium feature';
    }

    /**
     * Show upgrade prompt for blocked feature
     */
    static showUpgradePrompt(feature: string): {
        title: string;
        message: string;
        ctaText: string;
    } {
        return {
            title: 'Premium Feature',
            message: this.getFeatureDescription(feature),
            ctaText: 'Upgrade to Premium',
        };
    }
}
