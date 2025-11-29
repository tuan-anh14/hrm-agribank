import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Attendance,
  AttendanceStatus,
  Prisma,
  RequestStatus,
  EmployeeType,
  ShiftType,
  AuditAction,
  AuditModule,
  AuditStatus,
} from '@prisma/client';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { NotificationService } from '@/notification/notification.service';
import {
  notifyCheckInEarly,
  notifyCheckInLate,
  notifyCheckOutLate,
  notifyForgotCheckOut,
} from '@/notification/notification-templates.helper';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Normalize date strings to Date objects for Prisma
   */
  private normalizeDates(data: {
    date?: string | Date | null;
    checkInTime?: string | Date | null;
    checkOutTime?: string | Date | null;
  }): {
    date?: Date | null;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
  } {
    const normalized: any = {};

    if (data.date === '' || data.date === null) {
      normalized.date = null;
    } else if (data.date) {
      normalized.date = typeof data.date === 'string' ? new Date(data.date) : data.date;
    }

    if (data.checkInTime === '' || data.checkInTime === null) {
      normalized.checkInTime = null;
    } else if (data.checkInTime) {
      normalized.checkInTime =
        typeof data.checkInTime === 'string' ? new Date(data.checkInTime) : data.checkInTime;
    }

    if (data.checkOutTime === '' || data.checkOutTime === null) {
      normalized.checkOutTime = null;
    } else if (data.checkOutTime) {
      normalized.checkOutTime =
        typeof data.checkOutTime === 'string' ? new Date(data.checkOutTime) : data.checkOutTime;
    }

    return normalized;
  }

  /**
   * Calculate attendance status based on check-in time
   * Default: ON_TIME if check-in before 9:00 AM, LATE if after
   */
  private calculateStatus(checkInTime: Date | null): AttendanceStatus {
    if (!checkInTime) {
      return AttendanceStatus.ABSENT;
    }

    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();

    // Consider late if check-in after 9:00 AM
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
      return AttendanceStatus.LATE;
    }

    return AttendanceStatus.ON_TIME;
  }

  /**
   * Get date range for work schedule query (start and end of day)
   */
  private getDateRangeForSchedule(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Get all attendance records with filters and pagination
   */
  async getAll(query: QueryAttendanceDto = {}): Promise<{
    data: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { employeeId, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.date.lte = endDateTime;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              position: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get attendance by ID
   */
  async getById(id: string): Promise<Attendance> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            position: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  /**
   * Get attendance records by employee ID
   */
  async getByEmployeeId(
    employeeId: string,
    query: QueryAttendanceDto = {},
  ): Promise<{
    data: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.getAll({ ...query, employeeId });
  }

  /**
   * Create new attendance record
   */
  async create(data: CreateAttendanceDto): Promise<Attendance> {
    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${data.employeeId} not found`);
    }

    const normalizedDates = this.normalizeDates({
      date: data.date,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
    });

    // Set default date to today if not provided
    const attendanceDate = normalizedDates.date || new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this employee on this date
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        date: {
          gte: new Date(attendanceDate),
          lt: new Date(new Date(attendanceDate).setDate(attendanceDate.getDate() + 1)),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Attendance record already exists for employee on ${attendanceDate.toISOString().split('T')[0]}`,
      );
    }

    // Calculate status if not provided
    let status = data.status;
    if (!status && normalizedDates.checkInTime) {
      status = this.calculateStatus(normalizedDates.checkInTime);
    } else if (!status) {
      status = AttendanceStatus.ABSENT;
    }

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          employeeId: data.employeeId,
          date: attendanceDate,
          checkInTime: normalizedDates.checkInTime || null,
          checkOutTime: normalizedDates.checkOutTime || null,
          status,
          note: data.note,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      await this.auditLogService.createLog({
        module: AuditModule.ATTENDANCE,
        action: AuditAction.CREATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Attendance',
        entityId: attendance.id,
        afterData: attendance,
        description: `Tạo bản ghi chấm công cho nhân sự ${attendance.employeeId} ngày ${attendance.date.toISOString().split('T')[0]}`,
      });

      return attendance;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Attendance record already exists');
        }
      }
      throw new BadRequestException('Failed to create attendance record');
    }
  }

  /**
   * Check-in for an employee (creates or updates attendance for today)
   */
  async checkIn(employeeId: string, data: CheckInDto = {}): Promise<Attendance> {
    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const checkInTime = data.checkInTime ? new Date(data.checkInTime) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee has an approved work schedule for today
    const { start, end } = this.getDateRangeForSchedule(today);
    const workSchedule = await this.prisma.workSchedule.findFirst({
      where: {
        employeeId,
        date: {
          gte: start,
          lte: end,
        },
        status: RequestStatus.APPROVED,
      },
      include: { shift: true },
    });

    let activeShift = workSchedule?.shift;

    if (!workSchedule) {
      if (employee.type === EmployeeType.FULL_TIME) {
        // Allow FULL_TIME to check in without explicit schedule
        // Try to find a default FULL_DAY shift for time calculations
        activeShift = await this.prisma.shift.findFirst({
          where: { type: ShiftType.FULL_DAY }
        });
      } else {
        throw new BadRequestException(
          'Bạn chưa đăng ký ca làm việc cho ngày hôm nay hoặc ca làm việc chưa được duyệt. Vui lòng đăng ký ca trước khi chấm công.',
        );
      }
    }

    // Find existing attendance for today
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(new Date(today).setDate(today.getDate() + 1)),
        },
      },
    });

    if (existing) {
      if (existing.checkInTime) {
        throw new ConflictException('Already checked in today');
      }

      // Calculate late minutes for existing record
      let lateMinutes = 0;
      if (activeShift && activeShift.startTime) {
        const shiftStart = new Date(checkInTime);
        const shiftTime = new Date(activeShift.startTime);
        shiftStart.setHours(shiftTime.getHours(), shiftTime.getMinutes(), 0, 0);

        if (checkInTime > shiftStart) {
          const diffMs = checkInTime.getTime() - shiftStart.getTime();
          lateMinutes = Math.floor(diffMs / 60000);
        }
      }

      // Update existing record with check-in
      const status = this.calculateStatus(checkInTime);
      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime,
          status,
          note: data.note || existing.note,
          lateMinutes,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      await this.auditLogService.createLog({
        module: AuditModule.ATTENDANCE,
        action: AuditAction.CHECK_IN,
        status: AuditStatus.SUCCESS,
        entityName: 'Attendance',
        entityId: updated.id,
        beforeData: existing,
        afterData: updated,
        description: `Check-in cho nhân sự ${updated.employeeId} ngày ${updated.date.toISOString().split('T')[0]}`,
      });

      // Gửi notification check-in sớm/muộn
      try {
        if (activeShift && activeShift.startTime) {
          const shiftStart = new Date(checkInTime);
          const shiftTime = new Date(activeShift.startTime);
          shiftStart.setHours(shiftTime.getHours(), shiftTime.getMinutes(), 0, 0);

          if (lateMinutes > 0) {
            // Check-in muộn
            await notifyCheckInLate(
              this.notificationService,
              employeeId,
              checkInTime,
              lateMinutes,
            );
          } else if (checkInTime < shiftStart) {
            // Check-in sớm
            await notifyCheckInEarly(
              this.notificationService,
              employeeId,
              checkInTime,
            );
          }
        }
      } catch (error) {
        console.error('Error sending notification for check-in:', error);
      }

      return updated;
    }

    // Calculate late minutes
    let lateMinutes = 0;
    if (activeShift && activeShift.startTime) {
      const shiftStart = new Date(checkInTime);
      const shiftTime = new Date(activeShift.startTime);
      shiftStart.setHours(shiftTime.getHours(), shiftTime.getMinutes(), 0, 0);

      if (checkInTime > shiftStart) {
        const diffMs = checkInTime.getTime() - shiftStart.getTime();
        lateMinutes = Math.floor(diffMs / 60000);
      }
    }

    // Create new attendance record
    const status = this.calculateStatus(checkInTime);
    const attendance = await this.prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkInTime,
        status,
        note: data.note,
        lateMinutes,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.auditLogService.createLog({
      module: AuditModule.ATTENDANCE,
      action: AuditAction.CHECK_IN,
      status: AuditStatus.SUCCESS,
      entityName: 'Attendance',
      entityId: attendance.id,
      afterData: attendance,
      description: `Check-in tạo mới cho nhân sự ${attendance.employeeId} ngày ${attendance.date.toISOString().split('T')[0]}`,
    });

    // Gửi notification check-in sớm/muộn
    try {
      if (activeShift && activeShift.startTime) {
        const shiftStart = new Date(checkInTime);
        const shiftTime = new Date(activeShift.startTime);
        shiftStart.setHours(shiftTime.getHours(), shiftTime.getMinutes(), 0, 0);

        if (lateMinutes > 0) {
          // Check-in muộn
          await notifyCheckInLate(
            this.notificationService,
            employeeId,
            checkInTime,
            lateMinutes,
          );
        } else if (checkInTime < shiftStart) {
          // Check-in sớm
          await notifyCheckInEarly(
            this.notificationService,
            employeeId,
            checkInTime,
          );
        }
      }
    } catch (error) {
      console.error('Error sending notification for check-in:', error);
    }

    return attendance;
  }

  /**
   * Check-out for an employee (updates attendance for today)
   */
  async checkOut(employeeId: string, data: CheckOutDto = {}): Promise<Attendance> {
    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const checkOutTime = data.checkOutTime ? new Date(data.checkOutTime) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if employee has an approved work schedule for today
    const { start, end } = this.getDateRangeForSchedule(today);
    const workSchedule = await this.prisma.workSchedule.findFirst({
      where: {
        employeeId,
        date: {
          gte: start,
          lte: end,
        },
        status: RequestStatus.APPROVED,
      },
      include: { shift: true },
    });

    let activeShift = workSchedule?.shift;

    if (!workSchedule) {
      if (employee.type === EmployeeType.FULL_TIME) {
        // Allow FULL_TIME to check out without explicit schedule
        activeShift = await this.prisma.shift.findFirst({
          where: { type: ShiftType.FULL_DAY }
        });
      } else {
        throw new BadRequestException(
          'Bạn chưa đăng ký ca làm việc cho ngày hôm nay hoặc ca làm việc chưa được duyệt. Vui lòng đăng ký ca trước khi chấm công.',
        );
      }
    }

    // Find existing attendance for today
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(new Date(today).setDate(today.getDate() + 1)),
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('No attendance record found for today. Please check in first.');
    }

    if (existing.checkOutTime) {
      throw new ConflictException('Already checked out today');
    }

    if (!existing.checkInTime) {
      throw new BadRequestException('Cannot check out without checking in first');
    }

    // Validate check-out time is after check-in time
    if (checkOutTime <= existing.checkInTime) {
      throw new BadRequestException('Check-out time must be after check-in time');
    }

    // Calculate early minutes and check if late
    let earlyMinutes = 0;
    let isLateCheckOut = false;
    if (activeShift && activeShift.endTime) {
      const shiftEnd = new Date(checkOutTime);
      const shiftTime = new Date(activeShift.endTime);
      shiftEnd.setHours(shiftTime.getHours(), shiftTime.getMinutes(), 0, 0);

      if (checkOutTime < shiftEnd) {
        const diffMs = shiftEnd.getTime() - checkOutTime.getTime();
        earlyMinutes = Math.floor(diffMs / 60000);
      } else if (checkOutTime > shiftEnd) {
        // Check-out muộn
        isLateCheckOut = true;
      }
    }

    // Update attendance with check-out
    const updated = await this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime,
        note: data.note || existing.note,
        earlyMinutes,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.auditLogService.createLog({
      module: AuditModule.ATTENDANCE,
      action: AuditAction.CHECK_OUT,
      status: AuditStatus.SUCCESS,
      entityName: 'Attendance',
      entityId: updated.id,
      beforeData: existing,
      afterData: updated,
      description: `Check-out cho nhân sự ${updated.employeeId} ngày ${updated.date.toISOString().split('T')[0]}`,
    });

    // Gửi notification check-out muộn
    try {
      if (isLateCheckOut) {
        await notifyCheckOutLate(
          this.notificationService,
          employeeId,
          checkOutTime,
        );
      }
    } catch (error) {
      console.error('Error sending notification for check-out:', error);
    }

    return updated;
  }

  /**
   * Update attendance record
   */
  async update(id: string, data: UpdateAttendanceDto): Promise<Attendance> {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    const normalizedDates = this.normalizeDates({
      date: data.date,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
    });

    // If employeeId is being updated, verify new employee exists
    if (data.employeeId && data.employeeId !== existing.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employeeId },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${data.employeeId} not found`);
      }

      // Check for duplicate attendance on the same date
      const attendanceDate = normalizedDates.date || existing.date;
      const dateStart = new Date(attendanceDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const duplicate = await this.prisma.attendance.findFirst({
        where: {
          employeeId: data.employeeId,
          date: {
            gte: dateStart,
            lt: dateEnd,
          },
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Attendance record already exists for employee on ${attendanceDate.toISOString().split('T')[0]}`,
        );
      }
    }

    // Calculate status if check-in time is updated
    let status = data.status;
    if (!status && normalizedDates.checkInTime) {
      status = this.calculateStatus(normalizedDates.checkInTime);
    }

    // Validate check-out time is after check-in time
    const finalCheckInTime = normalizedDates.checkInTime || existing.checkInTime;
    const finalCheckOutTime = normalizedDates.checkOutTime || existing.checkOutTime;

    if (finalCheckInTime && finalCheckOutTime && finalCheckOutTime <= finalCheckInTime) {
      throw new BadRequestException('Check-out time must be after check-in time');
    }

    try {
      const updateData: any = {
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(normalizedDates.date && { date: normalizedDates.date }),
        ...(normalizedDates.checkInTime !== undefined && {
          checkInTime: normalizedDates.checkInTime,
        }),
        ...(normalizedDates.checkOutTime !== undefined && {
          checkOutTime: normalizedDates.checkOutTime,
        }),
        ...(status && { status }),
        ...(data.note !== undefined && { note: data.note }),
      };

      const updated = await this.prisma.attendance.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      await this.auditLogService.createLog({
        module: AuditModule.ATTENDANCE,
        action: AuditAction.UPDATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Attendance',
        entityId: updated.id,
        beforeData: existing,
        afterData: updated,
        description: `Cập nhật bản ghi chấm công ${updated.id}`,
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Attendance with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Attendance record already exists');
        }
      }
      throw new BadRequestException('Failed to update attendance record');
    }
  }

  /**
   * Delete attendance record
   */
  async delete(id: string): Promise<Attendance> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    try {
      const deleted = await this.prisma.attendance.delete({
        where: { id },
      });

      await this.auditLogService.createLog({
        module: AuditModule.ATTENDANCE,
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        entityName: 'Attendance',
        entityId: id,
        beforeData: attendance,
        description: `Xóa bản ghi chấm công ${id}`,
      });

      return deleted;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Attendance with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete attendance record');
    }
  }

  /**
   * Phát hiện và gửi notification cho employees quên checkout ngày hôm trước
   * Có thể gọi từ scheduled job hoặc manual
   */
  async checkForgotCheckOut(targetDate?: Date): Promise<{ count: number }> {
    // Nếu không có targetDate, dùng ngày hôm trước
    const yesterday = targetDate || new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Tìm tất cả attendance có checkInTime nhưng không có checkOutTime của ngày hôm trước
    const forgotCheckOuts = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: yesterday,
          lte: endOfYesterday,
        },
        checkInTime: {
          not: null,
        },
        checkOutTime: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Gửi notification cho từng employee
    let notificationCount = 0;
    for (const attendance of forgotCheckOuts) {
      try {
        await notifyForgotCheckOut(
          this.notificationService,
          attendance.employeeId,
          attendance.date,
        );
        notificationCount++;
      } catch (error) {
        console.error(
          `Error sending forgot checkout notification for employee ${attendance.employeeId}:`,
          error,
        );
      }
    }

    return { count: notificationCount };
  }
}
