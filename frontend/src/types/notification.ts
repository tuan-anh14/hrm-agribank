export const NotificationType = {
  SYSTEM: 'SYSTEM',
  PAYROLL: 'PAYROLL',
  ATTENDANCE: 'ATTENDANCE',
  REQUEST: 'REQUEST',
  SHIFT: 'SHIFT',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
  id: string;
  employeeId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationDetailResponse {
  data: Notification;
}

export interface UnreadCountResponse {
  count: number;
}

export interface QueryNotificationParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: string; // 'true' | 'false'
  fromDate?: string;
  toDate?: string;
}

export interface CreateNotificationPayload {
  employeeId: string;
  type: NotificationType;
  title: string;
  content: string;
}

export interface UpdateNotificationPayload {
  isRead?: boolean;
}
