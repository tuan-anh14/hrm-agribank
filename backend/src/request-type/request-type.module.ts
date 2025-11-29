import { Module } from '@nestjs/common';
import { RequestTypeService } from './request-type.service';
import { RequestTypeController } from './request-type.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  providers: [RequestTypeService],
  controllers: [RequestTypeController],
  exports: [RequestTypeService],
})
export class RequestTypeModule {}

