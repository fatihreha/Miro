import { supabase, storageHelpers } from './supabase';
import { User, SportType } from '../types';
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimit';
import { compressImage, compressImages } from '../utils/imageCompression';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../utils/cacheManager';

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
    async createProfile(user: User & { latitude?: number; longitude?: number; showLocation?: boolean }): Promise<boolean> {
        try {
            // Convert app User type to DB columns - only include columns that exist in the DB
            const dbUser: Record<string, any> = {
                id: user.id,
                email: user.email,
                name: user.name,
                age: user.age || null,
                gender: user.gender || null,
                bio: user.bio || '',
                location: user.location || '',
                avatar_url: user.avatarUrl || null,
                interests: user.interests || [],
                skill_level: user.level || 'Beginner',
                workout_time_preference: user.workoutTimePreference ?? 'Anytime', // Use ?? for proper null/undefined handling
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Default values
                is_premium: false,
                is_pro_trainer: user.isTrainer || false,
                xp_points: 0,
                user_level: 1
            };

            // Add location coordinates if available
            if (user.latitude !== undefined && user.longitude !== undefined) {
                dbUser.latitude = user.latitude;
                dbUser.longitude = user.longitude;
                dbUser.location_updated_at = new Date().toISOString();
                dbUser.show_location = user.showLocation !== false;
            }

            console.log('[userService] Creating profile for:', user.id);

            // Check if profile already exists
            const existing = await this.getUserById(user.id);
            if (existing) {
                console.log('[userService] Profile already exists, updating instead');
                return await this.updateProfile(user.id, dbUser);
            }

            // Use upsert to handle cases where profile might already exist
            const { error } = await supabase
                .from('users')
                .upsert(dbUser, { onConflict: 'id' });

            if (error) {
                console.error('Error creating profile:', error.message, error.details, error.hint);
                // If it's a column error OR constraint violation, try with minimal required fields
                const shouldRetryMinimal =
                    error.message?.includes('column') ||
                    error.message?.includes('constraint') ||
                    error.code === '42703' ||
                    error.code === '23514'; // check constraint violation

                if (shouldRetryMinimal) {
                    console.log('Retrying with minimal fields due to:', error.message);
                    const minimalUser = {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        workout_time_preference: 'Anytime', // Required by DB constraint
                        skill_level: 'Beginner',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    const { error: minError } = await supabase
                        .from('users')
                        .upsert(minimalUser, { onConflict: 'id' });

                    if (minError) {
                        console.error('Minimal profile creation also failed:', minError);
                        return false;
                    }
                    return true;
                }
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
     * Includes caching for improved performance (5 minute TTL)
     */
    async getUserById(userId: string): Promise<User | null> {
        // Check cache first
        const cacheKey = CACHE_KEYS.USER(userId);
        const cached = cacheManager.get<User>(cacheKey);
        if (cached) {
            console.log('[userService] Cache hit for user:', userId);
            return cached;
        }

        try {
            console.log('[userService] Cache miss, fetching user:', userId);

            // Check current session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[userService] Current session:', session ? 'EXISTS' : 'NULL');

            // Try with maybeSingle() instead of single() to avoid 406 error
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('[userService] Error fetching user:', error);

                // Fallback: Try without RLS using service role (for debugging)
                console.log('[userService] Attempting fallback query...');
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .limit(1);

                if (!fallbackError && fallbackData && fallbackData.length > 0) {
                    console.log('[userService] Fallback query successful');
                    const user = this.formatUser(fallbackData[0]);
                    cacheManager.set(cacheKey, user, CACHE_TTL.USER_PROFILE);
                    return user;
                }

                return null;
            }

            if (data) {
                const user = this.formatUser(data);
                // Cache the result
                cacheManager.set(cacheKey, user, CACHE_TTL.USER_PROFILE);
                return user;
            }

            return null;
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

            // Multi-photo support
            if (updates.photos !== undefined) {
                dbUpdates.photos = updates.photos;
                // First photo = avatar
                dbUpdates.avatar_url = updates.photos[0] || null;
            }
            // Backward compatibility: if avatarUrl set without photos
            if (updates.avatarUrl && !updates.photos) {
                dbUpdates.avatar_url = updates.avatarUrl;
            }

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
     * Includes rate limiting and automatic image compression
     */
    async uploadPhoto(userId: string, file: File): Promise<string | null> {
        // Rate limiting check
        if (!rateLimiter.canMakeRequest(`upload_${userId}`, RATE_LIMITS.UPLOAD)) {
            console.warn('Rate limit exceeded for uploads');
            return null;
        }

        try {
            // Compress image before upload
            const compressedFile = await compressImage(file);

            const fileExt = compressedFile.name.split('.').pop() || 'jpg';
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { data, error } = await storageHelpers.uploadFile('avatars', filePath, compressedFile);

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
    /**
     * Upload multiple photos (for multi-photo profile)
     * Includes automatic image compression
     */
    async uploadPhotos(userId: string, files: File[]): Promise<string[]> {
        const uploadedUrls: string[] = [];

        // Compress all images first
        const compressedFiles = await compressImages(files);

        for (const file of compressedFiles) {
            try {
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error } = await storageHelpers.uploadFile('avatars', filePath, file);

                if (error) {
                    console.error('Photo upload failed:', error);
                    continue;
                }

                const publicUrl = storageHelpers.getPublicUrl('avatars', filePath);
                uploadedUrls.push(publicUrl);
            } catch (err) {
                console.error('Error uploading photo:', err);
            }
        }

        return uploadedUrls;
    }

    /**
     * Update photos array in database
     */
    async updatePhotos(userId: string, photos: string[]): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    photos: photos,
                    avatar_url: photos[0] || null, // First photo = avatar
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) {
                console.error('Error updating photos:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update photos error:', error);
            return false;
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
     * Update privacy settings
     */
    async updatePrivacySettings(userId: string, settings: {
        incognitoMode?: boolean;
        ghostMode?: boolean;
        widgetStyle?: 'daily' | 'stats' | 'lockin';
    }): Promise<boolean> {
        try {
            const updates: Record<string, any> = {};

            if (settings.incognitoMode !== undefined) {
                updates.incognito_mode = settings.incognitoMode;
            }
            if (settings.ghostMode !== undefined) {
                updates.ghost_mode = settings.ghostMode;
            }
            if (settings.widgetStyle !== undefined) {
                updates.widget_style = settings.widgetStyle;
            }

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (error) {
                console.error('Update privacy settings error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Update privacy settings error:', error);
            return false;
        }
    }

    /**
     * Get privacy settings
     */
    async getPrivacySettings(userId: string): Promise<{
        incognitoMode: boolean;
        ghostMode: boolean;
        widgetStyle: 'daily' | 'stats' | 'lockin';
    } | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('incognito_mode, ghost_mode, widget_style')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Get privacy settings error:', error);
                return null;
            }

            return {
                incognitoMode: data.incognito_mode || false,
                ghostMode: data.ghost_mode || false,
                widgetStyle: data.widget_style || 'daily'
            };
        } catch (error) {
            console.error('Get privacy settings error:', error);
            return null;
        }
    }

    /**
     * Request data export
     */
    async requestDataExport(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('data_requests')
                .insert({
                    user_id: userId,
                    request_type: 'export',
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Request data export error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Request data export error:', error);
            return false;
        }
    }

    /**
     * Mark account for deletion
     */
    async deleteAccount(userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    deleted_at: new Date().toISOString(),
                    is_deleted: true
                })
                .eq('id', userId);

            if (error) {
                console.error('Delete account error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete account error:', error);
            return false;
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
            avatarUrl: dbUser.avatar_url || '',
            photos: dbUser.photos || (dbUser.avatar_url ? [dbUser.avatar_url] : []), // Fallback for backward compatibility
            coverPhotoUrl: dbUser.cover_photo_url,
            interests: dbUser.interests || [],
            level: dbUser.skill_level,
            workoutTimePreference: dbUser.workout_time_preference,
            isPremium: dbUser.is_premium,
            isTrainer: dbUser.is_pro_trainer,
            xp: dbUser.xp_points,
            userLevel: dbUser.user_level,
            dailySwipes: dbUser.daily_swipes,
            lastSwipeReset: dbUser.last_swipe_reset
        };
    }
}

// Export singleton
export const userService = new UserService();
