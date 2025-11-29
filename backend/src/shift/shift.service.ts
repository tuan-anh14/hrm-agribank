import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { AuditAction, AuditModule, AuditStatus, Prisma, ShiftType } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { writeAuditLog, getActorContextFromUser } from '@/audit-log/audit-log.helper';

@Injectable()
export class ShiftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) { }

  private normalizeDateTime(value: string | Date): Date {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Thời gian không hợp lệ');
    }
    return date;
  }

  private validateTimeRange(start: Date, end: Date) {
    // Create copies to avoid mutating original dates
    const s = new Date(start);
    const e = new Date(end);

    // Normalize to the same date (e.g., 1970-01-01) to compare only time components
    s.setFullYear(1970, 0, 1);
    s.setMonth(0);
    s.setDate(1);

    e.setFullYear(1970, 0, 1);
    e.setMonth(0);
    e.setDate(1);

    if (s.getTime() >= e.getTime()) {
      throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
    }
  }

  async getAll(query: QueryShiftDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ShiftWhereInput = {};
    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shift.count({ where }),
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
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Không tìm thấy ca làm việc ID ${id}`);
    }
    return shift;
  }

  async create(dto: CreateShiftDto, user?: any) {
    const start = this.normalizeDateTime(dto.startTime);
    const end = this.normalizeDateTime(dto.endTime);
    this.validateTimeRange(start, end);

    try {
      const shift = await this.prisma.shift.create({
        data: {
          name: dto.name.trim(),
          type: dto.type || ShiftType.FULL_DAY,
          startTime: start,
          endTime: end,
        },
      });

      const actorContext = await getActorContextFromUser(this.prisma, user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.SHIFT,
          action: AuditAction.CREATE,
          status: AuditStatus.SUCCESS,
          entityName: 'Shift',
          entityId: shift.id,
          afterData: shift,
          description: `Tạo ca làm việc ${shift.name}`,
        },
        actor: actorContext,
      });

      return shift;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Tên ca làm việc đã tồn tại');
        }
      }
      throw new BadRequestException('Không thể tạo ca làm việc');
    }
  }

  async update(id: string, dto: UpdateShiftDto, user?: any) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Không tìm thấy ca làm việc ID ${id}`);
    }

    const updateData: Prisma.ShiftUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.type) {
      updateData.type = dto.type;
    }

    let start = shift.startTime;
    let end = shift.endTime;

    if (dto.startTime) {
      start = this.normalizeDateTime(dto.startTime);
      updateData.startTime = start;
    }

    if (dto.endTime) {
      end = this.normalizeDateTime(dto.endTime);
      updateData.endTime = end;
    }

    this.validateTimeRange(start, end);

    try {
      const updated = await this.prisma.shift.update({
        where: { id },
        data: updateData,
      });

      const actorContext = await getActorContextFromUser(this.prisma, user);
      await writeAuditLog(this.auditLogService, {
        base: {
          module: AuditModule.SHIFT,
          action: AuditAction.UPDATE,
          status: AuditStatus.SUCCESS,
          entityName: 'Shift',
          entityId: updated.id,
          beforeData: shift,
          afterData: updated,
          description: `Cập nhật ca làm việc ${updated.name}`,
        },
        actor: actorContext,
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Tên ca làm việc đã tồn tại');
        }
      }
      throw new BadRequestException('Không thể cập nhật ca làm việc');
    }
  }

  async delete(id: string, user?: any) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Không tìm thấy ca làm việc ID ${id}`);
    }

    const workScheduleCount = await this.prisma.workSchedule.count({
      where: { shiftId: id },
    });

    if (workScheduleCount > 0) {
      throw new BadRequestException('Không thể xoá ca làm việc đang được sử dụng trong lịch làm việc');
    }

    const deleted = await this.prisma.shift.delete({ where: { id } });

    const actorContext = await getActorContextFromUser(this.prisma, user);
    await writeAuditLog(this.auditLogService, {
      base: {
        module: AuditModule.SHIFT,
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        entityName: 'Shift',
        entityId: id,
        beforeData: shift,
        description: `Xóa ca làm việc ${id}`,
      },
      actor: actorContext,
    });

    return deleted;
  }
}
