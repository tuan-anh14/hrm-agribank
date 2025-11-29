import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { EmployeeService } from '@/employee/employee.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly employeeService: EmployeeService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách chấm công (Admin/HR)' })
  @ApiResponse({ status: 200, description: 'Danh sách chấm công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.getAll(query);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy danh sách chấm công theo nhân viên' })
  @ApiResponse({ status: 200, description: 'Danh sách chấm công của nhân viên' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  async getByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: QueryAttendanceDto,
    @Req() req: any,
  ) {
    // Employee chỉ có thể xem chấm công của chính mình
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || employee.id !== employeeId) {
        throw new ForbiddenException('Bạn chỉ có thể xem chấm công của chính mình');
      }
    }

    return this.attendanceService.getByEmployeeId(employeeId, query);
  }

  @Get('me')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách chấm công của bản thân' })
  @ApiResponse({ status: 200, description: 'Danh sách chấm công của bản thân' })
  async getMyAttendance(@Query() query: QueryAttendanceDto, @Req() req: any) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    return this.attendanceService.getByEmployeeId(employee.id, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy chi tiết chấm công theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin chấm công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chấm công' })
  async getById(@Param('id') id: string, @Req() req: any) {
    const attendance = await this.attendanceService.getById(id);

    // Employee chỉ có thể xem chấm công của chính mình
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || attendance.employeeId !== employee.id) {
        throw new ForbiddenException('Bạn chỉ có thể xem chấm công của chính mình');
      }
    }

    return attendance;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo mới chấm công (Admin/HR)' })
  @ApiResponse({ status: 201, description: 'Tạo chấm công thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo chấm công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  @ApiResponse({ status: 409, description: 'Chấm công đã tồn tại' })
  async create(@Body() data: CreateAttendanceDto) {
    return this.attendanceService.create(data);
  }

  @Post('check-in')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Check-in (Chấm công vào)' })
  @ApiResponse({ status: 201, description: 'Check-in thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền check-in' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
  @ApiResponse({ status: 409, description: 'Đã check-in hôm nay' })
  async checkIn(@Body() data: CheckInDto, @Req() req: any) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    return this.attendanceService.checkIn(employee.id, data);
  }

  @Post('check-out')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Check-out (Chấm công ra)' })
  @ApiResponse({ status: 200, description: 'Check-out thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền check-out' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chấm công hôm nay' })
  @ApiResponse({ status: 409, description: 'Đã check-out hôm nay' })
  async checkOut(@Body() data: CheckOutDto, @Req() req: any) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    return this.attendanceService.checkOut(employee.id, data);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật chấm công (Admin/HR)' })
  @ApiResponse({ status: 200, description: 'Cập nhật chấm công thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật chấm công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chấm công' })
  @ApiResponse({ status: 409, description: 'Chấm công đã tồn tại' })
  async update(@Param('id') id: string, @Body() data: UpdateAttendanceDto) {
    return this.attendanceService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoá chấm công (chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Xoá chấm công thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Admin mới có quyền xoá chấm công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chấm công' })
  async delete(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }

  @Post('check-forgot-checkout')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({
    summary: 'Kiểm tra và gửi notification cho employees quên checkout (Admin/HR)',
    description: 'Kiểm tra attendance của ngày hôm trước có check-in nhưng không có check-out, sau đó gửi notification cho từng employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã kiểm tra và gửi notification',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Số lượng notification đã gửi' },
      },
    },
  })
  async checkForgotCheckOut() {
    return this.attendanceService.checkForgotCheckOut();
  }
}
