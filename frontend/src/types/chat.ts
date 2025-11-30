/**
 * Chat Types - Định nghĩa tất cả types liên quan đến Chat feature
 * Tuân thủ với Prisma schema và Backend API
 */

export enum ChatRoomType {
  COMPANY_WIDE = 'COMPANY_WIDE',
  DEPARTMENT_HRM = 'DEPARTMENT_HRM',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
}

export interface ChatRoomParticipant {
  id: string;
  roomId: string;
  employeeId: string;
  joinedAt: string;
  lastReadAt?: string | null;
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
  };
}

export interface ChatMessageSender {
  id: string;
  fullName: string;
  employeeCode: string;
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatMessageSender;
}

export interface ChatRoom {
  id: string;
  departmentId?: string | null;
  name: string;
  type: ChatRoomType;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  lastMessage?: ChatMessage | null;
  participants?: ChatRoomParticipant[];
  otherParticipant?: {
    id: string;
    fullName: string;
    employeeCode: string;
  } | null;
}

export interface ChatRoomsResponse {
  company: ChatRoom | null;
  departments: ChatRoom[];
  directMessages: ChatRoom[];
}

export interface ChatMessageListResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMessagePayload {
  content: string;
}

export interface CreateDirectMessageRoomPayload {
  otherUserId: string;
}

export interface QueryMessageParams {
  page?: number;
  limit?: number;
}

export interface MarkRoomAsReadResponse {
  count: number;
}

