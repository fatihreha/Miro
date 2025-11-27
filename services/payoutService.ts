import { supabase } from './supabase';
import { encryption } from '../utils/encryption';

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
     * Register trainer's IBAN (encrypted)
     */
    async registerIBAN(trainerId: string, iban: string, accountName: string): Promise<void> {
        try {
            // Validate IBAN format (TR için)
            if (!this.validateIBAN(iban)) {
                throw new Error('Invalid IBAN format');
            }

            // Encrypt IBAN before storing
            const encryptedIban = encryption.encrypt(iban);

            const { error } = await supabase
                .from('trainer_payout_info')
                .upsert({
                    trainer_id: trainerId,
                    iban_encrypted: encryptedIban,
                    account_name: accountName,
                    verified: false,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Failed to register IBAN:', error);
            throw error;
        }
    },

    /**
     * Get trainer's payout info (decrypts IBAN)
     */
    async getPayoutInfo(trainerId: string): Promise<PayoutInfo | null> {
        try {
            const { data, error } = await supabase
                .from('trainer_payout_info')
                .select('*')
                .eq('trainer_id', trainerId)
                .single();

            if (error || !data) return null;

            // Decrypt IBAN
            const iban = encryption.decrypt(data.iban_encrypted);

            return {
                iban: this.maskIBAN(iban), // Mask for display
                accountName: data.account_name
            };
        } catch (error) {
            console.error('Failed to get payout info:', error);
            return null;
        }
    },

    /**
     * Request payout
     */
    async requestPayout(request: PayoutRequest): Promise<any> {
        try {
            // Minimum amount check
            if (request.amount < 100) {
                throw new Error('Minimum payout amount is 100 TL');
            }

            // Check trainer earnings
            const { data: earnings } = await supabase
                .from('trainer_earnings')
                .select('available_balance')
                .eq('trainer_id', request.trainerId)
                .single();

            if (!earnings || earnings.available_balance < request.amount) {
                throw new Error('Insufficient balance');
            }

            // Create payout request
            const { data, error } = await supabase
                .from('payout_requests')
                .insert({
                    trainer_id: request.trainerId,
                    amount: request.amount,
                    currency: request.currency || 'TRY',
                    status: 'pending',
                    requested_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Deduct from available balance
            await supabase.rpc('deduct_from_balance', {
                trainer_id: request.trainerId,
                amount: request.amount
            });

            return data;
        } catch (error) {
            console.error('Failed to request payout:', error);
            throw error;
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
