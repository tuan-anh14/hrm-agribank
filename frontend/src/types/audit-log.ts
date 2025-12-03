export const AuditModule = {
  AUTH: 'AUTH',
  EMPLOYEE: 'EMPLOYEE',
  DEPARTMENT: 'DEPARTMENT',
  POSITION: 'POSITION',
  ATTENDANCE: 'ATTENDANCE',
  WORKSCHEDULE: 'WORKSCHEDULE',
  SHIFT: 'SHIFT',
  PAYROLL: 'PAYROLL',
  REWARD_PENALTY: 'REWARD_PENALTY',
  REQUEST: 'REQUEST',
  NOTIFICATION: 'NOTIFICATION',
} as const;

export type AuditModule = typeof AuditModule[keyof typeof AuditModule];

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ACTIVATE_ACCOUNT: 'ACTIVATE_ACCOUNT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  GENERATE_PAYROLL: 'GENERATE_PAYROLL',
  UPDATE_STATUS: 'UPDATE_STATUS',
  PAY: 'PAY',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export const AuditStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export type AuditStatus = typeof AuditStatus[keyof typeof AuditStatus];

export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE';

export interface AuditLog {
  id: string;
  actorAccountId?: string | null;
  actorEmployeeId?: string | null;
  actorUsername?: string | null;
  actorRole?: Role | null;
  module: AuditModule;
  action: AuditAction;
  entityName?: string | null;
  entityId?: string | null;
  description?: string | null;
  status: AuditStatus;
  createdAt: string;
}

export interface AuditLogDetail extends AuditLog {
  beforeData?: any | null;
  afterData?: any | null;
  changedFields?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  errorMessage?: string | null;
}

export interface QueryAuditLogParams {
  actorUsername?: string;
  actorRole?: Role;
  module?: AuditModule;
  action?: AuditAction;
  entityName?: string;
  entityId?: string;
  status?: AuditStatus;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogDetailResponse {
  data: AuditLogDetail;
}
