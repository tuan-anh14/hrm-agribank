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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestTypeService } from './request-type.service';
import { CreateRequestTypeDto } from './dto/create-request-type.dto';
import { UpdateRequestTypeDto } from './dto/update-request-type.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('RequestType')
@Controller('request-type')
export class RequestTypeController {
  constructor(private readonly requestTypeService: RequestTypeService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy danh sách loại đơn' })
  @ApiResponse({ status: 200, description: 'Danh sách loại đơn' })
  async getAll() {
    return this.requestTypeService.getAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Lấy chi tiết loại đơn theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin loại đơn' })
  async getById(@Param('id') id: string) {
    return this.requestTypeService.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo mới loại đơn' })
  @ApiResponse({ status: 201, description: 'Tạo loại đơn thành công' })
  async create(
    @Body() data: CreateRequestTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.requestTypeService.create(data, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật loại đơn' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateRequestTypeDto,
    @CurrentUser() user: any,
  ) {
    return this.requestTypeService.update(id, data, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa loại đơn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.requestTypeService.delete(id, user);
  }
}

