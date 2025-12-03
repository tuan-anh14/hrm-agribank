/**
 * Socket.IO Events Constants cho Chat Module (Frontend)
 * Định nghĩa tất cả các events được sử dụng giữa client và server
 * 
 * Convention:
 * - Client -> Server: action verbs (send, join, leave, start, stop)
 * - Server -> Client: noun or past tense (new, joined, left, error)
 */

/**
 * Events từ Client gửi lên Server
 */
export const ChatClientEvents = {
  /** Gửi tin nhắn mới */
  MESSAGE_SEND: 'message:send',

  /** Join vào một room cụ thể */
  ROOM_JOIN: 'room:join',

  /** Leave khỏi một room */
  ROOM_LEAVE: 'room:leave',

  /** Bắt đầu typing indicator */
  TYPING_START: 'typing:start',

  /** Dừng typing indicator */
  TYPING_STOP: 'typing:stop',
} as const;

export type ChatClientEvents = typeof ChatClientEvents[keyof typeof ChatClientEvents];

/**
 * Events từ Server gửi xuống Client
 */
export const ChatServerEvents = {
  /** Tin nhắn mới được gửi */
  MESSAGE_NEW: 'message:new',

  /** Lỗi khi gửi tin nhắn */
  MESSAGE_ERROR: 'message:error',

  /** Đã join vào room thành công */
  ROOM_JOINED: 'room:joined',

  /** Đã leave khỏi room */
  ROOM_LEFT: 'room:left',

  /** User đang typing */
  TYPING_USER: 'typing:user',

  /** User dừng typing */
  TYPING_STOP: 'typing:stop',

  /** Trạng thái user thay đổi (online/offline) */
  USER_STATUS_CHANGED: 'user:status:changed',

  /** Rooms được cập nhật */
  ROOMS_UPDATED: 'rooms:updated',
} as const;

export type ChatServerEvents = typeof ChatServerEvents[keyof typeof ChatServerEvents];

/**
 * Socket.IO built-in events
 */
export const SocketIOEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECTING: 'reconnecting',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
} as const;

export type SocketIOEvents = typeof SocketIOEvents[keyof typeof SocketIOEvents];

/**
 * Tất cả chat events (combine client và server events)
 */
export const ChatEvents = {
  Client: ChatClientEvents,
  Server: ChatServerEvents,
  SocketIO: SocketIOEvents,
} as const;

/**
 * Type helper để type-safe khi sử dụng events
 */
export type ChatClientEvent = ChatClientEvents;
export type ChatServerEvent = ChatServerEvents;
export type SocketIOEvent = SocketIOEvents;
