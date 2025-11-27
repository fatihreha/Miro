import JSZip from 'jszip';
import { supabase } from './supabase';

/**
 * Privacy & KVKK Compliance Service
 * 
 * Features:
 * - Data export (ZIP file generation)
 * - Account deletion (soft/hard delete)
 * - Consent management
 * - Data access logging (audit trail)
 */

export interface UserConsents {
    marketing: boolean;
    analytics: boolean;
    location: boolean;
    thirdParty: boolean;
}

export interface DataAccessLog {
    id: string;
    userId: string;
    accessedBy: string;
    accessType: 'export' | 'view' | 'update' | 'delete';
    accessedAt: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface DeletionRequest {
    id: string;
    userId: string;
    requestedAt: string;
    reason?: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    scheduledDeletionDate: string;
}

export const privacyService = {
    /**
     * Export all user data as a ZIP file
     * KVKK Article 11: Right to access personal data
     */
    async exportUserData(userId: string): Promise<Blob> {
        try {
            // Log the data access
            await this.logDataAccess(userId, userId, 'export');

            const zip = new JSZip();

            // 1. User Profile
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                zip.file('user_profile.json', JSON.stringify(profile, null, 2));
            }

            // 2. Matches
            const { data: matches } = await supabase
                .from('matches')
                .select('*')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

            if (matches) {
                zip.file('matches.json', JSON.stringify(matches, null, 2));
            }

            // 3. Messages
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (messages) {
                zip.file('messages.json', JSON.stringify(messages, null, 2));
            }

            // 4. Workout Requests
            const { data: workouts } = await supabase
                .from('workout_requests')
                .select('*')
                .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

            if (workouts) {
                zip.file('workout_requests.json', JSON.stringify(workouts, null, 2));
            }

            // 5. Club Memberships
            const { data: clubs } = await supabase
                .from('club_members')
                .select('*, clubs(*)')
                .eq('user_id', userId);

            if (clubs) {
                zip.file('club_memberships.json', JSON.stringify(clubs, null, 2));
            }

            // 6. Trainer Bookings (if trainer)
            const { data: bookings } = await supabase
                .from('session_bookings')
                .select('*')
                .or(`trainer_id.eq.${userId},client_id.eq.${userId}`);

            if (bookings) {
                zip.file('bookings.json', JSON.stringify(bookings, null, 2));
            }

            // 7. Consent History
            const { data: consents } = await supabase
                .from('user_consents')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (consents) {
                zip.file('consent_history.json', JSON.stringify(consents, null, 2));
            }

            // 8. Data Access Logs
            const { data: accessLogs } = await supabase
                .from('data_access_logs')
                .select('*')
                .eq('user_id', userId)
                .order('accessed_at', { ascending: false })
                .limit(100);

            if (accessLogs) {
                zip.file('data_access_logs.json', JSON.stringify(accessLogs, null, 2));
            }

            // Add README
            const readme = `# SportPulse - Kişisel Verileriniz

Bu ZIP dosyası, SportPulse'da kayıtlı tüm kişisel verilerinizi içermektedir.

## İçerik:

- user_profile.json: Profil bilgileriniz
- matches.json: Eşleşmeleriniz
- messages.json: Mesajlarınız
- workout_requests.json: Antrenman davetleriniz
- club_memberships.json: Kulüp üyelikleriniz
- bookings.json: Antrenör rezervasyonlarınız
- consent_history.json: Rıza geçmişiniz
- data_access_logs.json: Veri erişim kayıtlarınız

## Veri İşleme:

Bu veriler KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında işlenmiştir.

Daha fazla bilgi için: privacy@sportpulse.com

İndirme Tarihi: ${new Date().toISOString()}
Kullanıcı ID: ${userId}
`;

            zip.file('README.txt', readme);

            // Generate ZIP
            const blob = await zip.generateAsync({ type: 'blob' });
            return blob;
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw new Error('Veri dışa aktarma başarısız oldu');
        }
    },

