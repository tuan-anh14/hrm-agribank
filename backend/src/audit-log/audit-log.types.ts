import { AuditAction, AuditModule, AuditStatus, Role } from '@prisma/client';

export interface AuditActorContext {
  accountId?: string | null;
  employeeId?: string | null;
  username?: string | null;
  role?: Role | null;
}

export interface AuditRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface BaseAuditLogPayload {
  module: AuditModule;
  action: AuditAction;
  entityName?: string | null;
  entityId?: string | null;
  description?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  changedFields?: unknown;
  status?: AuditStatus;
  errorMessage?: string | null;
}


