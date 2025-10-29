import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/auth/constants/roles.constants';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Department')
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách phòng ban' })
  @ApiResponse({ status: 200, description: 'Danh sách phòng ban' })
  async getAll() {
    return this.departmentService.getAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy chi tiết phòng ban theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin phòng ban' })
  async getById(@Param('id') id: string) {
    return this.departmentService.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo mới phòng ban' })
  @ApiResponse({ status: 201, description: 'Tạo phòng ban thành công' })
  async create(@Body() data: CreateDepartmentDto) {
    return this.departmentService.create(data);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() data: UpdateDepartmentDto) {
    return this.departmentService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoá phòng ban' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  async delete(@Param('id') id: string) {
    return this.departmentService.delete(id);
  }
}