    /**
     * Delete user account
     * KVKK Article 7: Right to deletion
     */
    async deleteUserAccount(userId: string, reason?: string): Promise<void> {
        try {
            // Log the deletion request
            await this.logDataAccess(userId, userId, 'delete');

            // Calculate scheduled deletion date (30 days from now)
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30);

            // Create deletion request
            const { error: requestError } = await supabase
                .from('deletion_requests')
                .insert({
                    user_id: userId,
                    requested_at: new Date().toISOString(),
                    reason: reason || null,
                    status: 'pending',
                    scheduled_deletion_date: scheduledDate.toISOString()
                });

            if (requestError) throw requestError;

            // Soft delete: Anonymize user data immediately
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    name: 'Deleted User',
                    email: `deleted_${userId}@deleted.local`,
                    phone: null,
                    bio: '[Hesap Silindi]',
                    avatar_url: null,
                    is_active: false,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            console.log(`Account deletion scheduled for user ${userId} on ${scheduledDate.toISOString()}`);
        } catch (error) {
            console.error('Error deleting user account:', error);
            throw new Error('Hesap silme işlemi başarısız oldu');
        }
    },

    /**
     * Hard delete user data (after 30-day retention)
     * Should be called by a scheduled job
     */
    async hardDeleteUser(userId: string): Promise<void> {
        try {
            // Delete from all tables (cascade)
            await supabase.from('matches').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
            await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
            await supabase.from('workout_requests').delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
            await supabase.from('club_members').delete().eq('user_id', userId);
            await supabase.from('session_bookings').delete().or(`trainer_id.eq.${userId},client_id.eq.${userId}`);
            await supabase.from('user_consents').delete().eq('user_id', userId);
            await supabase.from('data_access_logs').delete().eq('user_id', userId);

            // Finally delete user
            await supabase.from('users').delete().eq('id', userId);

            // Update deletion request status
            await supabase
                .from('deletion_requests')
                .update({ status: 'completed' })
                .eq('user_id', userId);

            console.log(`User ${userId} permanently deleted`);
        } catch (error) {
            console.error('Error hard deleting user:', error);
            throw error;
        }
    },

    /**
     * Update user consent preferences
     * KVKK Article 5: Consent requirement
     */
    async updateConsent(userId: string, consents: Partial<UserConsents>): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_consents')
                .upsert({
                    user_id: userId,
                    marketing_consent: consents.marketing,
                    analytics_consent: consents.analytics,
                    location_consent: consents.location,
                    third_party_consent: consents.thirdParty,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Log consent update
            await this.logDataAccess(userId, userId, 'update');

            console.log('User consent updated:', userId);
        } catch (error) {
            console.error('Error updating consent:', error);
            throw new Error('Rıza güncelleme başarısız oldu');
        }
    },

    /**
     * Get user consent preferences
     */
    async getConsent(userId: string): Promise<UserConsents | null> {
        try {
            const { data, error } = await supabase
                .from('user_consents')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) return null;

            return {
                marketing: data.marketing_consent || false,
                analytics: data.analytics_consent || false,
                location: data.location_consent || false,
                thirdParty: data.third_party_consent || false
            };
        } catch (error) {
            console.error('Error getting consent:', error);
            return null;
        }
    },

    /**
     * Log data access for audit trail
     * KVKK requirement: Track all data access
     */
    async logDataAccess(
        userId: string,
        accessedBy: string,
        accessType: 'export' | 'view' | 'update' | 'delete',
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        try {
            await supabase.from('data_access_logs').insert({
                user_id: userId,
                accessed_by: accessedBy,
                access_type: accessType,
                accessed_at: new Date().toISOString(),
                ip_address: ipAddress || null,
                user_agent: userAgent || null
            });
        } catch (error) {
            console.error('Error logging data access:', error);
            // Don't throw - logging failure shouldn't block the operation
        }
    },

    /**
     * Get data access logs for user
     */
    async getDataAccessLog(userId: string, limit = 50): Promise<DataAccessLog[]> {
        try {
            const { data, error } = await supabase
                .from('data_access_logs')
                .select('*')
                .eq('user_id', userId)
                .order('accessed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting data access log:', error);
            return [];
        }
    },

    /**
     * Cancel pending deletion request
     */
    async cancelDeletion(userId: string): Promise<void> {
        try {
            // Update deletion request status
            await supabase
                .from('deletion_requests')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('status', 'pending');

            // Reactivate user account
            const { error } = await supabase
                .from('users')
                .update({
                    is_active: true,
                    deleted_at: null
                })
                .eq('id', userId);

            if (error) throw error;

            console.log(`Deletion cancelled for user ${userId}`);
        } catch (error) {
            console.error('Error cancelling deletion:', error);
            throw new Error('Silme işlemi iptal edilemedi');
        }
    },

    /**
     * Get pending deletion request for user
     */
    async getDeletionRequest(userId: string): Promise<DeletionRequest | null> {
        try {
            const { data, error } = await supabase
                .from('deletion_requests')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data;
        } catch (error) {
            console.error('Error getting deletion request:', error);
            return null;
        }
    }
};
