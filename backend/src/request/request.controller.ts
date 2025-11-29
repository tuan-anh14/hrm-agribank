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
import { RequestService } from './request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { QueryRequestDto } from './dto/query-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { EmployeeService } from '@/employee/employee.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Request')
@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly employeeService: EmployeeService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Danh sách đơn (Admin/HR)' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn' })
  async getAll(@Query() query: QueryRequestDto) {
    return this.requestService.getAll(query);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Danh sách đơn theo nhân viên' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn của nhân viên' })
  async getByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: QueryRequestDto,
    @Req() req: any,
  ) {
    // Employee chỉ có thể xem đơn của chính mình
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || employee.id !== employeeId) {
        throw new ForbiddenException('Bạn chỉ có thể xem đơn của chính mình');
      }
    }
    return this.requestService.getByEmployee(employeeId, query);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Danh sách đơn của chính mình' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn của tôi' })
  async getMyRequests(@Req() req: any, @Query() query: QueryRequestDto) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new ForbiddenException('Không tìm thấy thông tin nhân viên');
    }
    return this.requestService.getByEmployee(employee.id, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Xem chi tiết đơn' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn' })
  async getById(@Param('id') id: string, @Req() req: any) {
    const request = await this.requestService.getById(id);
    // Employee chỉ có thể xem đơn của chính mình
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || request.employeeId !== employee.id) {
        throw new ForbiddenException('Bạn chỉ có thể xem đơn của chính mình');
      }
    }
    return request;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Tạo đơn mới' })
  @ApiResponse({ status: 201, description: 'Tạo đơn thành công' })
  async create(@Body() dto: CreateRequestDto, @Req() req: any) {
    // Employee chỉ có thể tạo đơn cho chính mình
    if (req.user.role === UserRole.EMPLOYEE) {
      const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
      if (!employee || dto.employeeId !== employee.id) {
        throw new ForbiddenException('Bạn chỉ có thể tạo đơn cho chính mình');
      }
    }
    return this.requestService.create(dto, req.user);
  }

  @Post('me')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Tạo đơn cho chính mình (Employee)' })
  @ApiResponse({ status: 201, description: 'Tạo đơn thành công' })
  async createMyRequest(
    @Body() dto: Omit<CreateRequestDto, 'employeeId'>,
    @Req() req: any,
  ) {
    const employee = await this.employeeService.getEmployeeWithAccountByUserId(req.user.id);
    if (!employee) {
      throw new ForbiddenException('Không tìm thấy thông tin nhân viên');
    }
    // Tự động gán employeeId cho nhân viên đang đăng nhập
    const createDto: CreateRequestDto = {
      ...dto,
      employeeId: employee.id,
    };
    return this.requestService.create(createDto, req.user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Cập nhật đơn' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
    @Req() req: any,
  ) {
    return this.requestService.update(id, dto, req.user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Phê duyệt/từ chối đơn (Admin/HR)' })
  @ApiResponse({ status: 200, description: 'Phê duyệt thành công' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveRequestDto,
    @Req() req: any,
  ) {
    // req.user.id là employee ID từ JWT payload
    return this.requestService.approve(id, req.user.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Xóa đơn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.requestService.delete(id, req.user);
  }
}

