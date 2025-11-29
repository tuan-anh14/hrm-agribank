import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Notification,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo notification mới
   */
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    // Kiểm tra employee tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: createNotificationDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${createNotificationDto.employeeId} not found`,
      );
    }

    return this.prisma.notification.create({
      data: {
        employeeId: createNotificationDto.employeeId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        content: createNotificationDto.content,
        isRead: false,
      },
    });
  }

  /**
   * Lấy danh sách notifications với filter và pagination
   */
  async findAll(
    query: QueryNotificationDto,
    currentEmployeeId?: string,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      employeeId,
      type,
      isRead,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.NotificationWhereInput = {};

    // Nếu có currentEmployeeId, chỉ lấy notification của employee đó
    // Nếu không có currentEmployeeId nhưng có employeeId trong query, dùng employeeId từ query
    if (currentEmployeeId) {
      where.employeeId = currentEmployeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
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

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Lấy danh sách notifications chưa đọc
   */
  async findUnread(
    employeeId: string,
    query: QueryNotificationDto = {},
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll(
      {
        ...query,
        employeeId,
        isRead: 'false',
      },
      employeeId,
    );
  }

  /**
   * Lấy chi tiết một notification
   */
  async findOne(id: string, employeeId?: string): Promise<Notification> {
    const where: Prisma.NotificationWhereInput = { id };

    // Nếu có employeeId, kiểm tra notification thuộc về employee đó
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const notification = await this.prisma.notification.findFirst({
      where,
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

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Đếm số notifications chưa đọc
   */
  async getUnreadCount(employeeId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        employeeId,
        isRead: false,
      },
    });
  }

  /**
   * Đánh dấu notification đã đọc
   */
  async markAsRead(
    id: string,
    employeeId?: string,
  ): Promise<Notification> {
    const where: Prisma.NotificationWhereInput = { id };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const notification = await this.prisma.notification.findFirst({
      where,
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Đánh dấu tất cả notifications của employee đã đọc
   */
  async markAllAsRead(employeeId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        employeeId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  }

  /**
   * Cập nhật notification
   */
  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    employeeId?: string,
  ): Promise<Notification> {
    const where: Prisma.NotificationWhereInput = { id };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const notification = await this.prisma.notification.findFirst({
      where,
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  /**
   * Xóa notification
   */
  async remove(id: string, employeeId?: string): Promise<Notification> {
    const where: Prisma.NotificationWhereInput = { id };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const notification = await this.prisma.notification.findFirst({
      where,
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Tạo notification cho nhiều employees (batch)
   */
  async createForManyEmployees(
    employeeIds: string[],
    type: NotificationType,
    title: string,
    content: string,
  ): Promise<{ count: number }> {
    // Kiểm tra tất cả employees tồn tại
    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
      },
      select: { id: true },
    });

    if (employees.length !== employeeIds.length) {
      throw new NotFoundException('Một số employee IDs không tồn tại');
    }

    const notifications = employeeIds.map((employeeId) => ({
      employeeId,
      type,
      title,
      content,
      isRead: false,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    return { count: result.count };
  }
}

