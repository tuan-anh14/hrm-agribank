import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AuditAction,
  AuditLog,
  AuditModule,
  AuditStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { QueryAuditLogDto } from '@/audit-log/dto/query-audit-log.dto';

interface CreateAuditLogInput {
  actorAccountId?: string | null;
  actorEmployeeId?: string | null;
  actorUsername?: string | null;
  actorRole?: Role | null;

  module: AuditModule;
  action: AuditAction;
  entityName?: string | null;
  entityId?: string | null;
  description?: string | null;
  beforeData?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  afterData?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  changedFields?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

  ipAddress?: string | null;
  userAgent?: string | null;
  status?: AuditStatus;
  errorMessage?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) { }

  async createLog(payload: CreateAuditLogInput): Promise<AuditLog> {
    const {
      status = AuditStatus.SUCCESS,
      ...rest
    } = payload;

    return this.prisma.auditLog.create({ data: { status, ...rest } });
  }

  async findAll(
    query: QueryAuditLogDto,
  ): Promise<{
    items: AuditLog[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      actorUsername,
      actorRole,
      module,
      action,
      entityName,
      entityId,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.AuditLogWhereInput = {};

    if (actorUsername) {
      where.actorUsername = {
        contains: actorUsername,
        mode: 'insensitive',
      };
    }

    if (actorRole) {
      where.actorRole = actorRole;
    }

    if (module) {
      where.module = module;
    }

    if (action) {
      where.action = action;
    }

    if (entityName) {
      where.entityName = {
        contains: entityName,
        mode: 'insensitive',
      };
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          actorAccountId: true,
          actorEmployeeId: true,
          actorUsername: true,
          actorRole: true,
          module: true,
          action: true,
          entityName: true,
          entityId: true,
          description: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }) as unknown as AuditLog[],
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    return this.prisma.auditLog.findUniqueOrThrow({
      where: { id },
    });
  }
}


