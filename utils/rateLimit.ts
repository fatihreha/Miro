/**
 * Rate Limiting Utility
 * Prevents API abuse by limiting requests per time window
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

class RateLimiter {
    private calls: Map<string, number[]> = new Map();

    /**
     * Check if request is allowed
     */
    canMakeRequest(
        key: string,
        config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
    ): boolean {
        const now = Date.now();
        const calls = this.calls.get(key) || [];

        // Filter out old calls outside the window
        const recentCalls = calls.filter(timestamp => now - timestamp < config.windowMs);

        if (recentCalls.length >= config.maxRequests) {
            return false;
        }

        // Add current call
        recentCalls.push(now);
        this.calls.set(key, recentCalls);
        return true;
    }

    /**
     * Get remaining requests in window
     */
    getRemainingRequests(
        key: string,
        config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
    ): number {
        const now = Date.now();
        const calls = this.calls.get(key) || [];
        const recentCalls = calls.filter(timestamp => now - timestamp < config.windowMs);
        return Math.max(0, config.maxRequests - recentCalls.length);
    }

    /**
     * Reset rate limit for a key
     */
    reset(key: string): void {
        this.calls.delete(key);
    }

    /**
     * Clear all rate limits
     */
    clearAll(): void {
        this.calls.clear();
    }
}

export const rateLimiter = new RateLimiter();

// Preset configurations
export const RATE_LIMITS = {
    SWIPE: { maxRequests: 100, windowMs: 60000 }, // 100 swipes per minute
    MESSAGE: { maxRequests: 30, windowMs: 60000 }, // 30 messages per minute
    SEARCH: { maxRequests: 20, windowMs: 60000 }, // 20 searches per minute
    UPLOAD: { maxRequests: 5, windowMs: 60000 }, // 5 uploads per minute
    API_CALL: { maxRequests: 50, windowMs: 60000 } // 50 API calls per minute
};
