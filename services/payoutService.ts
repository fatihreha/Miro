import { supabase } from './supabase';

interface PayoutRequest {
    trainerId: string;
    amount: number;
    currency?: string;
}

interface PayoutInfo {
    iban: string;
    accountName: string;
}

export const payoutService = {
    /**
     * Register trainer's IBAN (server-side encrypted via RPC)
     * SECURITY: Uses pgcrypto for server-side encryption, key never exposed to client
     */
    async registerIBAN(trainerId: string, iban: string, accountName: string): Promise<void> {
        try {
            // Validate IBAN format (TR için)
            if (!this.validateIBAN(iban)) {
                throw new Error('Invalid IBAN format');
            }

            // Call server-side RPC function to encrypt and store IBAN
            const { error } = await supabase.rpc('store_trainer_iban', {
                p_trainer_id: trainerId,
                p_iban: iban
            });

            if (error) throw error;

            // Store account name separately (not sensitive)
            const { error: nameError } = await supabase
                .from('trainers')
                .update({
                    account_name: accountName,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', trainerId);

            if (nameError) throw nameError;
        } catch (error) {
            console.error('Failed to register IBAN:', error);
            throw error;
        }
    },

    /**
     * Get trainer's payout info (server-side decryption via RPC)
     * SECURITY: IBAN decrypted on server, returns masked version
     */
    async getPayoutInfo(trainerId: string): Promise<PayoutInfo | null> {
        try {
            // Call server-side RPC function to decrypt IBAN
            const { data: iban, error: ibanError } = await supabase.rpc('get_trainer_iban', {
                p_trainer_id: trainerId
            });

            if (ibanError) {
                console.error('Failed to get IBAN:', ibanError);
                return null;
            }

            if (!iban) return null; // No IBAN registered

            // Get account name (not sensitive)
            const { data: trainer, error: trainerError } = await supabase
                .from('trainers')
                .select('account_name')
                .eq('user_id', trainerId)
                .single();

            if (trainerError) {
                console.error('Failed to get account name:', trainerError);
                return null;
            }

            return {
                iban: this.maskIBAN(iban), // Mask for display
                accountName: trainer?.account_name || 'Not set'
            };
        } catch (error) {
            console.error('Failed to get payout info:', error);
            return null;
        }
    },

    /**
     * Request payout with escrow pattern (funds held until confirmed)
     * CRITICAL: Do NOT deduct balance until payout is confirmed
     */
    async requestPayout(request: PayoutRequest): Promise<{ success: boolean; payoutId?: string; error?: string }> {
        try {
            // Server-side validation (client-side is bypassable)
            if (request.amount < 100) {
                return { success: false, error: 'Minimum payout amount is 100 TL' };
            }

            // Check trainer earnings
            const { data: earnings, error: earningsError } = await supabase
                .from('trainer_earnings')
                .select('available_balance, held_balance')
                .eq('trainer_id', request.trainerId)
                .single();

            if (earningsError || !earnings) {
                return { success: false, error: 'Failed to fetch earnings' };
            }

            if (earnings.available_balance < request.amount) {
                return { success: false, error: 'Insufficient balance' };
            }

            // Verify IBAN exists (server-side check)
            const { data: hasIban, error: ibanCheckError } = await supabase.rpc('get_trainer_iban', {
                p_trainer_id: request.trainerId
            });

            if (ibanCheckError || !hasIban) {
                return { success: false, error: 'Please register your IBAN first' };
            }

            // Generate unique idempotency key
            const idempotencyKey = `payout_${request.trainerId}_${Date.now()}`;

            // ESCROW PATTERN: Create payout request with status 'pending'
            // DO NOT deduct from available_balance yet
            const { data: payoutRequest, error: createError } = await supabase
                .from('payout_requests')
                .insert({
                    id: idempotencyKey,
                    trainer_id: request.trainerId,
                    amount: request.amount,
                    currency: request.currency || 'TRY',
                    status: 'pending', // pending -> processing -> completed/failed
                    requested_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('Failed to create payout request:', createError);
                return { success: false, error: 'Failed to create payout request' };
            }

            // HOLD FUNDS: Move from available_balance to held_balance
            // This is atomic and reversible if payout fails
            const { error: holdError } = await supabase.rpc('hold_balance_for_payout', {
                p_trainer_id: request.trainerId,
                p_amount: request.amount,
                p_payout_id: payoutRequest.id
            });

            if (holdError) {
                console.error('Failed to hold balance:', holdError);
                
                // Rollback: Delete payout request
                await supabase
                    .from('payout_requests')
                    .delete()
                    .eq('id', payoutRequest.id);
                
                return { success: false, error: 'Failed to hold funds' };
            }

            console.log('✅ Payout request created with held funds:', payoutRequest.id);
            
            // TODO: Send to payment processor (e.g., Stripe Payouts, Iyzico)
            // await this.processPayoutWithGateway(payoutRequest.id);

            return { success: true, payoutId: payoutRequest.id };
            
        } catch (error: any) {
            console.error('Failed to request payout:', error);
            return { success: false, error: error.message || 'Unexpected error' };
        }
    },

    /**
     * Confirm payout (called by webhook or admin)
     * Moves funds from held_balance to paid
     */
    async confirmPayout(payoutId: string): Promise<boolean> {
        try {
            // Update payout status
            const { error: updateError } = await supabase
                .from('payout_requests')
                .update({ 
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', payoutId)
                .eq('status', 'pending'); // Only confirm if still pending

            if (updateError) {
                console.error('Failed to update payout status:', updateError);
                return false;
            }

            // Release held funds (mark as paid)
            const { error: releaseError } = await supabase.rpc('release_held_balance', {
                p_payout_id: payoutId
            });

            if (releaseError) {
                console.error('Failed to release held balance:', releaseError);
                return false;
            }

            console.log('✅ Payout confirmed:', payoutId);
            return true;
        } catch (error) {
            console.error('Failed to confirm payout:', error);
            return false;
        }
    },

    /**
     * Cancel/fail payout (called on payment failure)
     * Returns funds from held_balance back to available_balance
     */
    async cancelPayout(payoutId: string, reason?: string): Promise<boolean> {
        try {
            // Update payout status
            const { error: updateError } = await supabase
                .from('payout_requests')
                .update({ 
                    status: 'failed',
                    failure_reason: reason,
                    failed_at: new Date().toISOString()
                })
                .eq('id', payoutId)
                .in('status', ['pending', 'processing']);

            if (updateError) {
                console.error('Failed to update payout status:', updateError);
                return false;
            }

            // Return held funds to available balance
            const { error: returnError } = await supabase.rpc('return_held_balance', {
                p_payout_id: payoutId
            });

            if (returnError) {
                console.error('Failed to return held balance:', returnError);
                return false;
            }

            console.log('✅ Payout cancelled, funds returned:', payoutId);
            return true;
        } catch (error) {
            console.error('Failed to cancel payout:', error);
            return false;
        }
    },

    /**
     * Get payout history
     */
    async getPayoutHistory(trainerId: string): Promise<any[]> {
        const { data } = await supabase
            .from('payout_requests')
            .select('*')
            .eq('trainer_id', trainerId)
            .order('requested_at', { ascending: false });

        return data || [];
    },

    /**
     * Get trainer earnings
     */
    async getEarnings(trainerId: string): Promise<any> {
        const { data } = await supabase
            .from('trainer_earnings')
            .select('*')
            .eq('trainer_id', trainerId)
            .single();

        return data;
    },

    /**
     * Validate IBAN format (Turkey)
     */
    validateIBAN(iban: string): boolean {
        // Remove spaces
        const cleanIban = iban.replace(/\s/g, '');

        // TR IBAN: TR + 2 check digits + 5 digits (bank) + 1 digit (reserved) + 16 digits (account)
        const trIbanRegex = /^TR\d{24}$/;

        return trIbanRegex.test(cleanIban);
    },

    /**
     * Mask IBAN for display (show only last 4 digits)
     */
    maskIBAN(iban: string): string {
        const cleanIban = iban.replace(/\s/g, '');
        const lastFour = cleanIban.slice(-4);
        return `TR** **** **** **** **** **${lastFour}`;
    }
};
