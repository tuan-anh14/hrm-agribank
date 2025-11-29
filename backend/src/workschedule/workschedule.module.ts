import { Module } from '@nestjs/common';
import { WorkscheduleController } from './workschedule.controller';
import { WorkscheduleService } from './workschedule.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, EmployeeModule, AuditLogModule, NotificationModule],
  controllers: [WorkscheduleController],
  providers: [WorkscheduleService],
  exports: [WorkscheduleService],
})
export class WorkscheduleModule {}
