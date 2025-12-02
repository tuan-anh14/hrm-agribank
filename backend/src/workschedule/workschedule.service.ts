import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuditAction, AuditModule, AuditStatus, Prisma, RequestStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateWorkScheduleDto } from './dto/create-workschedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-workschedule.dto';
import { QueryWorkScheduleDto } from './dto/query-workschedule.dto';
import { ApproveWorkScheduleDto } from './dto/approve-workschedule.dto';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { NotificationService } from '@/notification/notification.service';
import {
  notifyWorkScheduleCreated,
  notifyWorkScheduleApproved,
  notifyWorkScheduleRejected,
  notifyWorkScheduleMonthAvailable,
} from '@/notification/notification-templates.helper';

@Injectable()
export class WorkscheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) { }

  private readonly includeRelations: Prisma.WorkScheduleInclude = {
    employee: {
      select: {
        id: true,
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
    shift: true,
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
      throw new BadRequestException('Ngày làm việc không hợp lệ');
    }
    return date;
  }

  private getDateRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async ensureEmployeeAndShiftExist(employeeId: string, shiftId?: string | null) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Không tìm thấy nhân viên ID ${employeeId}`);
    }

    if (shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
      if (!shift) {
        throw new NotFoundException(`Không tìm thấy ca làm việc ID ${shiftId}`);
      }
    }
  }

  private async validateDuplicateSchedule(employeeId: string, date: Date, scheduleId?: string) {
    const { start, end } = this.getDateRange(date);
    const existing = await this.prisma.workSchedule.findFirst({
      where: {
        employeeId,
        date: {
          gte: start,
          lte: end,
        },
        ...(scheduleId && { NOT: { id: scheduleId } }),
        status: {
          not: RequestStatus.REJECTED,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Nhân viên đã có lịch làm việc trong ngày này');
    }
  }

  async getAll(query: QueryWorkScheduleDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkScheduleWhereInput = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.shiftId) {
      where.shiftId = query.shiftId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        const start = this.normalizeDate(query.startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (query.endDate) {
        const end = this.normalizeDate(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.workSchedule.findMany({
        where,
        include: this.includeRelations,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workSchedule.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!schedule) {
      throw new NotFoundException(`Không tìm thấy lịch làm việc ID ${id}`);
    }

    return schedule;
  }

  async getByEmployee(employeeId: string, query: QueryWorkScheduleDto = {}) {
    return this.getAll({ ...query, employeeId });
  }

  async create(data: CreateWorkScheduleDto) {
    await this.ensureEmployeeAndShiftExist(data.employeeId, data.shiftId);
    const scheduleDate = this.normalizeDate(data.date);
    await this.validateDuplicateSchedule(data.employeeId, scheduleDate);

    try {
      const schedule = await this.prisma.workSchedule.create({
        data: {
          employeeId: data.employeeId,
          shiftId: data.shiftId,
          date: scheduleDate,
          note: data.note,
        },
        include: this.includeRelations,
      });

      await this.auditLogService.createLog({
        module: AuditModule.WORKSCHEDULE,
        action: AuditAction.CREATE,
        status: AuditStatus.SUCCESS,
        entityName: 'WorkSchedule',
        entityId: schedule.id,
        afterData: schedule,
        description: `Tạo lịch làm việc cho nhân sự ${schedule.employeeId} ngày ${schedule.date.toISOString().split('T')[0]}`,
      });

      // Gửi notification cho ADMIN/HR để duyệt
      try {
        await notifyWorkScheduleCreated(
          this.notificationService,
          this.prisma,
          schedule.employee.fullName,
          schedule.date,
          schedule.shift?.name,
        );
      } catch (error) {
        // Log error nhưng không throw để không ảnh hưởng đến flow chính
        console.error('Error sending notification for work schedule creation:', error);
      }

      return schedule;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Lịch làm việc đã tồn tại');
        }
      }
      throw new BadRequestException('Không thể tạo lịch làm việc');
    }
  }

  async update(id: string, data: UpdateWorkScheduleDto) {
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Không tìm thấy lịch làm việc ID ${id}`);
    }

    if (schedule.status !== RequestStatus.PENDING) {
      // Cho phép cập nhật ghi chú ngay cả khi đã duyệt, nhưng không cho sửa nhân viên/ca/ngày
      const isOnlyNoteUpdate =
        data.note !== undefined &&
        data.employeeId === undefined &&
        data.shiftId === undefined &&
        data.date === undefined;

      if (!isOnlyNoteUpdate) {
        throw new BadRequestException('Chỉ có thể cập nhật lịch khi trạng thái là PENDING hoặc chỉ cập nhật ghi chú');
      }
    }

    const updateData: Prisma.WorkScheduleUncheckedUpdateInput = {};

    if (data.employeeId || data.shiftId) {
      await this.ensureEmployeeAndShiftExist(
        data.employeeId ?? schedule.employeeId,
        data.shiftId ?? schedule.shiftId,
      );
    }

    if (data.date) {
      const newDate = this.normalizeDate(data.date);
      await this.validateDuplicateSchedule(data.employeeId ?? schedule.employeeId, newDate, id);
      updateData.date = newDate;
    }

    if (data.employeeId) {
      updateData.employeeId = data.employeeId;
    }

    if (data.shiftId !== undefined) {
      updateData.shiftId = data.shiftId;
    }

    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    try {
      const updated = await this.prisma.workSchedule.update({
        where: { id },
        data: updateData,
        include: this.includeRelations,
      });

      await this.auditLogService.createLog({
        module: AuditModule.WORKSCHEDULE,
        action: AuditAction.UPDATE,
        status: AuditStatus.SUCCESS,
        entityName: 'WorkSchedule',
        entityId: updated.id,
        beforeData: schedule,
        afterData: updated,
        description: `Cập nhật lịch làm việc ${updated.id}`,
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Lịch làm việc đã tồn tại');
        }
      }
      throw new BadRequestException('Không thể cập nhật lịch làm việc');
    }
  }

  async approve(id: string, approverId: string, dto: ApproveWorkScheduleDto) {
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Không tìm thấy lịch làm việc ID ${id}`);
    }

    if (schedule.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Lịch làm việc đã được xử lý trước đó');
    }

    const updated = await this.prisma.workSchedule.update({
      where: { id },
      data: {
        status: dto.status,
        note: dto.note ?? schedule.note,
        approvedById: approverId,
        approvedDate: new Date(),
      },
      include: this.includeRelations,
    });

    await this.auditLogService.createLog({
      module: AuditModule.WORKSCHEDULE,
      action: dto.status === RequestStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
      status: AuditStatus.SUCCESS,
      entityName: 'WorkSchedule',
      entityId: updated.id,
      beforeData: schedule,
      afterData: updated,
      description: `Duyệt lịch làm việc ${updated.id} với trạng thái ${dto.status}`,
    });

    // Gửi notification cho employee
    try {
      if (dto.status === RequestStatus.APPROVED) {
        await notifyWorkScheduleApproved(
          this.notificationService,
          schedule.employeeId,
          schedule.date,
          updated.shift?.name,
        );
      } else if (dto.status === RequestStatus.REJECTED) {
        await notifyWorkScheduleRejected(
          this.notificationService,
          schedule.employeeId,
          schedule.date,
          updated.shift?.name,
          dto.note,
        );
      }
    } catch (error) {
      // Log error nhưng không throw để không ảnh hưởng đến flow chính
      console.error('Error sending notification for work schedule approval:', error);
    }

    return updated;
  }

  async delete(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Không tìm thấy lịch làm việc ID ${id}`);
    }

    if (schedule.status !== RequestStatus.PENDING) {
      throw new ForbiddenException('Chỉ có thể xoá lịch khi trạng thái là PENDING');
    }

    try {
      const deleted = await this.prisma.workSchedule.delete({
        where: { id },
      });

      await this.auditLogService.createLog({
        module: AuditModule.WORKSCHEDULE,
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        entityName: 'WorkSchedule',
        entityId: id,
        beforeData: schedule,
        description: `Xóa lịch làm việc ${id}`,
      });

      return deleted;
    } catch (error) {
      throw new BadRequestException('Không thể xoá lịch làm việc');
    }
  }

  /**
   * Gửi system notification cho tất cả employees về lịch làm việc tháng mới
   * Có thể gọi từ scheduled job hoặc manual
   */
  async notifyWorkScheduleMonthAvailable(month: number, year: number): Promise<{ count: number }> {
    return await notifyWorkScheduleMonthAvailable(
      this.notificationService,
      this.prisma,
      month,
      year,
    );
  }
}
