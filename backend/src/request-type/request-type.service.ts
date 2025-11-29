import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, RequestType, AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { writeAuditLog, getActorContextFromUser } from '@/audit-log/audit-log.helper';
import { CreateRequestTypeDto } from './dto/create-request-type.dto';
import { UpdateRequestTypeDto } from './dto/update-request-type.dto';

@Injectable()
export class RequestTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getAll(): Promise<RequestType[]> {
    return this.prisma.requestType.findMany({
      include: {
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<RequestType> {
    const requestType = await this.prisma.requestType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    });
    if (!requestType) {
      throw new NotFoundException(`RequestType with ID ${id} not found`);
    }
    return requestType;
  }

  async create(
    data: CreateRequestTypeDto,
    user?: any,
  ): Promise<RequestType> {
    // Kiểm tra trùng tên
    const existing = await this.prisma.requestType.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Tên loại đơn đã tồn tại');
    }

    try {
      const requestType = await this.prisma.requestType.create({ data });

      const actorContext = await getActorContextFromUser(this.prisma, user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.CREATE,
          status: AuditStatus.SUCCESS,
          entityName: 'RequestType',
          entityId: requestType.id,
          afterData: requestType,
          description: `Tạo loại đơn ${requestType.name}`,
        },
        actor: actorContext,
      });

      return requestType;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Tên loại đơn phải là duy nhất');
        }
      }
      throw new BadRequestException('Không thể tạo loại đơn');
    }
  }

  async update(
    id: string,
    data: UpdateRequestTypeDto,
    user?: any,
  ): Promise<RequestType> {
    // Kiểm tra trùng tên nếu có cập nhật tên
    if (data.name) {
      const conflict = await this.prisma.requestType.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException('Tên loại đơn đã tồn tại');
      }
    }

    try {
      const before = await this.prisma.requestType.findUnique({
        where: { id },
      });
      if (!before) {
        throw new NotFoundException(`RequestType with ID ${id} not found`);
      }

      const requestType = await this.prisma.requestType.update({
        where: { id },
        data,
      });

      const actorContext = await getActorContextFromUser(this.prisma, user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.UPDATE,
          status: AuditStatus.SUCCESS,
          entityName: 'RequestType',
          entityId: requestType.id,
          beforeData: before,
          afterData: requestType,
          description: `Cập nhật loại đơn ${requestType.name}`,
        },
        actor: actorContext,
      });

      return requestType;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`RequestType with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Không thể cập nhật loại đơn');
    }
  }

  async delete(id: string, user?: any): Promise<RequestType> {
    // Kiểm tra xem có đơn nào đang sử dụng loại đơn này không
    const requestCount = await this.prisma.request.count({
      where: { requestTypeId: id },
    });
    if (requestCount > 0) {
      throw new BadRequestException(
        'Không thể xóa loại đơn đang được sử dụng bởi các đơn',
      );
    }

    try {
      const before = await this.prisma.requestType.findUnique({
        where: { id },
      });

      const requestType = await this.prisma.requestType.delete({
        where: { id },
      });

      const actorContext = await getActorContextFromUser(this.prisma, user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.DELETE,
          status: AuditStatus.SUCCESS,
          entityName: 'RequestType',
          entityId: id,
          beforeData: before ?? undefined,
          description: `Xóa loại đơn với ID ${id}`,
        },
        actor: actorContext,
      });

      return requestType;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`RequestType with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Không thể xóa loại đơn');
    }
  }
}

