import { AuditAction, AuditModule, AuditStatus, Role } from '@prisma/client';

export class AuditLogItemDto {
  id: string;
  actorAccountId: string | null;
  actorEmployeeId: string | null;
  actorUsername: string | null;
  actorRole: Role | null;

  module: AuditModule;
  action: AuditAction;
  entityName: string | null;
  entityId: string | null;
  description: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  createdAt: Date;
}

export class AuditLogDetailDto {
  data: {
    id: string;
    actorAccountId: string | null;
    actorEmployeeId: string | null;
    actorUsername: string | null;
    actorRole: Role | null;

    module: AuditModule;
    action: AuditAction;
    entityName: string | null;
    entityId: string | null;
    description: string | null;
    beforeData: unknown | null;
    afterData: unknown | null;
    changedFields: unknown | null;

    ipAddress: string | null;
    userAgent: string | null;
    status: AuditStatus;
    errorMessage: string | null;
    createdAt: Date;
  };
}

export class AuditLogListResponseDto {
  items: AuditLogItemDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


