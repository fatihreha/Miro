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
     * Book a training session with double-booking prevention
     */
    async bookSession(bookingData: {
        userId: string;
        trainerId: string;
        scheduledDate: string;
        scheduledTime: string;
        durationMinutes?: number;
        price: number;
    }): Promise<{ success: boolean; booking?: any; error?: string }> {
        try {
            // Step 1: Check slot availability (prevent double booking)
            const isAvailable = await this.checkSlotAvailability(
                bookingData.trainerId,
                bookingData.scheduledDate,
                bookingData.scheduledTime,
                bookingData.durationMinutes || 60
            );

            if (!isAvailable) {
                console.log('Slot not available:', bookingData);
                return { 
                    success: false, 
                    error: 'This time slot is no longer available. Please select another time.' 
                };
            }

            // Step 2: Verify trainer's working hours
            const isInWorkingHours = await this.verifyTrainerWorkingHours(
                bookingData.trainerId,
                bookingData.scheduledDate,
                bookingData.scheduledTime
            );

            if (!isInWorkingHours) {
                return { 
                    success: false, 
                    error: 'Selected time is outside trainer\'s working hours.' 
                };
            }

            // Step 3: Create booking with optimistic locking
            // Note: This relies on database unique constraint on (trainer_id, scheduled_date, scheduled_time)
            const bookingId = `booking_${bookingData.userId}_${Date.now()}`;
            
            const { data, error } = await supabase
                .from('bookings')
                .insert({
                    id: bookingId,
                    user_id: bookingData.userId,
                    trainer_id: bookingData.trainerId,
                    scheduled_date: bookingData.scheduledDate,
                    scheduled_time: bookingData.scheduledTime,
                    duration_minutes: bookingData.durationMinutes || 60,
                    price: bookingData.price,
                    status: 'pending', // Start as pending until payment
                    payment_status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Error booking session:', error);
                
                // Check if it's a unique constraint violation (double booking)
                if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
                    return { 
                        success: false, 
                        error: 'This slot was just booked by someone else. Please select another time.' 
                    };
                }
                
                return { success: false, error: 'Failed to create booking. Please try again.' };
            }

            console.log('✅ Booking created successfully:', data.id);
            return { success: true, booking: data };
            
        } catch (error: any) {
            console.error('Book session error:', error);
            return { 
                success: false, 
                error: error.message || 'An unexpected error occurred' 
            };
        }
    }

    /**
     * Check if a time slot is available
     */
    private async checkSlotAvailability(
        trainerId: string,
        date: string,
        time: string,
        durationMinutes: number
    ): Promise<boolean> {
        try {
            // Check for existing bookings in this time slot
            const { data: existingBookings, error } = await supabase
                .from('bookings')
                .select('id, scheduled_time, duration_minutes')
                .eq('trainer_id', trainerId)
                .eq('scheduled_date', date)
                .in('status', ['pending', 'upcoming', 'confirmed']);

            if (error) {
                console.error('Error checking availability:', error);
                return false;
            }

            if (!existingBookings || existingBookings.length === 0) {
                return true; // No bookings, slot is available
            }

            // Parse requested time
            const [reqHour, reqMinute] = time.split(':').map(Number);
            const requestedStart = reqHour * 60 + reqMinute;
            const requestedEnd = requestedStart + durationMinutes;

            // Check for time conflicts
            for (const booking of existingBookings) {
                const [bookHour, bookMinute] = booking.scheduled_time.split(':').map(Number);
                const bookingStart = bookHour * 60 + bookMinute;
                const bookingEnd = bookingStart + (booking.duration_minutes || 60);

                // Check if times overlap
                if (
                    (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
                    (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
                    (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
                ) {
                    console.log('Time conflict detected:', {
                        requested: `${requestedStart}-${requestedEnd}`,
                        existing: `${bookingStart}-${bookingEnd}`
                    });
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Slot availability check error:', error);
            return false; // Fail safe - don't allow booking if check fails
        }
    }

    /**
     * Verify trainer is working at requested time
     */
    private async verifyTrainerWorkingHours(
        trainerId: string,
        date: string,
        time: string
    ): Promise<boolean> {
        try {
            const { data: trainer, error } = await supabase
                .from('trainers')
                .select('availability')
                .eq('id', trainerId)
                .single();

            if (error || !trainer?.availability) {
                console.warn('No availability data for trainer:', trainerId);
                return true; // Allow if no availability set
            }

            // Get day of week from date
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
            const dayAvailability = trainer.availability[dayOfWeek];

            if (!dayAvailability || !dayAvailability.available) {
                return false;
            }

            // Check time is within working hours
            const [reqHour, reqMinute] = time.split(':').map(Number);
            const requestedMinutes = reqHour * 60 + reqMinute;

            const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;

            const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);
            const endMinutes = endHour * 60 + endMinute;

            return requestedMinutes >= startMinutes && requestedMinutes < endMinutes;
        } catch (error) {
            console.error('Working hours verification error:', error);
            return true; // Allow if check fails
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
     * Cancel booking with policy enforcement
     */
    async cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
        try {
            // Get booking details
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*, scheduled_date, scheduled_time, price, payment_status')
                .eq('id', bookingId)
                .eq('user_id', userId) // Ensure user owns this booking
                .single();

            if (fetchError || !booking) {
                return { success: false, error: 'Booking not found' };
            }

            // Check if already cancelled
            if (booking.status === 'cancelled') {
                return { success: false, error: 'Booking already cancelled' };
            }

            // Check cancellation policy (24 hours before session)
            const sessionDateTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
            const now = new Date();
            const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            let refundAmount = 0;
            let cancellationFee = 0;

            if (hoursUntilSession < 24) {
                // Less than 24 hours - apply cancellation fee
                cancellationFee = booking.price * 0.5; // 50% cancellation fee
                refundAmount = booking.price - cancellationFee;
                console.log(`Cancellation within 24h: Fee ${cancellationFee}, Refund ${refundAmount}`);
            } else {
                // More than 24 hours - full refund
                refundAmount = booking.price;
                console.log(`Cancellation >24h: Full refund ${refundAmount}`);
            }

            // Update booking status
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_fee: cancellationFee,
                    refund_amount: refundAmount
                })
                .eq('id', bookingId);

            if (updateError) {
                console.error('Error cancelling booking:', updateError);
                return { success: false, error: 'Failed to cancel booking' };
            }

            // TODO: Process refund through payment gateway
            // await paymentService.processRefund(booking.payment_id, refundAmount);

            return { success: true, refundAmount };
        } catch (error) {
            console.error('Cancel booking error:', error);
            return { success: false, error: 'An unexpected error occurred' };
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
