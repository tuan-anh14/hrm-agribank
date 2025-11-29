import { Module } from '@nestjs/common';
import { EmployeeService } from '@/employee/employee.service';
import { EmployeeController } from '@/employee/employee.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, AuditLogModule, NotificationModule],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService]
})
export class EmployeeModule {}
