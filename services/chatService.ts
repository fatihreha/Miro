import { supabase } from './supabase';
import { Message } from '../types';
import { presenceService } from './presenceService';
import { rateLimiter, RATE_LIMITS } from '../utils/rateLimit';

/**
 * Real-time Chat Service using Supabase
 * Features:
 * - Real-time message delivery
 * - Read receipts
 * - Typing indicators
 * - Message persistence
 * - AI safety checks integration
 * - Rate limiting to prevent spam
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
     * Send a new message with delivery guarantee and retry queue
     * Includes rate limiting to prevent spam
     */
    async sendMessage(
        senderId: string,
        recipientId: string,
        content: string,
        type: 'text' | 'image' | 'invite' | 'ai_plan' | 'photo_comment' = 'text',
        metadata?: any
    ): Promise<Message | null> {
        // Rate limiting check
        if (!rateLimiter.canMakeRequest(`message_${senderId}`, RATE_LIMITS.MESSAGE)) {
            console.warn('Rate limit exceeded for messages');
            return null;
        }

        const messageId = `msg_${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


        const messageData = {
            id: messageId,
            sender_id: senderId,
            recipient_id: recipientId,
            content,
            message_type: type,
            metadata: metadata || null,
            is_read: false,
            is_safe: true, // Will be validated by AI in production
            created_at: new Date().toISOString(),
            delivery_status: 'sending' // New field: sending, sent, delivered, failed
        };

        try {
            // Save to pending queue BEFORE sending
            this.addToPendingQueue(messageData);

            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (error) {
                console.error('Error sending message:', error);
                // Keep in queue for retry
                this.updateQueueStatus(messageId, 'failed');
                return null;
            }

            // Remove from pending queue on success
            this.removeFromPendingQueue(messageId);

            return this.formatMessage(data);
        } catch (error) {
            console.error('Send message error:', error);
            this.updateQueueStatus(messageId, 'failed');
            return null;
        }
    }

    /**
     * Add message to pending queue
     */
    private addToPendingQueue(messageData: any): void {
        try {
            const queue = this.getPendingQueue();
            queue.push({
                ...messageData,
                retryCount: 0,
                lastAttempt: Date.now()
            });
            localStorage.setItem('sportpulse_message_queue', JSON.stringify(queue));
            console.log('📤 Added to pending queue:', messageData.id);
        } catch (error) {
            console.error('Failed to add to queue:', error);
        }
    }

    /**
     * Get pending message queue
     * Includes TTL filter - messages older than 24 hours are automatically removed
     */
    private getPendingQueue(): any[] {
        const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

        try {
            const stored = localStorage.getItem('sportpulse_message_queue');
            if (!stored) return [];

            const queue = JSON.parse(stored);
            const now = Date.now();

            // Filter out expired messages (older than 24 hours)
            const validMessages = queue.filter((m: any) => {
                const messageAge = now - (m.timestamp || m.lastAttempt || 0);
                return messageAge < MAX_QUEUE_AGE_MS;
            });

            // If any messages were expired, update localStorage
            if (validMessages.length !== queue.length) {
                localStorage.setItem('sportpulse_message_queue', JSON.stringify(validMessages));
                console.log(`🗑️ Removed ${queue.length - validMessages.length} expired messages from queue`);
            }

            return validMessages;
        } catch {
            return [];
        }
    }

    /**
     * Update message status in queue
     */
    private updateQueueStatus(messageId: string, status: string): void {
        try {
            const queue = this.getPendingQueue();
            const message = queue.find(m => m.id === messageId);
            if (message) {
                message.delivery_status = status;
                message.lastAttempt = Date.now();
                message.retryCount = (message.retryCount || 0) + 1;
                localStorage.setItem('sportpulse_message_queue', JSON.stringify(queue));
            }
        } catch (error) {
            console.error('Failed to update queue status:', error);
        }
    }

    /**
     * Remove message from pending queue
     */
    private removeFromPendingQueue(messageId: string): void {
        try {
            const queue = this.getPendingQueue();
            const filtered = queue.filter(m => m.id !== messageId);
            localStorage.setItem('sportpulse_message_queue', JSON.stringify(filtered));
            console.log('✅ Removed from queue:', messageId);
        } catch (error) {
            console.error('Failed to remove from queue:', error);
        }
    }

    /**
     * Retry sending all pending messages
     */
    async retryPendingMessages(): Promise<void> {
        const queue = this.getPendingQueue();

        if (queue.length === 0) {
            return;
        }

        console.log(`🔄 Retrying ${queue.length} pending messages...`);

        for (const message of queue) {
            // Skip if too many retries
            if (message.retryCount >= 5) {
                console.log(`❌ Max retries reached for message ${message.id}`);
                continue;
            }

            // Skip if tried recently (exponential backoff)
            const timeSinceLastAttempt = Date.now() - message.lastAttempt;
            const backoffDelay = Math.min(1000 * Math.pow(2, message.retryCount), 30000);

            if (timeSinceLastAttempt < backoffDelay) {
                continue;
            }

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .insert({
                        id: message.id,
                        sender_id: message.sender_id,
                        recipient_id: message.recipient_id,
                        content: message.content,
                        message_type: message.message_type,
                        metadata: message.metadata,
                        is_read: false,
                        is_safe: message.is_safe,
                        created_at: message.created_at
                    })
                    .select()
                    .single();

                if (!error) {
                    console.log(`✅ Retry successful for message ${message.id}`);
                    this.removeFromPendingQueue(message.id);
                } else {
                    console.error(`Retry failed for message ${message.id}:`, error);
                    this.updateQueueStatus(message.id, 'failed');
                }
            } catch (error) {
                console.error(`Retry exception for message ${message.id}:`, error);
                this.updateQueueStatus(message.id, 'failed');
            }
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
     * Subscribe to real-time messages with deduplication and memory leak prevention
     */
    subscribeToMessages(
        currentUserId: string,
        otherUserId: string,
        callback: (messages: Message[]) => void
    ): () => void {
        const channelName = `messages:${this.getChatId(currentUserId, otherUserId)}`;
        const seenMessageIds = new Set<string>();

        // Unsubscribe from existing channel if any (prevent memory leak)
        if (this.activeSubscriptions.has(channelName)) {
            console.log('🧹 Cleaning up existing subscription:', channelName);
            const existing = this.activeSubscriptions.get(channelName);
            existing?.unsubscribe();
            this.activeSubscriptions.delete(channelName);
        }

        // Initial fetch
        this.getMessages(currentUserId, otherUserId).then((messages) => {
            messages.forEach(m => seenMessageIds.add(m.id));
            callback(messages);
        });

        // Retry pending messages on connection
        this.retryPendingMessages();

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
                    const messageId = payload.new?.id;

                    // Deduplication: ignore if already seen
                    if (seenMessageIds.has(messageId)) {
                        console.log('🔄 Duplicate message ignored:', messageId);
                        return;
                    }

                    seenMessageIds.add(messageId);
                    console.log('📨 New message received:', messageId);

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
                    const messageId = payload.new?.id;

                    // Deduplication
                    if (seenMessageIds.has(messageId)) {
                        return;
                    }

                    seenMessageIds.add(messageId);
                    console.log('📤 Message sent:', messageId);

                    // Fetch updated messages
                    this.getMessages(currentUserId, otherUserId).then(callback);
                }
            )
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);

                // Retry pending on reconnect
                if (status === 'SUBSCRIBED') {
                    this.retryPendingMessages();
                }
            });

        this.activeSubscriptions.set(channelName, channel);
        console.log('✅ Subscribed to channel:', channelName);

        // Return cleanup function
        return () => {
            console.log('🧹 Unsubscribing from channel:', channelName);
            channel.unsubscribe();
            this.activeSubscriptions.delete(channelName);
            seenMessageIds.clear();
        };
    }

    /**
     * Cleanup all active subscriptions (call on app unmount or logout)
     */
    cleanupAllSubscriptions(): void {
        console.log(`🧹 Cleaning up ${this.activeSubscriptions.size} active subscriptions`);

        this.activeSubscriptions.forEach((channel, channelName) => {
            console.log('Unsubscribing from:', channelName);
            channel.unsubscribe();
        });

        this.activeSubscriptions.clear();
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

    // ============ TYPING INDICATORS ============

    /**
     * Send typing indicator to chat partner
     */
    async sendTypingIndicator(toUserId: string, isTyping: boolean): Promise<void> {
        await presenceService.sendTypingIndicator(toUserId, isTyping);
    }

    /**
     * Subscribe to typing status from chat partner
     */
    subscribeToTyping(fromUserId: string, callback: (isTyping: boolean) => void): () => void {
        return presenceService.subscribeToTyping(fromUserId, callback);
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
