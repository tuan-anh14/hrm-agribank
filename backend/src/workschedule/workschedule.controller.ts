import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkscheduleService } from './workschedule.service';
import { CreateWorkScheduleDto } from './dto/create-workschedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-workschedule.dto';
import { QueryWorkScheduleDto } from './dto/query-workschedule.dto';
import { ApproveWorkScheduleDto } from './dto/approve-workschedule.dto';
import { NotifyMonthAvailableDto } from './dto/notify-month-available.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { EmployeeService } from '@/employee/employee.service';

@ApiBearerAuth()
@ApiTags('WorkSchedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workschedule')
export class WorkscheduleController {
  constructor(
    private readonly workscheduleService: WorkscheduleService,
    private readonly employeeService: EmployeeService,
  ) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Danh sách lịch làm việc' })
  async getAll(@Query() query: QueryWorkScheduleDto, @Req() req: any) {
    return this.workscheduleService.getAll(query, req.user);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Danh sách lịch làm việc theo nhân viên' })
  async getByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: QueryWorkScheduleDto,
    @Req() req: any,
  ) {
    if (req.user.role === UserRole.EMPLOYEE && req.user.id !== employeeId) {
      throw new ForbiddenException('Bạn chỉ có thể xem lịch làm việc của chính mình');
    }
    return this.workscheduleService.getByEmployee(employeeId, query);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lịch làm việc của chính mình' })
  async getMySchedules(@Req() req: any, @Query() query: QueryWorkScheduleDto) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new ForbiddenException('Không tìm thấy thông tin nhân viên');
    }
    return this.workscheduleService.getByEmployee(employee.id, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Xem chi tiết lịch làm việc' })
  async getById(@Param('id') id: string, @Req() req: any) {
    const schedule = await this.workscheduleService.getById(id, req.user);
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || schedule.employeeId !== employee.id) {
        throw new ForbiddenException('Bạn chỉ có thể xem lịch làm việc của chính mình');
      }
    }
    return schedule;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo lịch làm việc' })
  async create(@Body() dto: CreateWorkScheduleDto) {
    return this.workscheduleService.create(dto);
  }

  @Post('me')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Tạo lịch làm việc cho chính mình' })
  async createMySchedule(@Body() dto: Omit<CreateWorkScheduleDto, 'employeeId'>, @Req() req: any) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new ForbiddenException('Không tìm thấy thông tin nhân viên');
    }
    // Tự động gán employeeId cho nhân viên đang đăng nhập
    const createDto: CreateWorkScheduleDto = {
      ...dto,
      employeeId: employee.id,
    };
    return this.workscheduleService.create(createDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật lịch làm việc' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.workscheduleService.update(id, dto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Phê duyệt lịch làm việc' })
  async approve(@Param('id') id: string, @Body() dto: ApproveWorkScheduleDto, @Req() req: any) {
    return this.workscheduleService.approve(id, req.user, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Xoá lịch làm việc' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.workscheduleService.delete(id, req.user);
  }

  @Post('notify-month-available')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Gửi notification cho tất cả employees về lịch làm việc tháng mới (Admin/HR)',
    description: 'Gửi system notification cho tất cả employees đang làm việc về lịch làm việc tháng mới. Có thể gọi manual hoặc từ scheduled job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã gửi notification thành công',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Số lượng notification đã gửi' },
        month: { type: 'number', description: 'Tháng' },
        year: { type: 'number', description: 'Năm' },
      },
    },
  })
  async notifyMonthAvailable(
    @Body() dto: NotifyMonthAvailableDto,
  ): Promise<{ count: number; month: number; year: number }> {
    const result = await this.workscheduleService.notifyWorkScheduleMonthAvailable(
      dto.month,
      dto.year,
    );
    return {
      ...result,
      month: dto.month,
      year: dto.year,
    };
  }
}
