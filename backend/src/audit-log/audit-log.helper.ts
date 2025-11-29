import { Request } from 'express';
import { Prisma, Role } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';
import {
  AuditActorContext,
  AuditRequestContext,
  BaseAuditLogPayload,
} from '@/audit-log/audit-log.types';

interface JwtUserPayload {
  userId?: string;
  accountId?: string;
  employeeId?: string;
  username?: string;
  role?: Role;
  [key: string]: any;
}

export function extractActorFromRequest(req: Request): AuditActorContext {
  const user = (req.user || {}) as JwtUserPayload;

  return {
    accountId: user.accountId ?? user.userId ?? null,
    employeeId: user.employeeId ?? null,
    username: user.username ?? null,
    role: user.role ?? null,
  };
}

export function extractRequestContext(req: Request): AuditRequestContext {
  const ip =
    (req.headers['x-forwarded-for'] as string) ||
    req.ip ||
    req.socket?.remoteAddress ||
    null;

  return {
    ipAddress: ip,
    userAgent: (req.headers['user-agent'] as string) || null,
  };
}

export async function writeAuditLog(
  auditLogService: AuditLogService,
  options: {
    base: BaseAuditLogPayload;
    actor?: AuditActorContext;
    request?: AuditRequestContext;
  },
) {
  const { base, actor, request } = options;

  const beforeData =
    base.beforeData === undefined
      ? Prisma.JsonNull
      : (base.beforeData as Prisma.InputJsonValue);
  const afterData =
    base.afterData === undefined
      ? Prisma.JsonNull
      : (base.afterData as Prisma.InputJsonValue);
  const changedFields =
    base.changedFields === undefined
      ? Prisma.JsonNull
      : (base.changedFields as Prisma.InputJsonValue);

  return auditLogService.createLog({
    module: base.module,
    action: base.action,
    entityName: base.entityName,
    entityId: base.entityId,
    description: base.description,
    status: base.status,
    errorMessage: base.errorMessage,
    beforeData,
    afterData,
    changedFields,
    actorAccountId: actor?.accountId ?? null,
    actorEmployeeId: actor?.employeeId ?? null,
    actorUsername: actor?.username ?? null,
    actorRole: actor?.role ?? null,
    ipAddress: request?.ipAddress ?? null,
    userAgent: request?.userAgent ?? null,
  });
}


