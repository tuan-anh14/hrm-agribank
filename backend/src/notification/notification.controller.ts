import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationListResponseDto,
  NotificationDetailResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Notification')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo notification mới (chỉ ADMIN/HR)' })
  @ApiResponse({
    status: 201,
    description: 'Tạo notification thành công',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo notification' })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationService.create(
      createNotificationDto,
    );
    return { data: notification };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy danh sách notifications (tự động filter theo employee hiện tại)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách notifications',
    type: NotificationListResponseDto,
  })
  async findAll(
    @Query() query: QueryNotificationDto,
    @CurrentUser() user: any,
  ): Promise<NotificationListResponseDto> {
    // Lấy employeeId từ user (user.id từ JWT là employeeId)
    const employeeId = user?.id;
    const result = await this.notificationService.findAll(query, employeeId);
    return {
      data: result.data.map((n) => ({
        id: n.id,
        employeeId: n.employeeId,
        type: n.type,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('unread')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Lấy danh sách notifications chưa đọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách notifications chưa đọc',
    type: NotificationListResponseDto,
  })
  async findUnread(
    @Query() query: QueryNotificationDto,
    @CurrentUser() user: any,
  ): Promise<NotificationListResponseDto> {
    const employeeId = user?.id;
    if (!employeeId) {
      throw new Error('Employee ID not found in user context');
    }
    const result = await this.notificationService.findUnread(employeeId, query);
    return {
      data: result.data.map((n) => ({
        id: n.id,
        employeeId: n.employeeId,
        type: n.type,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Đếm số notifications chưa đọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Số lượng notifications chưa đọc',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(
    @CurrentUser() user: any,
  ): Promise<UnreadCountResponseDto> {
    const employeeId = user?.id;
    if (!employeeId) {
      throw new Error('Employee ID not found in user context');
    }
    const count = await this.notificationService.getUnreadCount(employeeId);
    return { count };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy chi tiết một notification' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết notification',
    type: NotificationDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification không tồn tại' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<NotificationDetailResponseDto> {
    const employeeId = user?.id;
    const notification = await this.notificationService.findOne(
      id,
      employeeId,
    );
    return { data: notification };
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Đánh dấu notification đã đọc' })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu đã đọc thành công',
  })
  @ApiResponse({ status: 404, description: 'Notification không tồn tại' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<NotificationDetailResponseDto> {
    const employeeId = user?.id;
    const notification = await this.notificationService.markAsRead(
      id,
      employeeId,
    );
    return { data: notification };
  }

  @Patch('read-all')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Đánh dấu tất cả notifications đã đọc' })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu tất cả đã đọc thành công',
  })
  async markAllAsRead(@CurrentUser() user: any) {
    const employeeId = user?.id;
    if (!employeeId) {
      throw new Error('Employee ID not found in user context');
    }
    return await this.notificationService.markAllAsRead(employeeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Cập nhật notification' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({ status: 404, description: 'Notification không tồn tại' })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: any,
  ): Promise<NotificationDetailResponseDto> {
    const employeeId = user?.id;
    const notification = await this.notificationService.update(
      id,
      updateNotificationDto,
      employeeId,
    );
    return { data: notification };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Xóa notification' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  @ApiResponse({ status: 404, description: 'Notification không tồn tại' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const employeeId = user?.id;
    await this.notificationService.remove(id, employeeId);
    return { message: 'Xóa notification thành công' };
  }
}

