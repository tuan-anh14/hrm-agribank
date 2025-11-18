import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';

@Module({
  imports: [PrismaModule, EmployeeModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
