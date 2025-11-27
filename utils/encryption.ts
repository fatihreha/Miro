import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';

if (!SECRET_KEY && import.meta.env.MODE === 'production') {
    console.error('⚠️ ENCRYPTION_KEY not set! Sensitive data will not be encrypted.');
}

export const encryption = {
    /**
     * Encrypt data using AES-256
     */
    encrypt(data: string): string {
        if (!data) return '';

        try {
            return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
        } catch (e) {
            console.error('Encryption error:', e);
            throw new Error('Failed to encrypt data');
        }
    },

    /**
     * Decrypt AES-256 encrypted data
     */
    decrypt(encrypted: string): string {
        if (!encrypted) return '';

        try {
            const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            if (!decrypted) {
                throw new Error('Decryption produced empty result');
            }

            return decrypted;
        } catch (e) {
            console.error('Decryption error:', e);
            throw new Error('Failed to decrypt data');
        }
    },

    /**
     * Hash sensitive data (one-way)
     */
    hashSensitiveData(data: string): string {
        return CryptoJS.SHA256(data).toString();
    },

    /**
     * Generate random encryption key
     */
    generateKey(): string {
        return CryptoJS.lib.WordArray.random(256 / 8).toString();
    }
};

// Usage examples:
//
// Encrypt IBAN:
// const encryptedIban = encryption.encrypt(userIban);
// await supabase.from('trainer_payout_info').insert({ iban_encrypted: encryptedIban });
//
// Decrypt IBAN:
// const decryptedIban = encryption.decrypt(data.iban_encrypted);
