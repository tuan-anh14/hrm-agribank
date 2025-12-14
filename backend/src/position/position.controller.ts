import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PositionService } from '@/position/position.service';
import { CreatePositionDto } from '@/position/dto/create-position.dto';
import { UpdatePositionDto } from '@/position/dto/update-position.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Position')
@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy danh sách chức vụ' })
  @ApiResponse({ status: 200, description: 'Danh sách chức vụ' })
  async getAll() {
    return this.positionService.getAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Lấy chi tiết chức vụ theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin chức vụ' })
  async getById(@Param('id') id: string) {
    return this.positionService.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo mới chức vụ' })
  @ApiResponse({ status: 201, description: 'Tạo chức vụ thành công' })
  async create(@Body() data: CreatePositionDto, @CurrentUser() user: any) {
    return this.positionService.create(data, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật chức vụ' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() data: UpdatePositionDto, @CurrentUser() user: any) {
    return this.positionService.update(id, data, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoá chức vụ' })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.positionService.delete(id, user);
  }
}
