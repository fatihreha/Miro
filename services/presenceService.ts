import { supabase } from './supabase';

/**
 * Presence Service - Real-time Typing & Online Status
 * 
 * Features:
 * - Typing indicators for chat
 * - Online/offline user status
 * - Last seen tracking
 * - Automatic cleanup on disconnect
 */

interface PresenceState {
    userId: string;
    status: 'online' | 'away' | 'offline';
    lastSeen: string;
    typing?: boolean;
    typingTo?: string;
}

class PresenceService {
    private presenceChannel: any = null;
    private typingChannels: Map<string, any> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private currentUserId: string | null = null;

    /**
     * Initialize presence for current user
     */
    async initialize(userId: string): Promise<void> {
        this.currentUserId = userId;

        // Create presence channel
        this.presenceChannel = supabase.channel('presence:global', {
            config: {
                presence: {
                    key: userId
                }
            }
        });

        // Track user presence
        await this.presenceChannel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                await this.presenceChannel.track({
                    userId,
                    status: 'online',
                    lastSeen: new Date().toISOString()
                });
            }
        });

        // Start heartbeat for last_active updates
        this.startHeartbeat(userId);

        // Update database status
        await this.updateDatabaseStatus(userId, 'online');

        console.log('✅ Presence initialized for:', userId);
    }

    /**
     * Subscribe to a specific user's presence
     */
    subscribeToUserPresence(
        targetUserId: string,
        callback: (state: PresenceState | null) => void
    ): () => void {
        const channel = supabase.channel(`presence:user:${targetUserId}`, {
            config: {
                presence: {
                    key: targetUserId
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState() as Record<string, unknown[]>;
                const userState = state[targetUserId]?.[0] as unknown as PresenceState | undefined;
                callback(userState || null);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                if (key === targetUserId) {
                    callback(newPresences[0] as unknown as PresenceState);
                }
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                if (key === targetUserId) {
                    callback({
                        userId: targetUserId,
                        status: 'offline',
                        lastSeen: new Date().toISOString()
                    });
                }
            })
            .subscribe();

        return () => {
            if (channel && typeof channel.unsubscribe === 'function') {
                channel.unsubscribe();
            }
        };
    }

    /**
     * Get multiple users' online status
     */
    subscribeToMultipleUsers(
        userIds: string[],
        callback: (statuses: Map<string, PresenceState>) => void
    ): () => void {
        const channel = supabase.channel('presence:bulk');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState() as Record<string, unknown[]>;
                const statuses = new Map<string, PresenceState>();

                userIds.forEach(userId => {
                    const userState = state[userId]?.[0] as unknown as PresenceState | undefined;
                    if (userState) {
                        statuses.set(userId, userState);
                    } else {
                        statuses.set(userId, {
                            userId,
                            status: 'offline',
                            lastSeen: ''
                        });
                    }
                });

                callback(statuses);
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }

    // ============ TYPING INDICATORS ============

    /**
     * Send typing indicator to a specific user
     */
    async sendTypingIndicator(toUserId: string, isTyping: boolean): Promise<void> {
        if (!this.currentUserId) return;

        const channelKey = this.getTypingChannelKey(this.currentUserId, toUserId);
        let channel = this.typingChannels.get(channelKey);

        if (!channel) {
            channel = supabase.channel(`typing:${channelKey}`, {
                config: {
                    presence: {
                        key: this.currentUserId
                    }
                }
            });
            await channel.subscribe();
            this.typingChannels.set(channelKey, channel);
        }

        await channel.track({
            userId: this.currentUserId,
            typing: isTyping,
            typingTo: toUserId,
            timestamp: Date.now()
        });

        // Auto-clear typing after 3 seconds
        if (isTyping) {
            setTimeout(() => {
                this.sendTypingIndicator(toUserId, false);
            }, 3000);
        }
    }

    /**
     * Subscribe to typing status from a specific user
     */
    subscribeToTyping(
        fromUserId: string,
        callback: (isTyping: boolean) => void
    ): () => void {
        if (!this.currentUserId) {
            return () => { };
        }

        const channelKey = this.getTypingChannelKey(fromUserId, this.currentUserId);
        const channel = supabase.channel(`typing:${channelKey}`, {
            config: {
                presence: {
                    key: fromUserId
                }
            }
        });

        let typingTimeout: NodeJS.Timeout | null = null;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const senderState = state[fromUserId]?.[0] as any;

                if (senderState?.typing && senderState?.typingTo === this.currentUserId) {
                    callback(true);

                    // Clear after 3 seconds of no updates
                    if (typingTimeout) clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => callback(false), 3000);
                } else {
                    callback(false);
                }
            })
            .subscribe();

        return () => {
            if (typingTimeout) clearTimeout(typingTimeout);
            channel.unsubscribe();
        };
    }

    // ============ HELPERS ============

    private getTypingChannelKey(user1: string, user2: string): string {
        return [user1, user2].sort().join('_');
    }

    private startHeartbeat(userId: string): void {
        // Update last_active every 60 seconds
        this.heartbeatInterval = setInterval(async () => {
            await supabase
                .from('users')
                .update({ last_active: new Date().toISOString() })
                .eq('id', userId);
        }, 60000);
    }

    private async updateDatabaseStatus(userId: string, status: 'online' | 'offline'): Promise<void> {
        await supabase
            .from('users')
            .update({
                last_active: new Date().toISOString(),
                // Add status field if exists
            })
            .eq('id', userId);
    }

    /**
     * Get user's online status from database (fallback)
     */
    async getUserStatus(userId: string): Promise<'online' | 'away' | 'offline'> {
        const { data } = await supabase
            .from('users')
            .select('last_active')
            .eq('id', userId)
            .single();

        if (!data?.last_active) return 'offline';

        const lastActive = new Date(data.last_active);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;

        if (diffMinutes < 2) return 'online';
        if (diffMinutes < 10) return 'away';
        return 'offline';
    }

    /**
     * Format last seen for display
     */
    formatLastSeen(lastSeen: string): string {
        if (!lastSeen) return '';

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

        if (diffMinutes < 1) return 'Şimdi aktif';
        if (diffMinutes < 60) return `${diffMinutes} dk önce`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} saat önce`;
        return `${Math.floor(diffMinutes / 1440)} gün önce`;
    }

    /**
     * Cleanup on logout or app close
     */
    async cleanup(): Promise<void> {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.currentUserId) {
            await this.updateDatabaseStatus(this.currentUserId, 'offline');
        }

        if (this.presenceChannel) {
            await this.presenceChannel.unsubscribe();
        }

        this.typingChannels.forEach(channel => channel.unsubscribe());
        this.typingChannels.clear();

        this.currentUserId = null;
        console.log('👋 Presence cleaned up');
    }
}

// Export singleton
export const presenceService = new PresenceService();

// Cleanup on unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        presenceService.cleanup();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            // User switched tabs - update to away
            console.log('User went away');
        } else {
            // User came back - update to online
            console.log('User came back');
        }
    });
}
