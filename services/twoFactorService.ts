import { supabase } from './supabase';

/**
 * Two-Factor Authentication Service
 * Handles 2FA setup, verification, and backup codes
 */

interface TwoFactorStatus {
    isEnabled: boolean;
    lastVerifiedAt: string | null;
    hasBackupCodes: boolean;
}

class TwoFactorService {
    /**
     * Check if 2FA is enabled for user
     */
    async getStatus(userId: string): Promise<TwoFactorStatus> {
        const { data, error } = await supabase
            .from('user_2fa')
            .select('is_enabled, last_verified_at, backup_codes')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return {
                isEnabled: false,
                lastVerifiedAt: null,
                hasBackupCodes: false
            };
        }

        return {
            isEnabled: data.is_enabled,
            lastVerifiedAt: data.last_verified_at,
            hasBackupCodes: (data.backup_codes?.length || 0) > 0
        };
    }

    /**
     * Generate TOTP secret for setup
     * Returns QR code data URL and secret
     */
    async generateSecret(userId: string, email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }> {
        // Generate secure random secret (32 chars base32)
        const array = new Uint8Array(20);
        crypto.getRandomValues(array);
        const secret = this.base32Encode(array);

        // Generate backup codes
        const backupCodes = this.generateBackupCodes();

        // Create QR code URL for authenticator apps
        const issuer = 'SportPulse';
        const otpAuthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

        // Store encrypted secret (temporarily, will be confirmed after verification)
        await supabase.from('user_2fa').upsert({
            user_id: userId,
            secret_key: secret, // In production, encrypt this
            backup_codes: backupCodes,
            is_enabled: false, // Not enabled until verified
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        });

        return {
            secret,
            qrCodeUrl,
            backupCodes
        };
    }

    /**
     * Verify TOTP code and enable 2FA
     */
    async verifyAndEnable(userId: string, code: string): Promise<boolean> {
        // Get stored secret
        const { data, error } = await supabase
            .from('user_2fa')
            .select('secret_key')
            .eq('user_id', userId)
            .single();

        if (error || !data?.secret_key) {
            throw new Error('2FA not set up. Please generate secret first.');
        }

        // Verify TOTP code
        const isValid = this.verifyTOTP(data.secret_key, code);

        if (!isValid) {
            return false;
        }

        // Enable 2FA
        await supabase
            .from('user_2fa')
            .update({
                is_enabled: true,
                last_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        return true;
    }

    /**
     * Verify TOTP code (for login)
     */
    async verify(userId: string, code: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_2fa')
            .select('secret_key, backup_codes, is_enabled')
            .eq('user_id', userId)
            .single();

        if (error || !data?.is_enabled) {
            return true; // 2FA not enabled, pass through
        }

        // Check if it's a backup code
        if (code.length === 8 && data.backup_codes?.includes(code)) {
            // Use backup code (one-time)
            const remainingCodes = data.backup_codes.filter((c: string) => c !== code);
            await supabase
                .from('user_2fa')
                .update({
                    backup_codes: remainingCodes,
                    last_verified_at: new Date().toISOString()
                })
                .eq('user_id', userId);
            return true;
        }

        // Verify TOTP
        const isValid = this.verifyTOTP(data.secret_key, code);

        if (isValid) {
            await supabase
                .from('user_2fa')
                .update({ last_verified_at: new Date().toISOString() })
                .eq('user_id', userId);
        }

        return isValid;
    }

    /**
     * Disable 2FA
     */
    async disable(userId: string, code: string): Promise<boolean> {
        // Verify code first
        const isValid = await this.verify(userId, code);
        if (!isValid) return false;

        await supabase
            .from('user_2fa')
            .update({
                is_enabled: false,
                secret_key: null,
                backup_codes: null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        return true;
    }

    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId: string, code: string): Promise<string[] | null> {
        const isValid = await this.verify(userId, code);
        if (!isValid) return null;

        const newCodes = this.generateBackupCodes();

        await supabase
            .from('user_2fa')
            .update({ backup_codes: newCodes })
            .eq('user_id', userId);

        return newCodes;
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private generateBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < 10; i++) {
            const array = new Uint8Array(4);
            crypto.getRandomValues(array);
            const code = Array.from(array)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    private base32Encode(buffer: Uint8Array): string {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;

            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }

        return output;
    }

    private verifyTOTP(secret: string, code: string): boolean {
        // TOTP verification using current time
        const timeStep = 30;
        const currentTime = Math.floor(Date.now() / 1000 / timeStep);

        // Check current and adjacent time windows (±1)
        for (let i = -1; i <= 1; i++) {
            const expectedCode = this.generateTOTP(secret, currentTime + i);
            if (expectedCode === code) {
                return true;
            }
        }

        return false;
    }

    private generateTOTP(secret: string, time: number): string {
        // Simplified TOTP - in production use a proper library like otplib
        // This is a placeholder implementation
        const timeHex = time.toString(16).padStart(16, '0');
        const combined = secret + timeHex;

        // Simple hash (NOT cryptographically secure - use proper HMAC-SHA1 in production)
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        const code = Math.abs(hash % 1000000);
        return code.toString().padStart(6, '0');
    }
}

export const twoFactorService = new TwoFactorService();
