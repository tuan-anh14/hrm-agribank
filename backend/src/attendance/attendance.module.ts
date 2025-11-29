import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, EmployeeModule, AuditLogModule, NotificationModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
