import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { UserRole } from '@/auth/constants/roles.constants';
import { QueryAuditLogDto } from '@/audit-log/dto/query-audit-log.dto';
import {
  AuditLogListResponseDto,
  AuditLogDetailDto,
} from '@/audit-log/dto/audit-log-response.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('AuditLog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Danh sách audit log với filter & phân trang' })
  async findAll(
    @Query() query: QueryAuditLogDto,
  ): Promise<AuditLogListResponseDto> {
    return this.auditLogService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Chi tiết một audit log' })
  async findOne(@Param('id') id: string): Promise<AuditLogDetailDto> {
    const log = await this.auditLogService.findOne(id);
    return { data: log };
  }
}


