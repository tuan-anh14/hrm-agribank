import { io, Socket } from 'socket.io-client';
import { getToken } from '@/utils/token.util';
import { ChatClientEvents, ChatServerEvents, SocketIOEvents } from '@/constants/chat.events';

/**
 * SocketService - Quản lý WebSocket connection cho Chat
 * Singleton pattern để đảm bảo chỉ có 1 connection duy nhất
 */
class SocketService {
  private socket: Socket | null = null;
  private readonly namespace = '/chat';
  // private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  /**
   * Kết nối đến WebSocket server
   * @param backendUrl - URL của backend server (default: từ env hoặc localhost:8080)
   */
  connect(backendUrl?: string): Socket | null {
    // Nếu đã có connection, không tạo mới
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getToken();
    if (!token) {
      console.warn('[SocketService] No token found, cannot connect to WebSocket');
      return null;
    }

    const url = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const socketUrl = `${url}${this.namespace}`;

    console.log('[SocketService] Connecting to:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token, // JWT token để authenticate
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    // Event handlers
    this.socket.on(SocketIOEvents.CONNECT, () => {
      console.log('[SocketService] Connected to chat server');

    });

    this.socket.on(SocketIOEvents.DISCONNECT, (reason) => {
      console.log('[SocketService] Disconnected from chat server:', reason);
    });

    this.socket.on(SocketIOEvents.ERROR, (error) => {
      console.error('[SocketService] Socket error:', error);
    });

    this.socket.on(SocketIOEvents.RECONNECT_ATTEMPT, (attemptNumber) => {
      console.log(`[SocketService] Reconnection attempt ${attemptNumber}`);

    });

    this.socket.on(SocketIOEvents.RECONNECT_ERROR, (error) => {
      console.error('[SocketService] Reconnection error:', error);
    });

    this.socket.on(SocketIOEvents.RECONNECT_FAILED, () => {
      console.error('[SocketService] Reconnection failed after max attempts');
    });

    return this.socket;
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting from chat server');
      this.socket.disconnect();
      this.socket = null;

    }
  }

  /**
   * Lấy socket instance hiện tại
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Kiểm tra xem đã kết nối chưa
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit event lên server
   */
  emit(event: ChatClientEvents, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] ❌ Socket not connected, cannot emit event:', event, data);
      return;
    }
    console.log('[SocketService] 📤 Emitting event:', event, data);
    this.socket.emit(event, data);
  }

  /**
   * Listen event từ server
   */
  on(event: ChatServerEvents | SocketIOEvents, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('[SocketService] Socket not initialized, cannot listen to event:', event);
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Remove listener
   */
  off(event: ChatServerEvents | SocketIOEvents, callback?: (data: any) => void): void {
    if (!this.socket) {
      return;
    }
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Reconnect manually
   */
  reconnect(backendUrl?: string): Socket | null {
    this.disconnect();
    return this.connect(backendUrl);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

