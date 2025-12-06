
import { Message } from '../types';

type MessageListener = (message: Message) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectTimeout: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectDelay: number = 30000; // 30 seconds max
  
  // Using echo.websocket.org for demonstration of socket connection state.
  // Real broadcasting is simulated via BroadcastChannel API for multi-tab experience in this demo environment.
  private readonly URL = 'wss://echo.websocket.org';
  private readonly CHANNEL_NAME = 'sportpulse_chat_channel';

  connect() {
    // Initialize Broadcast Channel for local multi-tab sync (Simulates server room broadcast)
    if (!this.broadcastChannel) {
        this.broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
            // When we receive a broadcast from another tab, treat it as an incoming message
            const data = event.data;
            if (data.timestamp) {
                data.timestamp = new Date(data.timestamp);
            }
            this.notifyListeners(data);
        };
    }

    if (this.socket?.readyState === WebSocket.OPEN) return;

    try {
      this.socket = new WebSocket(this.URL);

      this.socket.onopen = () => {
        console.log('WebSocket Service: Connected');
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Ensure timestamp is properly hydrated to a Date object
          if (data.timestamp) {
            data.timestamp = new Date(data.timestamp);
          }
          
          // The echo server sends back our own message. 
          // We notify listeners, but the UI layer usually dedupes based on ID.
          this.notifyListeners(data);
        } catch (error) {
          console.error('WebSocket Service: Failed to parse message', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket Service: Disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket Service: Error', error);
      };

    } catch (e) {
      console.error('WebSocket Service: Connection failed', e);
      this.attemptReconnect();
    }
  }

  sendMessage(message: Message) {
    // 1. Broadcast to other connected clients (Simulated via Tabs)
    if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(message);
    }

    // 2. Send to WebSocket (Echo server for connection health check)
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket Service: Socket not connected, message only broadcast locally');
    }
  }

  subscribe(listener: MessageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(message: Message) {
    this.listeners.forEach(listener => listener(message));
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) return;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    
    console.log(`WebSocket Service: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
      this.reconnectTimeout = null;
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.broadcastChannel) {
        this.broadcastChannel.close();
        this.broadcastChannel = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }
}

export const webSocketService = new WebSocketService();
