import { supabase } from './supabase';

/**
 * Trainer & Booking Service
 * Features:
 * - Trainer discovery
 * - Session booking
 * - Availability management
 * - Payment tracking
 */

export class TrainerService {
    /**
     * Get all trainers with filters
     */
    async getTrainers(filters?: {
        sport?: string;
        minRating?: number;
        maxPrice?: number;
    }): Promise<any[]> {
        try {
            let query = supabase
                .from('trainers')
                .select(`
          *,
          user:users(*)
        `)
                .order('rating', { ascending: false });

            if (filters?.sport) {
                query = query.contains('specialties', [filters.sport]);
            }

            if (filters?.minRating) {
                query = query.gte('rating', filters.minRating);
            }

            if (filters?.maxPrice) {
                query = query.lte('hourly_rate', filters.maxPrice);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching trainers:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get trainers error:', error);
            return [];
        }
    }

    /**
     * Get trainer by ID
     */
    async getTrainerById(trainerId: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('trainers')
                .select(`
          *,
          user:users(*)
        `)
                .eq('id', trainerId)
                .single();

            if (error) {
                console.error('Error fetching trainer:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get trainer error:', error);
            return null;
        }
    }

    /**
     * Book a training session
     */
    async bookSession(bookingData: {
        userId: string;
        trainerId: string;
        scheduledDate: string;
        scheduledTime: string;
        durationMinutes?: number;
        price: number;
    }): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert({
                    user_id: bookingData.userId,
                    trainer_id: bookingData.trainerId,
                    scheduled_date: bookingData.scheduledDate,
                    scheduled_time: bookingData.scheduledTime,
                    duration_minutes: bookingData.durationMinutes || 60,
                    price: bookingData.price,
                    status: 'upcoming',
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Error booking session:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Book session error:', error);
            return null;
        }
    }

    /**
     * Get bookings for a user
     */
    async getUserBookings(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          trainer:trainers(
            *,
            user:users(*)
          )
        `)
                .eq('user_id', userId)
                .order('scheduled_date', { ascending: true });

            if (error) {
                console.error('Error fetching bookings:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get bookings error:', error);
            return [];
        }
    }

    /**
     * Get bookings for a trainer
     */
    async getTrainerBookings(trainerId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          user:users(*)
        `)
                .eq('trainer_id', trainerId)
                .order('scheduled_date', { ascending: true });

            if (error) {
                console.error('Error fetching trainer bookings:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get trainer bookings error:', error);
            return [];
        }
    }

    /**
     * Cancel booking
     */
    async cancelBooking(bookingId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            return !error;
        } catch (error) {
            console.error('Cancel booking error:', error);
            return false;
        }
    }

    /**
     * Update trainer availability
     */
    async updateAvailability(trainerId: string, availability: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('trainers')
                .update({ availability })
                .eq('id', trainerId);

            return !error;
        } catch (error) {
            console.error('Update availability error:', error);
            return false;
        }
    }

    /**
     * Get trainer stats (for dashboard)
     */
    async getTrainerStats(trainerId: string): Promise<any> {
        try {
            const { count: totalBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('trainer_id', trainerId);

            const { data: earnings } = await supabase
                .from('bookings')
                .select('price')
                .eq('trainer_id', trainerId)
                .eq('payment_status', 'paid');

            const totalEarnings = earnings?.reduce((sum, b) => sum + parseFloat(b.price), 0) || 0;

            return {
                totalBookings: totalBookings || 0,
                totalEarnings
            };
        } catch (error) {
            console.error('Get trainer stats error:', error);
            return { totalBookings: 0, totalEarnings: 0 };
        }
    }
}

export const trainerService = new TrainerService();
