import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';
import { CreateMessageDto, CreateMessageBodyDto, QueryMessageDto, CreateDirectMessageRoomDto } from './dto';
import { PrismaService } from '@/prisma/prisma.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('rooms')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy danh sách rooms mà user có quyền truy cập' })
  @ApiResponse({ status: 200, description: 'Danh sách rooms' })
  async getRooms(@CurrentUser() user: any) {
    return this.chatService.getRoomsForUser(user.id, user.role);
  }

  @Get('rooms/:roomId/messages')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn trong room' })
  @ApiResponse({ status: 200, description: 'Danh sách tin nhắn' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: QueryMessageDto,
    @CurrentUser() user: any,
  ) {
    // TODO: Thêm kiểm tra quyền truy cập room cho user (có thể thêm method trong service)
    return this.chatService.getMessages(roomId, query);
  }

  @Post('rooms/:roomId/messages')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gửi tin nhắn trong room (REST fallback)' })
  @ApiResponse({ status: 201, description: 'Gửi tin nhắn thành công' })
  async createMessage(
    @Param('roomId') roomId: string,
    @Body() dto: CreateMessageBodyDto,
    @CurrentUser() user: any,
  ) {
    // Gán roomId từ param vào DTO
    const createMessageDto: CreateMessageDto = {
      content: dto.content,
      roomId,
    };
    return this.chatService.createMessage(createMessageDto, user.id);
  }

  @Post('rooms/direct-message')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo room chat 1-1 với nhân viên khác' })
  @ApiResponse({ status: 201, description: 'Tạo room thành công' })
  async createDirectMessageRoom(
    @Body() dto: CreateDirectMessageRoomDto,
    @CurrentUser() user: any,
  ) {
    // user.id từ JWT token là Employee ID (từ payload.sub trong auth.service.ts)
    const currentEmployeeId = user.id;

    // Kiểm tra current employee tồn tại
    const currentEmployee = await this.prisma.employee.findUnique({
      where: { id: currentEmployeeId },
      select: { id: true },
    });

    if (!currentEmployee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên của bạn');
    }

    // otherUserId có thể là Account ID hoặc Employee ID
    // Thử tìm Account trước (nếu là Account ID)
    let otherEmployeeId: string | null = null;

    const otherAccount = await this.prisma.account.findUnique({
      where: { id: dto.otherUserId },
      select: { employeeId: true },
    });

    if (otherAccount && otherAccount.employeeId) {
      // otherUserId là Account ID
      otherEmployeeId = otherAccount.employeeId;
    } else {
      // Thử tìm Employee trực tiếp (nếu otherUserId là Employee ID)
      const otherEmployee = await this.prisma.employee.findUnique({
        where: { id: dto.otherUserId },
        select: { id: true },
      });

      if (otherEmployee) {
        otherEmployeeId = otherEmployee.id;
      }
    }

    if (!otherEmployeeId) {
      throw new NotFoundException(
        'Không tìm thấy thông tin nhân viên đối phương. Vui lòng kiểm tra ID đã đúng chưa (có thể là Account ID hoặc Employee ID)',
      );
    }

    // Kiểm tra không được tạo room với chính mình
    if (currentEmployeeId === otherEmployeeId) {
      throw new BadRequestException('Không thể tạo room chat với chính mình');
    }

    return this.chatService.getOrCreateDirectMessageRoom(
      currentEmployeeId,
      otherEmployeeId,
    );
  }

  @Patch('messages/:messageId/read')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu đã đọc thành công' })
  async markAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markAsRead(messageId, user.id);
  }

  @Patch('rooms/:roomId/read')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Đánh dấu tất cả tin nhắn trong room đã đọc' })
  @ApiResponse({ status: 200, description: 'Đánh dấu tất cả đã đọc thành công' })
  async markRoomAsRead(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markRoomAsRead(roomId, user.id);
  }
}

