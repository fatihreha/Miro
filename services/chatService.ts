import { supabase } from './supabase';
import { Message } from '../types';

/**
 * Real-time Chat Service using Supabase
 * Features:
 * - Real-time message delivery
 * - Read receipts
 * - Typing indicators
 * - Message persistence
 * - AI safety checks integration
 */

export class ChatService {
    private activeSubscriptions: Map<string, any> = new Map();

    /**
     * Generate consistent chat ID from two user IDs
     */
    getChatId(user1: string, user2: string): string {
        return [user1, user2].sort().join('_');
    }

    /**
     * Get conversation messages between two users
     */
    async getMessages(currentUserId: string, otherUserId: string): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                return this.getLocalMessages(currentUserId, otherUserId);
            }

            // Convert snake_case to camelCase and format dates
            return (data || []).map(this.formatMessage);
        } catch (error) {
            console.error('Chat service error:', error);
            return this.getLocalMessages(currentUserId, otherUserId);
        }
    }

    /**
     * Send a new message
     */
    async sendMessage(
        senderId: string,
        recipientId: string,
        content: string,
        type: 'text' | 'image' | 'invite' | 'ai_plan' = 'text',
        metadata?: any
    ): Promise<Message | null> {
        try {
            const messageData = {
                sender_id: senderId,
                recipient_id: recipientId,
                content,
                message_type: type,
                metadata: metadata || null,
                is_read: false,
                is_safe: true, // Will be validated by AI in production
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (error) {
                console.error('Error sending message:', error);
                // Fallback to localStorage
                this.saveLocalMessage(senderId, recipientId, content, type, metadata);
                return null;
            }

            return this.formatMessage(data);
        } catch (error) {
            console.error('Send message error:', error);
            this.saveLocalMessage(senderId, recipientId, content, type, metadata);
            return null;
        }
    }

    /**
     * Mark messages as read
     */
    async markAsRead(currentUserId: string, otherUserId: string): Promise<void> {
        try {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', otherUserId)
                .eq('recipient_id', currentUserId)
                .eq('is_read', false);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    /**
     * Subscribe to real-time messages
     */
    subscribeToMessages(
        currentUserId: string,
        otherUserId: string,
        callback: (messages: Message[]) => void
    ): () => void {
        const channelName = `messages:${this.getChatId(currentUserId, otherUserId)}`;

        // Unsubscribe from existing channel if any
        if (this.activeSubscriptions.has(channelName)) {
            this.activeSubscriptions.get(channelName)?.unsubscribe();
        }

        // Initial fetch
        this.getMessages(currentUserId, otherUserId).then(callback);

        // Subscribe to new messages
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${otherUserId},recipient_id=eq.${currentUserId}`
                },
                (payload) => {
                    console.log('New message received:', payload);
                    // Fetch updated messages
                    this.getMessages(currentUserId, otherUserId).then(callback);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentUserId},recipient_id=eq.${otherUserId}`
                },
                (payload) => {
                    console.log('Message sent:', payload);
                    // Fetch updated messages
                    this.getMessages(currentUserId, otherUserId).then(callback);
                }
            )
            .subscribe();

        this.activeSubscriptions.set(channelName, channel);

        // Return cleanup function
        return () => {
            channel.unsubscribe();
            this.activeSubscriptions.delete(channelName);
        };
    }

    /**
     * Get unread message count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', userId)
                .eq('is_read', false);

            if (error) {
                console.error('Error getting unread count:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('Unread count error:', error);
            return 0;
        }
    }

    /**
     * Get all conversations for a user
     */
    async getConversations(userId: string): Promise<any[]> {
        try {
            // Get distinct conversation partners
            const { data, error } = await supabase
                .from('messages')
                .select('sender_id, recipient_id, content, created_at')
                .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching conversations:', error);
                return [];
            }

            // Group by conversation partner
            const conversations = new Map();
            data?.forEach((msg: any) => {
                const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
                if (!conversations.has(partnerId)) {
                    conversations.set(partnerId, {
                        partnerId,
                        lastMessage: msg.content,
                        timestamp: msg.created_at
                    });
                }
            });

            return Array.from(conversations.values());
        } catch (error) {
            console.error('Get conversations error:', error);
            return [];
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) {
                console.error('Error deleting message:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete message error:', error);
            return false;
        }
    }

    /**
     * Format message from database format to app format
     */
    private formatMessage(dbMessage: any): Message {
        return {
            id: dbMessage.id,
            senderId: dbMessage.sender_id,
            recipientId: dbMessage.recipient_id,
            text: dbMessage.content,
            type: dbMessage.message_type as any,
            timestamp: new Date(dbMessage.created_at),
            isAiGenerated: false,
            isFlagged: !dbMessage.is_safe,
            isRead: dbMessage.is_read,
            metadata: dbMessage.metadata,
            // Support for invite details
            ...(dbMessage.metadata?.inviteDetails && {
                inviteDetails: dbMessage.metadata.inviteDetails
            }),
            // Support for images
            ...(dbMessage.metadata?.image && {
                image: dbMessage.metadata.image
            })
        };
    }

    // ============ OFFLINE FALLBACK (localStorage) ============

    private readonly STORAGE_KEY = 'sportpulse_chats_v3';

    private getLocalMessages(user1: string, user2: string): Message[] {
        try {
            const chatId = this.getChatId(user1, user2);
            const allChats = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            const messages = allChats[chatId] || [];
            return messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }));
        } catch (e) {
            console.error('Error getting local messages:', e);
            return [];
        }
    }

    private saveLocalMessage(
        senderId: string,
        recipientId: string,
        content: string,
        type: string,
        metadata?: any
    ): void {
        try {
            const chatId = this.getChatId(senderId, recipientId);
            const allChats = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            const messages = allChats[chatId] || [];

            const newMessage: Message = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                senderId,
                recipientId,
                text: content,
                type: type as any,
                timestamp: new Date(),
                isAiGenerated: false,
                isFlagged: false,
                ...metadata
            };

            messages.push(newMessage);
            allChats[chatId] = messages;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allChats));

            // Trigger update event
            window.dispatchEvent(new CustomEvent('chat-update', { detail: { chatId } }));
        } catch (e) {
            console.error('Error saving local message:', e);
        }
    }

    /**
     * Cleanup all subscriptions
     */
    cleanup(): void {
        this.activeSubscriptions.forEach((channel) => {
            channel.unsubscribe();
        });
        this.activeSubscriptions.clear();
    }
}

// Export singleton instance
export const chatService = new ChatService();

// Cleanup on window unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        chatService.cleanup();
    });
}
