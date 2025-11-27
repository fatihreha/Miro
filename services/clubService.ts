import { supabase } from './supabase';

/**
 * Club & Community Service
 * Features:
 * - Club management
 * - Membership handling
 * - Join requests
 * - Real-time updates
 */

export class ClubService {
    private activeSubscriptions: Map<string, any> = new Map();

    /**
     * Get all clubs with optional filters
     */
    async getClubs(filters?: { sport?: string; search?: string }): Promise<any[]> {
        try {
            let query = supabase
                .from('clubs')
                .select(`
          *,
          owner:users!clubs_owner_id_fkey(name, avatar_url)
        `)
                .order('member_count', { ascending: false });

            if (filters?.sport) {
                query = query.eq('sport', filters.sport);
            }

            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching clubs:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get clubs error:', error);
            return [];
        }
    }

    /**
     * Get club by ID with full details
     */
    async getClubById(clubId: string): Promise<any | null> {
        try {
            const { data: club, error } = await supabase
                .from('clubs')
                .select(`
          *,
          owner:users!clubs_owner_id_fkey(*)
        `)
                .eq('id', clubId)
                .single();

            if (error) {
                console.error('Error fetching club:', error);
                return null;
            }

            // Get members
            const { data: members } = await supabase
                .from('club_members')
                .select(`
          *,
          user:users(*)
        `)
                .eq('club_id', clubId);

            return {
                ...club,
                members: members || []
            };
        } catch (error) {
            console.error('Get club error:', error);
            return null;
        }
    }

    /**
     * Create a new club
     */
    async createClub(clubData: {
        name: string;
        description: string;
        sport: string;
        ownerId: string;
        isPrivate?: boolean;
        avatarUrl?: string;
    }): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('clubs')
                .insert({
                    name: clubData.name,
                    description: clubData.description,
                    sport: clubData.sport,
                    owner_id: clubData.ownerId,
                    is_private: clubData.isPrivate || false,
                    avatar_url: clubData.avatarUrl,
                    member_count: 1
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating club:', error);
                return null;
            }

            // Auto-add owner as member
            await supabase.from('club_members').insert({
                club_id: data.id,
                user_id: clubData.ownerId,
                role: 'owner'
            });

            return data;
        } catch (error) {
            console.error('Create club error:', error);
            return null;
        }
    }

    /**
     * Join a club (send request or auto-join for public clubs)
     */
    async joinClub(clubId: string, userId: string): Promise<boolean> {
        try {
            // Check if club is private
            const { data: club } = await supabase
                .from('clubs')
                .select('is_private')
                .eq('id', clubId)
                .single();

            if (club?.is_private) {
                // Create join request
                const { error } = await supabase
                    .from('club_join_requests')
                    .insert({
                        club_id: clubId,
                        user_id: userId,
                        status: 'pending'
                    });

                return !error;
            } else {
                // Auto-join public club
                const { error } = await supabase
                    .from('club_members')
                    .insert({
                        club_id: clubId,
                        user_id: userId,
                        role: 'member'
                    });

                return !error;
            }
        } catch (error) {
            console.error('Join club error:', error);
            return false;
        }
    }

    /**
     * Leave a club
     */
    async leaveClub(clubId: string, userId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('club_members')
                .delete()
                .eq('club_id', clubId)
                .eq('user_id', userId);

            return !error;
        } catch (error) {
            console.error('Leave club error:', error);
            return false;
        }
    }

    /**
     * Get join requests for a club (admins only)
     */
    async getJoinRequests(clubId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('club_join_requests')
                .select(`
          *,
          user:users(*)
        `)
                .eq('club_id', clubId)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching join requests:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Get join requests error:', error);
            return [];
        }
    }

    /**
     * Approve join request
     */
    async approveJoinRequest(requestId: string): Promise<boolean> {
        try {
            // Get request details
            const { data: request } = await supabase
                .from('club_join_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (!request) return false;

            // Add user to club
            await supabase.from('club_members').insert({
                club_id: request.club_id,
                user_id: request.user_id,
                role: 'member'
            });

            // Update request status
            await supabase
                .from('club_join_requests')
                .update({ status: 'approved' })
                .eq('id', requestId);

            return true;
        } catch (error) {
            console.error('Approve request error:', error);
            return false;
        }
    }

    /**
     * Reject join request
     */
    async rejectJoinRequest(requestId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('club_join_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            return !error;
        } catch (error) {
            console.error('Reject request error:', error);
            return false;
        }
    }

    /**
     * Get user's clubs
     */
    async getUserClubs(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('club_members')
                .select(`
          *,
          club:clubs(*)
        `)
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching user clubs:', error);
                return [];
            }

            return (data || []).map((m: any) => m.club);
        } catch (error) {
            console.error('Get user clubs error:', error);
            return [];
        }
    }

    /**
     * Subscribe to club updates
     */
    subscribeToClubUpdates(clubId: string, callback: () => void): () => void {
        const channelName = `club:${clubId}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'club_members',
                    filter: `club_id=eq.${clubId}`
                },
                callback
            )
            .subscribe();

        this.activeSubscriptions.set(channelName, channel);

        return () => {
            channel.unsubscribe();
            this.activeSubscriptions.delete(channelName);
        };
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        this.activeSubscriptions.forEach((channel) => channel.unsubscribe());
        this.activeSubscriptions.clear();
    }
}

export const clubService = new ClubService();
