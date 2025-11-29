import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { CurrentUser } from '@/decorator/customize';

@ApiBearerAuth()
@ApiTags('Shift')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Danh sách ca làm việc' })
  getAll(@Query() query: QueryShiftDto) {
    return this.shiftService.getAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Chi tiết ca làm việc' })
  getById(@Param('id') id: string) {
    return this.shiftService.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Tạo ca làm việc' })
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: any) {
    return this.shiftService.create(dto, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Cập nhật ca làm việc' })
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto, @CurrentUser() user: any) {
    return this.shiftService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Xoá ca làm việc' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shiftService.delete(id, user);
  }
}
