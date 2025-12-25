import { supabase } from './supabase';

export interface UserRating {
  id: string;
  rated_user_id: string;
  rater_user_id: string;
  workout_request_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export class RatingService {
  /**
   * Rate a user after a workout session
   * @param ratedUserId - User being rated
   * @param rating - Rating value (1-5)
   * @param comment - Optional comment
   * @param raterUserId - User giving the rating (optional, defaults to current user)
   * @param workoutRequestId - Associated workout request (optional)
   */
  async rateUser(
    ratedUserId: string,
    rating: number,
    comment?: string,
    raterUserId?: string,
    workoutRequestId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      // Get current user if rater not provided
      let raterId = raterUserId;
      if (!raterId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }

        // Get user profile to get the users table id
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!profile) {
          return { success: false, error: 'User profile not found' };
        }

        raterId = profile.id;
      }

      // Check if user already rated this person for this workout
      if (workoutRequestId) {
        const { data: existingRating } = await supabase
          .from('user_ratings')
          .select('id')
          .eq('rated_user_id', ratedUserId)
          .eq('rater_user_id', raterId)
          .eq('workout_request_id', workoutRequestId)
          .single();

        if (existingRating) {
          return { success: false, error: 'You have already rated this user for this workout' };
        }
      }

      // Insert rating
      const { error: insertError } = await supabase
        .from('user_ratings')
        .insert({
          rated_user_id: ratedUserId,
          rater_user_id: raterId,
          workout_request_id: workoutRequestId,
          rating,
          comment
        });

      if (insertError) {
        console.error('Error inserting rating:', insertError);
        return { success: false, error: insertError.message };
      }

      // Update user's average rating
      await this.updateUserAverageRating(ratedUserId);

      return { success: true };
    } catch (error) {
      console.error('Error rating user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a user's average reliability rating
   * @param userId - User whose rating to update
   */
  private async updateUserAverageRating(userId: string): Promise<void> {
    try {
      // Calculate average rating
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (!ratings || ratings.length === 0) {
        return;
      }

      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / ratings.length;

      // Update user's reliability_rating
      await supabase
        .from('users')
        .update({
          reliability_rating: parseFloat(averageRating.toFixed(2)),
          total_ratings_received: ratings.length
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating average rating:', error);
    }
  }

  /**
   * Get all ratings for a user
   * @param userId - User to get ratings for
   * @returns Array of ratings with rater information
   */
  async getUserRatings(userId: string): Promise<UserRating[]> {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select(`
          *,
          rater:rater_user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user ratings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user ratings:', error);
      return [];
    }
  }

  /**
   * Get a user's current reliability score
   * @param userId - User to get score for
   * @returns Reliability score (1.0-5.0)
   */
  async getUserReliabilityScore(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('reliability_rating')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching reliability score:', error);
        return 5.0; // Default score
      }

      return data.reliability_rating || 5.0;
    } catch (error) {
      console.error('Error getting reliability score:', error);
      return 5.0;
    }
  }

  /**
   * Check if a user can rate another user
   * @param ratedUserId - User to be rated
   * @param raterUserId - User giving the rating (optional, defaults to current user)
   * @param workoutRequestId - Associated workout request (optional)
   * @returns Whether the user can rate
   */
  async canRateUser(
    ratedUserId: string,
    raterUserId?: string,
    workoutRequestId?: string
  ): Promise<boolean> {
    try {
      // Get current user if rater not provided
      let raterId = raterUserId;
      if (!raterId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (!profile) return false;
        raterId = profile.id;
      }

      // Can't rate yourself
      if (raterId === ratedUserId) {
        return false;
      }

      // If workout request provided, check if already rated for this workout
      if (workoutRequestId) {
        const { data: existingRating } = await supabase
          .from('user_ratings')
          .select('id')
          .eq('rated_user_id', ratedUserId)
          .eq('rater_user_id', raterId)
          .eq('workout_request_id', workoutRequestId)
          .single();

        return !existingRating;
      }

      // Otherwise, check if rated in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentRating } = await supabase
        .from('user_ratings')
        .select('id')
        .eq('rated_user_id', ratedUserId)
        .eq('rater_user_id', raterId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .single();

      return !recentRating;
    } catch (error) {
      console.error('Error checking if can rate user:', error);
      return false;
    }
  }

  /**
   * Apply a minor penalty for being significantly late (15+ minutes)
   * Reduces reliability rating by 0.1
   */
  async applyLatePenalty(userId: string): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('reliability_rating')
        .eq('id', userId)
        .single();

      if (!user) return;

      const currentRating = user.reliability_rating || 5.0;
      const newRating = Math.max(1.0, currentRating - 0.1);

      await supabase
        .from('users')
        .update({ reliability_rating: parseFloat(newRating.toFixed(2)) })
        .eq('id', userId);

      console.log(`Applied late penalty to user ${userId}: ${currentRating} -> ${newRating}`);
    } catch (error) {
      console.error('Error applying late penalty:', error);
    }
  }

  /**
   * Apply a major penalty for late cancellation or no-show
   * Reduces reliability rating by 0.5
   */
  async applyPenalty(userId: string): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('reliability_rating')
        .eq('id', userId)
        .single();

      if (!user) return;

      const currentRating = user.reliability_rating || 5.0;
      const newRating = Math.max(1.0, currentRating - 0.5);

      await supabase
        .from('users')
        .update({ reliability_rating: parseFloat(newRating.toFixed(2)) })
        .eq('id', userId);

      console.log(`Applied penalty to user ${userId}: ${currentRating} -> ${newRating}`);

      // Check if user should be auto-banned
      await this.checkAutoBan(userId, newRating);
    } catch (error) {
      console.error('Error applying penalty:', error);
    }
  }

  /**
   * Check if user's reliability is below threshold and should be banned
   * Auto-bans users with rating below 1.5
   */
  async checkAutoBan(userId: string, currentRating?: number): Promise<boolean> {
    try {
      let rating = currentRating;

      if (rating === undefined) {
        const { data: user } = await supabase
          .from('users')
          .select('reliability_rating')
          .eq('id', userId)
          .single();

        if (!user) return false;
        rating = user.reliability_rating || 5.0;
      }

      if (rating < 1.5) {
        // Mark user as banned
        await supabase
          .from('users')
          .update({
            is_banned: true,
            ban_reason: 'Automatic ban due to low reliability score',
            banned_at: new Date().toISOString()
          })
          .eq('id', userId);

        console.log(`User ${userId} auto-banned due to reliability score: ${rating}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking auto-ban:', error);
      return false;
    }
  }
}

export const ratingService = new RatingService();
