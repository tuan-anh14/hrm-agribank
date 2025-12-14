import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditModule, AuditStatus, Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { QueryRequestDto } from './dto/query-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { NotificationService } from '@/notification/notification.service';
import {
  notifyRequestCreated,
  notifyRequestApproved,
  notifyRequestRejected,
} from '@/notification/notification-templates.helper';
import { writeAuditLog, getActorContextFromUser } from '@/audit-log/audit-log.helper';
import { UserRole } from '@/auth/constants/roles.constants';

@Injectable()
export class RequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) { }

  private readonly includeRelations: Prisma.RequestInclude = {
    employee: {
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, title: true },
        },
      },
    },
    requestType: true,
    approvedBy: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
  };

  private normalizeDate(dateInput: string | Date): Date {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }
    return date;
  }

  private async ensureEmployeeAndRequestTypeExist(
    employeeId: string,
    requestTypeId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Không tìm thấy nhân viên ID ${employeeId}`);
    }

    const requestType = await this.prisma.requestType.findUnique({
      where: { id: requestTypeId },
    });
    if (!requestType) {
      throw new NotFoundException(`Không tìm thấy loại đơn ID ${requestTypeId}`);
    }
  }

  private validateDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      const start = this.normalizeDate(startDate);
      const end = this.normalizeDate(endDate);
      if (end < start) {
        throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
      }
    }
  }

  async getAll(query: QueryRequestDto = {}, user?: any) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RequestWhereInput = {};

    if (user && user.role === UserRole.HR) {
      const hrEmployee = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { departmentId: true }
      });

      if (hrEmployee?.departmentId) {
        where.employee = {
          departmentId: hrEmployee.departmentId
        };
      } else {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.requestTypeId) {
      where.requestTypeId = query.requestTypeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.OR = [];
      if (query.startDate && query.endDate) {
        const start = this.normalizeDate(query.startDate);
        const end = this.normalizeDate(query.endDate);
        where.OR.push({
          startDate: { gte: start, lte: end },
        });
        where.OR.push({
          endDate: { gte: start, lte: end },
        });
        where.OR.push({
          AND: [
            { startDate: { lte: start } },
            { endDate: { gte: end } },
          ],
        });
      } else if (query.startDate) {
        const start = this.normalizeDate(query.startDate);
        where.OR.push({
          startDate: { gte: start },
        });
        where.OR.push({
          endDate: { gte: start },
        });
      } else if (query.endDate) {
        const end = this.normalizeDate(query.endDate);
        where.OR.push({
          startDate: { lte: end },
        });
        where.OR.push({
          endDate: { lte: end },
        });
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        include: this.includeRelations,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string, user?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!request) {
      throw new NotFoundException(`Không tìm thấy đơn ID ${id}`);
    }

    if (user && user.role === UserRole.HR) {
      const hrEmployee = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { departmentId: true }
      });

      if (request.employee?.departmentId !== hrEmployee?.departmentId) {
        throw new ForbiddenException('Bạn chỉ có quyền xem đơn của nhân viên trong cùng phòng ban');
      }
    }

    return request;
  }

  async getByEmployee(employeeId: string, query: QueryRequestDto = {}, user?: any) {
    return this.getAll({ ...query, employeeId }, user);
  }

  async create(data: CreateRequestDto, user?: any) {
    await this.ensureEmployeeAndRequestTypeExist(data.employeeId, data.requestTypeId);
    this.validateDateRange(data.startDate, data.endDate);

    try {
      const request = await this.prisma.request.create({
        data: {
          employeeId: data.employeeId,
          requestTypeId: data.requestTypeId,
          reason: data.reason,
          startDate: data.startDate ? this.normalizeDate(data.startDate) : null,
          endDate: data.endDate ? this.normalizeDate(data.endDate) : null,
          status: RequestStatus.PENDING,
        },
        include: this.includeRelations,
      });

      // Audit log
      const actorContext = await this.getActorContextFromUser(user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.CREATE,
          status: AuditStatus.SUCCESS,
          entityName: 'Request',
          entityId: request.id,
          afterData: request,
          description: `Tạo đơn ${request.requestType.name} cho nhân viên ${request.employee.fullName}`,
        },
        actor: actorContext,
      });

      // Gửi notification cho ADMIN/HR
      try {
        await notifyRequestCreated(
          this.notificationService,
          this.prisma,
          request.employee.fullName,
          request.requestType.name,
          request.id,
          request.createdAt,
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }

      return request;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Đơn đã tồn tại');
        }
      }
      throw new BadRequestException('Không thể tạo đơn');
    }
  }

  async update(id: string, data: UpdateRequestDto, user?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!request) {
      throw new NotFoundException(`Không tìm thấy đơn ID ${id}`);
    }

    // Chỉ cho phép cập nhật đơn ở trạng thái PENDING
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể cập nhật đơn ở trạng thái PENDING');
    }

    // Chỉ cho phép nhân viên tạo đơn mới được cập nhật
    if (user && user.employeeId && user.employeeId !== request.employeeId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đơn này');
    }

    const updateData: Prisma.RequestUncheckedUpdateInput = {};

    if (data.requestTypeId) {
      await this.ensureEmployeeAndRequestTypeExist(
        request.employeeId,
        data.requestTypeId,
      );
      updateData.requestTypeId = data.requestTypeId;
    }

    if (data.reason !== undefined) {
      updateData.reason = data.reason;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate
        ? this.normalizeDate(data.startDate)
        : null;
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? this.normalizeDate(data.endDate) : null;
    }

    // Validate date range
    const startDate = data.startDate ?? request.startDate;
    const endDate = data.endDate ?? request.endDate;
    if (startDate && endDate) {
      this.validateDateRange(
        startDate instanceof Date ? startDate.toISOString() : startDate,
        endDate instanceof Date ? endDate.toISOString() : endDate,
      );
    }

    try {
      const updated = await this.prisma.request.update({
        where: { id },
        data: updateData,
        include: this.includeRelations,
      });

      const actorContext = await this.getActorContextFromUser(user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.UPDATE,
          status: AuditStatus.SUCCESS,
          entityName: 'Request',
          entityId: updated.id,
          beforeData: request,
          afterData: updated,
          description: `Cập nhật đơn ${updated.id}`,
        },
        actor: actorContext,
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Đơn ID ${id} không tồn tại`);
        }
      }
      throw new BadRequestException('Không thể cập nhật đơn');
    }
  }

  async delete(id: string, user?: any) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!request) {
      throw new NotFoundException(`Không tìm thấy đơn ID ${id}`);
    }

    // Chỉ cho phép xóa đơn ở trạng thái PENDING
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể xóa đơn ở trạng thái PENDING');
    }

    // Chỉ cho phép nhân viên tạo đơn hoặc ADMIN/HR xóa
    if (user && user.employeeId && user.employeeId !== request.employeeId) {
      const isAdmin = user.role === UserRole.ADMIN;
      const isHR = user.role === UserRole.HR;

      if (!isAdmin && !isHR) {
        throw new ForbiddenException('Bạn không có quyền xóa đơn này');
      }

      if (isHR) {
        const hrEmployee = await this.prisma.employee.findUnique({
          where: { id: user.id },
          select: { departmentId: true }
        });

        if (request.employee?.departmentId !== hrEmployee?.departmentId) {
          throw new ForbiddenException('Bạn chỉ có quyền xóa đơn của nhân viên trong cùng phòng ban');
        }
      }
    }

    try {
      const before = request;

      const deleted = await this.prisma.request.delete({
        where: { id },
      });

      const actorContext = await this.getActorContextFromUser(user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.REQUEST,
          action: AuditAction.DELETE,
          status: AuditStatus.SUCCESS,
          entityName: 'Request',
          entityId: id,
          beforeData: before,
          description: `Xóa đơn ${id}`,
        },
        actor: actorContext,
      });

      return deleted;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Đơn ID ${id} không tồn tại`);
        }
      }
      throw new BadRequestException('Không thể xóa đơn');
    }
  }

  async approve(id: string, user: any, dto: ApproveRequestDto) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!request) {
      throw new NotFoundException(`Không tìm thấy đơn ID ${id}`);
    }

    if (user && user.role === UserRole.HR) {
      const hrEmployee = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { departmentId: true }
      });

      if (request.employee?.departmentId !== hrEmployee?.departmentId) {
        throw new ForbiddenException('Bạn chỉ có quyền duyệt đơn của nhân viên trong cùng phòng ban');
      }
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Đơn đã được xử lý trước đó');
    }

    const updated = await this.prisma.request.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById: user.id,
        approvedDate: new Date(),
      },
      include: this.includeRelations,
    });

    const actorContext = await this.getActorContextFromUser(user);
    await writeAuditLog(this.auditLogService, {
      base: {
        module: AuditModule.REQUEST,
        action:
          dto.status === RequestStatus.APPROVED
            ? AuditAction.APPROVE
            : AuditAction.REJECT,
        status: AuditStatus.SUCCESS,
        entityName: 'Request',
        entityId: updated.id,
        beforeData: request,
        afterData: updated,
        description: `Duyệt đơn ${updated.id} với trạng thái ${dto.status}`,
      },
      actor: actorContext,
    });

    // Gửi notification cho employee
    try {
      if (dto.status === RequestStatus.APPROVED) {
        await notifyRequestApproved(
          this.notificationService,
          request.employeeId,
          request.requestType.name,
          request.id,
          updated.approvedDate!,
        );
      } else if (dto.status === RequestStatus.REJECTED) {
        await notifyRequestRejected(
          this.notificationService,
          request.employeeId,
          request.requestType.name,
          request.id,
          updated.approvedDate!,
          dto.note,
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return updated;
  }

  private async getActorContextFromUser(user?: any) {
    if (!user) return undefined;
    try {
      return await getActorContextFromUser(this.prisma, user);
    } catch {
      return undefined;
    }
  }
}

