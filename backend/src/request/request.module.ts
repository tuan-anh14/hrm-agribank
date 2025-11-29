import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';
import { EmployeeModule } from '@/employee/employee.module';

@Module({
  imports: [PrismaModule, AuditLogModule, NotificationModule, EmployeeModule],
  providers: [RequestService],
  controllers: [RequestController],
  exports: [RequestService],
})
export class RequestModule {}

