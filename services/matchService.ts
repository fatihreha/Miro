import { supabase } from './supabase';
import { User } from '../types';
import { calculateCompatibility } from './geminiService';
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimit';

/**
 * Real-time Match & Swipe Service using Supabase
 * Features:
 * - Swipe tracking (like/pass/superlike)
 * - Automatic match detection (database trigger)
 * - Real-time match notifications
 * - Match management
 * - Rate limiting to prevent abuse
 */

export class MatchService {
    private activeSubscriptions: Map<string, any> = new Map();

    /**
     * Record a swipe action with server-side validation and race condition handling
     * Includes rate limiting to prevent abuse
     */
    async swipeUser(
        swiperId: string,
        swipedId: string,
        action: 'like' | 'pass' | 'superlike'
    ): Promise<{ success: boolean; matched: boolean; matchData?: any; error?: string }> {
        try {
            // Rate limiting check (client-side, in addition to server-side daily limit)
            if (!rateLimiter.canMakeRequest(`swipe_${swiperId}`, RATE_LIMITS.SWIPE)) {
                return {
                    success: false,
                    matched: false,
                    error: 'Çok hızlı işlem yapıyorsunuz. Lütfen biraz bekleyin.'
                };
            }

            // Step 1: Server-side daily limit check (prevent client-side bypass)
            if (!await this.checkSwipeLimit(swiperId)) {
                return {
                    success: false,
                    matched: false,
                    error: 'Daily swipe limit reached. Upgrade to Premium for unlimited swipes.'
                };
            }

            // Step 2: Check if already swiped (prevent duplicate swipes)
            const { data: existingSwipe } = await supabase
                .from('swipes')
                .select('id, action')
                .eq('swiper_id', swiperId)
                .eq('swiped_id', swipedId)
                .maybeSingle();

            if (existingSwipe) {
                console.log('Already swiped:', existingSwipe);
                return {
                    success: false,
                    matched: false,
                    error: 'You already swiped this user'
                };
            }

            // Step 3: Generate unique swipe ID (idempotency)
            const swipeId = `swipe_${swiperId}_${swipedId}_${Date.now()}`;

            // Step 4: Record the swipe
            const { data: swipeData, error: swipeError } = await supabase
                .from('swipes')
                .insert({
                    id: swipeId,
                    swiper_id: swiperId,
                    swiped_id: swipedId,
                    action: action,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (swipeError) {
                console.error('Error recording swipe:', swipeError);

                // Check if duplicate key error
                if (swipeError.code === '23505') {
                    return {
                        success: false,
                        matched: false,
                        error: 'Swipe already recorded'
                    };
                }

                this.saveLocalSwipe(swiperId, swipedId, action);
                return { success: false, matched: false, error: 'Failed to record swipe' };
            }

            // Step 5: Decrement swipe count (server-side)
            await this.decrementSwipeCount(swiperId);

            // Step 6: Check if this created a match (only for likes)
            if (action === 'like' || action === 'superlike') {
                const matchResult = await this.checkAndCreateMatch(swiperId, swipedId);

                if (matchResult.matched) {
                    return {
                        success: true,
                        matched: true,
                        matchData: matchResult.matchData
                    };
                }
            }

            return { success: true, matched: false };
        } catch (error: any) {
            console.error('Swipe error:', error);
            this.saveLocalSwipe(swiperId, swipedId, action);
            return {
                success: false,
                matched: false,
                error: error.message || 'Unexpected error'
            };
        }
    }

    /**
     * Check daily swipe limit (server-side validation)
     */
    private async checkSwipeLimit(userId: string): Promise<boolean> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('is_premium, daily_swipes, last_swipe_reset')
                .eq('id', userId)
                .single();

            if (error || !user) {
                console.error('Failed to check swipe limit:', error);
                return false; // Fail safe - don't allow if can't verify
            }

            // Premium users have unlimited swipes
            if (user.is_premium) {
                return true;
            }

            // Reset swipes if last reset was yesterday
            const lastReset = user.last_swipe_reset ? new Date(user.last_swipe_reset) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!lastReset || lastReset < today) {
                // Reset swipes for new day
                await supabase
                    .from('users')
                    .update({
                        daily_swipes: 10,
                        last_swipe_reset: today.toISOString()
                    })
                    .eq('id', userId);

                return true;
            }

            // Check if user has swipes remaining
            return (user.daily_swipes || 0) > 0;
        } catch (error) {
            console.error('Swipe limit check error:', error);
            return false;
        }
    }

    /**
     * Decrement swipe count (server-side)
     */
    private async decrementSwipeCount(userId: string): Promise<void> {
        try {
            await supabase.rpc('decrement_daily_swipes', { user_id: userId });
        } catch (error) {
            console.error('Failed to decrement swipe count:', error);
        }
    }

    /**
     * Check for mutual like and create match (with race condition handling)
     */
    private async checkAndCreateMatch(
        userId1: string,
        userId2: string
    ): Promise<{ matched: boolean; matchData?: any }> {
        try {
            // Check if the other user also liked us
            const { data: mutualLike, error: checkError } = await supabase
                .from('swipes')
                .select('id, action')
                .eq('swiper_id', userId2)
                .eq('swiped_id', userId1)
                .in('action', ['like', 'superlike'])
                .maybeSingle();

            if (!mutualLike || checkError) {
                return { matched: false };
            }

            console.log('🎉 Mutual like detected!');

            // Use database function to create match (handles race conditions via unique constraint)
            const { data: matchData, error: matchError } = await supabase
                .rpc('create_match_if_not_exists', {
                    p_user1_id: userId1,
                    p_user2_id: userId2
                })
                .single();

            if (matchError) {
                console.error('Match creation error:', matchError);

                // Might already exist (race condition) - fetch it
                const { data: existingMatch } = await supabase
                    .from('matches')
                    .select('*')
                    .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
                    .eq('status', 'active')
                    .maybeSingle();

                if (existingMatch) {
                    return { matched: true, matchData: existingMatch };
                }

                return { matched: false };
            }

            console.log('✅ Match created:', (matchData as any)?.id);
            return { matched: true, matchData };

        } catch (error) {
            console.error('Check and create match error:', error);
            return { matched: false };
        }
    }

    /**
     * Create a match with AI compatibility analysis
     */
    async createMatch(user1Id: string, user2Id: string): Promise<any> {
        try {
            // Fetch both user profiles
            const { data: users } = await supabase
                .from('users')
                .select('*')
                .in('id', [user1Id, user2Id]);

            let compatibilityData: any = {};

            if (users && users.length === 2) {
                // Calculate AI compatibility
                const aiResult = await calculateCompatibility(
                    this.formatUser(users[0]),
                    this.formatUser(users[1])
                );
                compatibilityData = {
                    compatibility_score: aiResult.matchPercentage,
                    match_reason: aiResult.matchReason,
                    key_factors: aiResult.keyFactors
                };
            }

            const { data, error } = await supabase
                .from('matches')
                .insert({
                    user1_id: user1Id,
                    user2_id: user2Id,
                    ...compatibilityData
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating match:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Create match error:', error);
            return null;
        }
    }

    /**
     * Get all matches for a user
     */
    async getMatches(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('matches')
                .select(`
          *,
          user1:users!matches_user1_id_fkey(*),
          user2:users!matches_user2_id_fkey(*)
        `)
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .eq('is_active', true)
                .order('matched_at', { ascending: false });

            if (error) {
                console.error('Error fetching matches:', error);
                return this.getLocalMatches(userId);
            }

            // Format matches to include partner data
            return (data || []).map((match: any) => {
                const partner = match.user1_id === userId ? match.user2 : match.user1;
                return {
                    id: match.id,
                    matchedAt: new Date(match.matched_at),
                    compatibilityScore: match.compatibility_score,
                    matchReason: match.match_reason,
                    keyFactors: match.key_factors,
                    partner: this.formatUser(partner)
                };
            });
        } catch (error) {
            console.error('Get matches error:', error);
            return this.getLocalMatches(userId);
        }
    }

    /**
     * Get users who liked you (Premium feature)
     */
    async getWhoLikesYou(userId: string): Promise<User[]> {
        try {
            const { data, error } = await supabase
                .from('swipes')
                .select(`
          *,
          swiper:users!swipes_swiper_id_fkey(*)
        `)
                .eq('swiped_id', userId)
                .in('action', ['like', 'superlike']);

            if (error) {
                console.error('Error fetching likes:', error);
                return [];
            }

            // Filter out users we've already swiped on
            const { data: mySwipes } = await supabase
                .from('swipes')
                .select('swiped_id')
                .eq('swiper_id', userId);

            const mySwipedIds = new Set(mySwipes?.map((s: any) => s.swiped_id) || []);

            return (data || [])
                .filter((like: any) => !mySwipedIds.has(like.swiper_id))
                .map((like: any) => this.formatUser(like.swiper));
        } catch (error) {
            console.error('Get who likes you error:', error);
            return [];
        }
    }

    /**
     * Get match by ID
     */
    async getMatchById(matchId: string, userId: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('matches')
                .select(`
          *,
          user1:users!matches_user1_id_fkey(*),
          user2:users!matches_user2_id_fkey(*)
        `)
                .eq('id', matchId)
                .single();

            if (error) {
                console.error('Error fetching match:', error);
                return null;
            }

            const partner = data.user1_id === userId ? data.user2 : data.user1;
            return {
                id: data.id,
                matchedAt: new Date(data.matched_at),
                compatibilityScore: data.compatibility_score,
                matchReason: data.match_reason,
                keyFactors: data.key_factors,
                isActive: data.is_active,
                partner: this.formatUser(partner)
            };
        } catch (error) {
            console.error('Get match by ID error:', error);
            return null;
        }
    }

    /**
     * Unmatch with a user
     */
    async unmatch(matchId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('matches')
                .update({ is_active: false })
                .eq('id', matchId);

            if (error) {
                console.error('Error unmatching:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Unmatch error:', error);
            return false;
        }
    }

    /**
     * Get potential matches with filters
     */
    async getPotentialMatches(
        userId: string,
        filters?: {
            maxDistance?: number;
            maxAge?: number;
            minAge?: number;
            gender?: string;
            sports?: string[];
            levels?: string[];
        }
    ): Promise<User[]> {
        try {
            // Get users we've already swiped on
            const { data: swipedUsers } = await supabase
                .from('swipes')
                .select('swiped_id')
                .eq('swiper_id', userId);

            const swipedIds = swipedUsers?.map((s: any) => s.swiped_id) || [];

            // Build query
            let query = supabase
                .from('users')
                .select('*')
                .neq('id', userId) // Not the current user
                .not('id', 'in', `(${swipedIds.join(',') || 'null'})`) // Haven't swiped yet
                .limit(50);

            // Apply filters
            if (filters?.maxAge) {
                query = query.lte('age', filters.maxAge);
            }
            if (filters?.minAge) {
                query = query.gte('age', filters.minAge);
            }
            if (filters?.gender && filters.gender !== 'Everyone') {
                query = query.eq('gender', filters.gender);
            }
            if (filters?.levels && filters.levels.length > 0) {
                query = query.in('skill_level', filters.levels);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching potential matches:', error);
                return [];
            }

            let users = (data || []).map(this.formatUser);

            // Apply interest filter (can't do in SQL with array columns easily)
            if (filters?.sports && filters.sports.length > 0) {
                users = users.filter((user: User) =>
                    user.interests.some((interest) => filters.sports?.includes(interest))
                );
            }

            return users;
        } catch (error) {
            console.error('Get potential matches error:', error);
            return [];
        }
    }

    /**
     * Subscribe to new matches in real-time
     */
    subscribeToMatches(userId: string, callback: (matches: any[]) => void): () => void {
        const channelName = `matches:${userId}`;

        // Initial fetch
        this.getMatches(userId).then(callback);

        // Subscribe to new matches
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                    filter: `user1_id=eq.${userId}`
                },
                () => {
                    console.log('New match!');
                    this.getMatches(userId).then(callback);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                    filter: `user2_id=eq.${userId}`
                },
                () => {
                    console.log('New match!');
                    this.getMatches(userId).then(callback);
                }
            )
            .subscribe();

        this.activeSubscriptions.set(channelName, channel);

        return () => {
            if (channel && typeof channel.unsubscribe === 'function') {
                channel.unsubscribe();
            }
            this.activeSubscriptions.delete(channelName);
        };
    }

    /**
     * Format database user to app User type
     */
    private formatUser(dbUser: any): User {
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            age: dbUser.age,
            gender: dbUser.gender,
            bio: dbUser.bio,
            location: dbUser.location,
            avatarUrl: dbUser.avatar_url,
            interests: dbUser.interests || [],
            level: dbUser.skill_level,
            workoutTimePreference: dbUser.workout_time_preference,
            isPremium: dbUser.is_premium,
            isTrainer: dbUser.is_pro_trainer,
            xp: dbUser.xp_points,
            userLevel: dbUser.user_level
        };
    }

    // ============ OFFLINE FALLBACK (localStorage) ============

    private readonly SWIPES_KEY = 'sportpulse_swipes_v2';
    private readonly MATCHES_KEY = 'sportpulse_matches_v2';

    private saveLocalSwipe(swiperId: string, swipedId: string, action: string): void {
        try {
            const swipes = JSON.parse(localStorage.getItem(this.SWIPES_KEY) || '[]');
            swipes.push({ swiperId, swipedId, action, timestamp: new Date().toISOString() });
            localStorage.setItem(this.SWIPES_KEY, JSON.stringify(swipes));
        } catch (e) {
            console.error('Error saving local swipe:', e);
        }
    }

    private getLocalMatches(userId: string): any[] {
        try {
            const matches = JSON.parse(localStorage.getItem(this.MATCHES_KEY) || '[]');
            return matches.filter(
                (m: any) => m.user1Id === userId || m.user2Id === userId
            );
        } catch (e) {
            console.error('Error getting local matches:', e);
            return [];
        }
    }

    /**
     * Cleanup subscriptions
     */
    cleanup(): void {
        this.activeSubscriptions.forEach((channel) => {
            channel.unsubscribe();
        });
        this.activeSubscriptions.clear();
    }
}

// Export singleton
export const matchService = new MatchService();

// Cleanup on unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        matchService.cleanup();
    });
}
