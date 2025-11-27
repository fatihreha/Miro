/**
 * Advanced Caching Manager
 * Client-side cache with TTL and invalidation support
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class CacheManager {
    private cache: Map<string, CacheItem<any>> = new Map();

    /**
     * Get item from cache
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Set item in cache with TTL
     */
    set<T>(key: string, data: T, ttl: number = 300000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Invalidate specific key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all keys matching pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        Array.from(this.cache.keys()).forEach(key => {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        });
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export const cacheManager = new CacheManager();

// Cache key builders
export const CACHE_KEYS = {
    USER: (id: string) => `user:${id}`,
    MATCHES: (userId: string) => `matches:${userId}`,
    CLUBS: (filter?: string) => `clubs:${filter || 'all'}`,
    TRAINERS: (filter?: string) => `trainers:${filter || 'all'}`,
    USER_STATS: (userId: string) => `stats:${userId}`,
    LEADERBOARD: (type: string) => `leaderboard:${type}`
};

// Default TTLs (in milliseconds)
export const CACHE_TTL = {
    USER_PROFILE: 5 * 60 * 1000,    // 5 minutes
    MATCHES: 2 * 60 * 1000,          // 2 minutes
    CLUBS: 10 * 60 * 1000,           // 10 minutes
    TRAINERS: 10 * 60 * 1000,        // 10 minutes
    STATS: 5 * 60 * 1000,            // 5 minutes
    LEADERBOARD: 1 * 60 * 1000       // 1 minute
};
