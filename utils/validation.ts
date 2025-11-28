import { z } from 'zod';

/**
 * Input Validation Schemas
 * Protects against XSS, SQL injection, and malicious input
 */

// ==========================================
// USER PROFILE VALIDATION
// ==========================================

export const userProfileSchema = z.object({
    name: z.string()
        .min(2, 'İsim en az 2 karakter olmalı')
        .max(50, 'İsim en fazla 50 karakter olabilir')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Sadece harf kullanılabilir'),

    bio: z.string()
        .max(500, 'Biyografi en fazla 500 karakter olabilir')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz')
        .optional(),

    location: z.string()
        .min(2, 'Konum en az 2 karakter olmalı')
        .max(100, 'Konum en fazla 100 karakter olabilir')
        .optional(),

    age: z.number()
        .min(13, 'En az 13 yaşında olmalısınız')
        .max(120, 'Geçerli bir yaş giriniz')
        .optional(),

    height: z.number()
        .min(120, 'Geçerli bir boy giriniz')
        .max(250, 'Geçerli bir boy giriniz')
        .optional(),

    weight: z.number()
        .min(30, 'Geçerli bir kilo giriniz')
        .max(300, 'Geçerli bir kilo giriniz')
        .optional()
});

// ==========================================
// CLUB VALIDATION
// ==========================================

export const clubSchema = z.object({
    name: z.string()
        .min(3, 'Kulüp adı en az 3 karakter olmalı')
        .max(50, 'Kulüp adı en fazla 50 karakter olabilir')
        .regex(/^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]+$/, 'Sadece harf, rakam ve boşluk kullanılabilir'),

    description: z.string()
        .min(10, 'Açıklama en az 10 karakter olmalı')
        .max(500, 'Açıklama en fazla 500 karakter olabilir')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz'),

    location: z.string()
        .min(2, 'Konum en az 2 karakter olmalı')
        .max(100, 'Konum en fazla 100 karakter olabilir'),

    sport: z.string()
        .min(2, 'Spor türü seçiniz'),

    isPrivate: z.boolean().optional()
});

// ==========================================
// MESSAGE VALIDATION
// ==========================================

export const messageSchema = z.object({
    content: z.string()
        .min(1, 'Mesaj boş olamaz')
        .max(1000, 'Mesaj en fazla 1000 karakter olabilir')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz')
});

// ==========================================
// AUTHENTICATION VALIDATION
// ==========================================

export const emailSchema = z.string()
    .email('Geçersiz email adresi')
    .max(255, 'Email adresi çok uzun')
    .toLowerCase();

export const passwordSchema = z.string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .max(100, 'Şifre en fazla 100 karakter olabilir')
    .regex(/[A-Z]/, 'En az 1 büyük harf gerekli')
    .regex(/[a-z]/, 'En az 1 küçük harf gerekli')
    .regex(/[0-9]/, 'En az 1 rakam gerekli')
    .regex(/[@$!%*?&]/, 'En az 1 özel karakter gerekli (@$!%*?&)');

export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword']
});

// ==========================================
// PAYMENT VALIDATION
// ==========================================

export const ibanSchema = z.string()
    .regex(/^TR[0-9]{2}[0-9]{5}[0-9]{16}$/, 'Geçersiz IBAN formatı (TR ile başlamalı)')
    .length(26, 'IBAN 26 karakter olmalı');

export const payoutRequestSchema = z.object({
    amount: z.number()
        .min(100, 'Minimum ödeme tutarı 100 TL')
        .max(50000, 'Maximum ödeme tutarı 50,000 TL'),

    iban: ibanSchema,

    accountName: z.string()
        .min(3, 'Hesap sahibi adı en az 3 karakter')
        .max(100, 'Hesap sahibi adı en fazla 100 karakter')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Sadece harf kullanılabilir')
});

// ==========================================
// EVENT VALIDATION
// ==========================================

export const eventSchema = z.object({
    title: z.string()
        .min(3, 'Etkinlik başlığı en az 3 karakter')
        .max(100, 'Etkinlik başlığı en fazla 100 karakter')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz'),

    description: z.string()
        .max(1000, 'Açıklama en fazla 1000 karakter')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz')
        .optional(),

    location: z.string()
        .min(2, 'Konum en az 2 karakter')
        .max(200, 'Konum en fazla 200 karakter'),

    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı (YYYY-MM-DD)'),

    time: z.string()
        .regex(/^\d{2}:\d{2}$/, 'Geçersiz saat formatı (HH:MM)'),

    maxParticipants: z.number()
        .min(2, 'En az 2 katılımcı olmalı')
        .max(1000, 'En fazla 1000 katılımcı olabilir')
        .optional()
});

// ==========================================
// SEARCH VALIDATION
// ==========================================

export const searchQuerySchema = z.string()
    .min(1, 'Arama terimi giriniz')
    .max(100, 'Arama terimi çok uzun')
    .regex(/^[^<>]*$/, 'Geçersiz karakterler');

// ==========================================
// REPORT VALIDATION
// ==========================================

export const reportSchema = z.object({
    reason: z.string()
        .min(1, 'Şikayet nedeni seçiniz'),

    description: z.string()
        .min(10, 'Açıklama en az 10 karakter olmalı')
        .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
        .regex(/^[^<>]*$/, 'HTML etiketleri kullanılamaz'),

    reportedUserId: z.string().uuid('Geçersiz kullanıcı ID')
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate data and return result or throw error with user-friendly message
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Get first error message
            const firstError = error.errors[0];
            throw new Error(firstError.message);
        }
        throw error;
    }
}

/**
 * Validate data and return success/error object
 */
export function validateSafe<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return { success: false, error: firstError.message };
        }
        return { success: false, error: 'Bilinmeyen bir hata oluştu' };
    }
}

/**
 * Check password strength (0-5)
 */
export function checkPasswordStrength(password: string): number {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
    switch (strength) {
        case 0:
        case 1:
            return 'Çok Zayıf';
        case 2:
            return 'Zayıf';
        case 3:
            return 'Orta';
        case 4:
            return 'Güçlü';
        case 5:
            return 'Çok Güçlü';
        default:
            return '';
    }
}
