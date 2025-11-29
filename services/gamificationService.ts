import { supabase } from './supabase';

/**
 * Gamification Service
 * Features:
 * - XP tracking
 * - Badge awards
 * - Leaderboards
 * - Achievement system
 */

export class GamificationService {
    /**
     * Add XP to user
     */
    async addXP(userId: string, amount: number, reason?: string): Promise<number> {
        try {
            // Get current XP
            const { data: user } = await supabase
                .from('users')
                .select('xp_points, user_level')
                .eq('id', userId)
                .single();

            if (!user) return 0;

            const newXP = (user.xp_points || 0) + amount;
            const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level

            // Update user
            await supabase
                .from('users')
                .update({
                    xp_points: newXP,
                    user_level: newLevel
                })
                .eq('id', userId);

            console.log(`Added ${amount} XP to user ${userId}. Reason: ${reason || 'N/A'}`);

            return newXP;
        } catch (error) {
            console.error('Add XP error:', error);
            return 0;
        }
    }

    /**
     * Get user XP and Level
     */
    async getUserXP(userId: string): Promise<{ total_xp: number, level: number } | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('xp_points, user_level')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user XP:', error);
                return null;
            }

            return {
                total_xp: user.xp_points || 0,
                level: user.user_level || 1
            };
        } catch (error) {
            console.error('Get user XP error:', error);
            return null;
        }
    }

    /**
     * Award badge to user
     */
    async awardBadge(userId: string, badgeId: string): Promise<boolean> {
        try {
            // Check if user already has badge
            const { data: existing } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', userId)
                .eq('badge_id', badgeId)
                .single();

            if (existing) {
                console.log('User already has this badge');
                return false;
            }

            // Award badge
            const { error } = await supabase
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badgeId
                });

            if (error) {
                console.error('Error awarding badge:', error);
                return false;
            }

            // Get badge XP reward
            const { data: badge } = await supabase
                .from('badges')
                .select('xp_reward')
                .eq('id', badgeId)
                .single();

            if (badge?.xp_reward) {
                await this.addXP(userId, badge.xp_reward, 'Badge awarded');
            }

            return true;
        } catch (error) {
            console.error('Award badge error:', error);
            return false;
        }
    }

    /**
     * Get user badges
     */
    async getUserBadges(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('user_badges')
                .select(`
          *,
          badge:badges(*)
        `)
                .eq('user_id', userId)
                .order('earned_at', { ascending: false });

            if (error) {
                console.error('Error fetching badges:', error);
                return [];
            }

            return (data || []).map((ub: any) => ub.badge);
        } catch (error) {
            console.error('Get badges error:', error);
            return [];
        }
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(type: 'xp' | 'level' = 'xp', limit: number = 10): Promise<any[]> {
        try {
            const orderBy = type === 'xp' ? 'xp_points' : 'user_level';

            const { data, error } = await supabase
                .from('users')
                .select('id, name, avatar_url, xp_points, user_level')
                .order(orderBy, { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching leaderboard:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return [];
        }
    }

    /**
     * Get user rank
     */
    async getUserRank(userId: string): Promise<number> {
        try {
            // Get all users sorted by XP
            const { data: users } = await supabase
                .from('users')
                .select('id, xp_points')
                .order('xp_points', { ascending: false });

            if (!users) return 0;

            const rank = users.findIndex((u: any) => u.id === userId) + 1;
            return rank;
        } catch (error) {
            console.error('Get rank error:', error);
            return 0;
        }
    }

    /**
     * Check and award automatic badges
     */
    async checkBadgeCriteria(userId: string): Promise<void> {
        try {
            // Get user stats
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (!user) return;

            // Get all available badges
            const { data: badges } = await supabase
                .from('badges')
                .select('*');

            // Badge logic examples
            for (const badge of badges || []) {
                switch (badge.name) {
                    case 'Marathon Runner':
                        // Award if user has 42+ completed workouts
                        const { count: workouts } = await supabase
                            .from('workout_requests')
                            .select('*', { count: 'exact', head: true })
                            .eq('from_user_id', userId)
                            .eq('status', 'completed');

                        if (workouts && workouts >= 42) {
                            await this.awardBadge(userId, badge.id);
                        }
                        break;

                    case 'Social Butterfly':
                        // Award if 10+ matches
                        const { count: matches } = await supabase
                            .from('matches')
                            .select('*', { count: 'exact', head: true })
                            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                            .eq('is_active', true);

                        if (matches && matches >= 10) {
                            await this.awardBadge(userId, badge.id);
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('Check badge criteria error:', error);
        }
    }
}

export const gamificationService = new GamificationService();
