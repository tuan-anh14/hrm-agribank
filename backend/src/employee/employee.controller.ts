import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from '@/employee/employee.service';
import { CreateEmployeeDto } from '@/employee/dto/create-employee.dto';
import { UpdateEmployeeDto } from '@/employee/dto/update-employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách nhân viên' })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getAll() {
    return this.employeeService.getAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy chi tiết nhân viên theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin nhân viên' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getById(@Param('id') id: string) {
    return this.employeeService.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo mới nhân viên' })
  @ApiResponse({ status: 201, description: 'Tạo nhân viên thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo nhân viên' })
  async create(@Body() data: CreateEmployeeDto) {
    return this.employeeService.create(data);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật nhân viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật nhân viên' })
  async update(@Param('id') id: string, @Body() data: UpdateEmployeeDto) {
    return this.employeeService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoá nhân viên' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ ADMIN mới có quyền xoá nhân viên' })
  async delete(@Param('id') id: string) {
    return this.employeeService.delete(id);
  }
}
