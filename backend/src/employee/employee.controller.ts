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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhân viên' })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên' })
  async getAll() {
    return this.employeeService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết nhân viên theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin nhân viên' })
  async getById(@Param('id') id: string) {
    return this.employeeService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới nhân viên' })
  @ApiResponse({ status: 201, description: 'Tạo nhân viên thành công' })
  async create(@Body() data: CreateEmployeeDto) {
    return this.employeeService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật nhân viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() data: UpdateEmployeeDto) {
    return this.employeeService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá nhân viên' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  async delete(@Param('id') id: string) {
    return this.employeeService.delete(id);
  }
}
