import { supabase, storageHelpers } from './supabase';
import { User, SportType } from '../types';

/**
 * User Profile Service
 * Features:
 * - Profile management
 * - Photo uploads to Supabase Storage
 * - User search with filters
 * - Statistics tracking
 */

export class UserService {
    /**
     * Create new user profile
     */
    async createProfile(user: User): Promise<boolean> {
        try {
            // Convert app User type to DB columns
            const dbUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Default values
                is_premium: false,
                is_pro_trainer: false,
                xp_points: 0,
                user_level: 1,
                daily_swipes: 0
            };

            const { error } = await supabase
                .from('users')
                .insert(dbUser);

            if (error) {
                console.error('Error creating profile:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Create profile error:', error);
            return false;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user:', error);
                return null;
            }

            return this.formatUser(data);
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    /**
     * Search users with filters
     */
    async searchUsers(filters: {
        query?: string;
        sports?: SportType[];
        level?: string;
        location?: string;
        limit?: number;
    }): Promise<User[]> {
        try {
            let query = supabase.from('users').select('*');

            if (filters.query) {
                query = query.or(`name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
            }

            if (filters.level) {
                query = query.eq('skill_level', filters.level);
            }

            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }

            query = query.limit(filters.limit || 20);

            const { data, error } = await query;

            if (error) {
                console.error('Error searching users:', error);
                return [];
            }

            let users = (data || []).map(this.formatUser);

            // Filter by sports (can't do in SQL with array columns)
            if (filters.sports && filters.sports.length > 0) {
                users = users.filter((user: User) =>
                    user.interests.some((sport) => filters.sports?.includes(sport))
                );
            }

            return users;
        } catch (error) {
            console.error('Search users error:', error);
            return [];
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
        try {
            // Convert camelCase to snake_case
            const dbUpdates: any = {};

            if (updates.name) dbUpdates.name = updates.name;
            if (updates.age) dbUpdates.age = updates.age;
            if (updates.bio) dbUpdates.bio = updates.bio;
            if (updates.location) dbUpdates.location = updates.location;
            if (updates.interests) dbUpdates.interests = updates.interests;
            if (updates.level) dbUpdates.skill_level = updates.level;
            if (updates.workoutTimePreference) dbUpdates.workout_time_preference = updates.workoutTimePreference;
            if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
            if (updates.gender) dbUpdates.gender = updates.gender;

            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', userId);

            if (error) {
                console.error('Error updating profile:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        }
    }

    /**
     * Upload profile photo
     */
    async uploadPhoto(userId: string, file: File): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { data, error } = await storageHelpers.uploadFile('avatars', filePath, file);

            if (error) {
                console.error('Error uploading photo:', error);
                return null;
            }

            const publicUrl = storageHelpers.getPublicUrl('avatars', filePath);

            // Update user profile with new avatar URL
            await this.updateProfile(userId, { avatarUrl: publicUrl });

            return publicUrl;
        } catch (error) {
            console.error('Upload photo error:', error);
            return null;
        }
    }

    /**
     * Delete photo
     */
    async deletePhoto(photoUrl: string): Promise<boolean> {
        try {
            // Extract path from URL
            const path = photoUrl.split('/storage/v1/object/public/avatars/')[1];
            if (!path) return false;

            const { error } = await storageHelpers.deleteFile('avatars', path);

            if (error) {
                console.error('Error deleting photo:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete photo error:', error);
            return false;
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(userId: string): Promise<any> {
        try {
            // Get match count
            const { count: matchCount } = await supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .eq('is_active', true);

            // Get workout request count
            const { count: requestCount } = await supabase
                .from('workout_requests')
                .select('*', { count: 'exact', head: true })
                .eq('from_user_id', userId)
                .eq('status', 'accepted');

            // Get club memberships
            const { count: clubCount } = await supabase
                .from('club_members')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            return {
                matches: matchCount || 0,
                workouts: requestCount || 0,
                clubs: clubCount || 0
            };
        } catch (error) {
            console.error('Get stats error:', error);
            return { matches: 0, workouts: 0, clubs: 0 };
        }
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(userId: string): Promise<void> {
        try {
            await supabase
                .from('users')
                .update({ last_active: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            console.error('Update last active error:', error);
        }
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
            coverPhotoUrl: dbUser.cover_photo_url,
            interests: dbUser.interests || [],
            level: dbUser.skill_level,
            workoutTimePreference: dbUser.workout_time_preference,
            isPremium: dbUser.is_premium,
            isProTrainer: dbUser.is_pro_trainer,
            xp: dbUser.xp_points,
            userLevel: dbUser.user_level,
            dailySwipes: dbUser.daily_swipes,
            lastSwipeReset: dbUser.last_swipe_reset
        };
    }
}

// Export singleton
export const userService = new UserService();
