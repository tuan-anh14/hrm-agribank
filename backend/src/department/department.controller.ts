import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentService } from '@/department/department.service';
import { CreateDepartmentDto } from '@/department/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/department/dto/update-department.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Department')
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách phòng ban' })
  @ApiResponse({ status: 200, description: 'Danh sách phòng ban' })
  async getAll(@CurrentUser() user: any) {
    return this.departmentService.getAll(user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy chi tiết phòng ban theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin phòng ban' })
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentService.getById(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo mới phòng ban' })
  @ApiResponse({ status: 201, description: 'Tạo phòng ban thành công' })
  async create(@Body() data: CreateDepartmentDto, @CurrentUser() user: any) {
    return this.departmentService.create(data, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật phòng ban' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() data: UpdateDepartmentDto, @CurrentUser() user: any) {
    return this.departmentService.update(id, data, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoá phòng ban' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentService.delete(id, user);
  }
}
