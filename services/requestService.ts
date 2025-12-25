import { supabase } from './supabase';
import { ActivityRequest } from '../types';

/**
 * Real-time Workout Request Service using Supabase
 * Features:
 * - Send/receive workout invitations
 * - Real-time status updates
 * - Request management
 */

export class RequestService {
  private activeSubscriptions: Map<string, any> = new Map();

  /**
   * Send a new workout request
   */
  async sendRequest(request: Omit<ActivityRequest, 'id'>): Promise<ActivityRequest | null> {
    try {
      const requestData = {
        from_user_id: request.senderId,
        to_user_id: request.receiverId,
        sport: request.sport,
        location: request.location,
        scheduled_date: request.date,
        scheduled_time: request.time,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('workout_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('Error sending request:', error);
        this.saveLocalRequest(request);
        return null;
      }

      return this.formatRequest(data);
    } catch (error) {
      console.error('Send request error:', error);
      this.saveLocalRequest(request);
      return null;
    }
  }

  /**
   * Get incoming requests for a user
   */
  async getIncomingRequests(userId: string): Promise<ActivityRequest[]> {
    try {
      const { data, error } = await supabase
        .from('workout_requests')
        .select(`
          *,
          sender:users!workout_requests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', userId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return this.getLocalRequests(userId);
      }

      return (data || []).map(this.formatRequest);
    } catch (error) {
      console.error('Get requests error:', error);
      return this.getLocalRequests(userId);
    }
  }

  /**
   * Get sent requests by a user
   */
  async getSentRequests(userId: string): Promise<ActivityRequest[]> {
    try {
      const { data, error } = await supabase
        .from('workout_requests')
        .select(`
          *,
          recipient:users!workout_requests_to_user_id_fkey(*)
        `)
        .eq('from_user_id', userId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sent requests:', error);
        return [];
      }

      return (data || []).map(this.formatRequest);
    } catch (error) {
      console.error('Get sent requests error:', error);
      return [];
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    status: 'accepted' | 'rejected' | 'completed' | 'in_progress'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workout_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        this.updateLocalRequestStatus(requestId, status);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update request error:', error);
      this.updateLocalRequestStatus(requestId, status);
      return false;
    }
  }

  /**
   * Accept a request
   */
  async acceptRequest(requestId: string): Promise<boolean> {
    return this.updateRequestStatus(requestId, 'accepted');
  }

  /**
   * Reject a request
   */
  async rejectRequest(requestId: string): Promise<boolean> {
    return this.updateRequestStatus(requestId, 'rejected');
  }

  /**
   * Subscribe to real-time requests
   */
  subscribeToRequests(userId: string, callback: (requests: ActivityRequest[]) => void): () => void {
    const channelName = `requests:${userId}`;

    // Initial fetch
    this.getIncomingRequests(userId).then(callback);

    // Subscribe to new requests
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_requests',
          filter: `to_user_id=eq.${userId}`
        },
        () => {
          console.log('Request update');
          this.getIncomingRequests(userId).then(callback);
        }
      )
      .subscribe();

    this.activeSubscriptions.set(channelName, channel);

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      this.activeSubscriptions.delete(channelName);
    };
  }

  /**
   * Format database request to app format
   */
  private formatRequest(dbRequest: any): ActivityRequest {
    return {
      id: dbRequest.id,
      senderId: dbRequest.from_user_id,
      receiverId: dbRequest.to_user_id,
      senderName: dbRequest.sender?.name || 'Unknown',
      senderAvatar: dbRequest.sender?.avatar_url || '',
      sport: dbRequest.sport,
      date: dbRequest.scheduled_date,
      time: dbRequest.scheduled_time,
      location: dbRequest.location,
      status: dbRequest.status,
      timestamp: new Date(dbRequest.created_at || Date.now())
    };
  }

  // ============ OFFLINE FALLBACK (localStorage) ============

  private readonly STORAGE_KEY = 'sportpulse_requests_v2';

  private saveLocalRequest(request: Omit<ActivityRequest, 'id'>): void {
    try {
      const requests = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      const newRequest = {
        ...request,
        id: Date.now().toString(),
        status: 'pending'
      };
      requests.push(newRequest);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      window.dispatchEvent(new Event('request-update'));
    } catch (e) {
      console.error('Error saving local request:', e);
    }
  }

  private getLocalRequests(userId: string): ActivityRequest[] {
    try {
      const requests = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      return requests.filter((r: any) => r.receiverId === userId || r.receiverId === 'me');
    } catch (e) {
      console.error('Error getting local requests:', e);
      return [];
    }
  }

  private updateLocalRequestStatus(requestId: string, status: string): void {
    try {
      const requests = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      const updated = requests.map((r: any) =>
        r.id === requestId ? { ...r, status } : r
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('request-update'));
    } catch (e) {
      console.error('Error updating local request:', e);
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    this.activeSubscriptions.clear();
  }
}

// Export singleton
export const requestService = new RequestService();

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestService.cleanup();
  });
}
