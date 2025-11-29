import { Module } from '@nestjs/common';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditLogController } from '@/audit-log/audit-log.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule { }


