import { Module } from '@nestjs/common';
import { WorkscheduleController } from './workschedule.controller';
import { WorkscheduleService } from './workschedule.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';

@Module({
  imports: [PrismaModule, EmployeeModule],
  controllers: [WorkscheduleController],
  providers: [WorkscheduleService],
  exports: [WorkscheduleService],
})
export class WorkscheduleModule {}
