import { Module } from '@nestjs/common';
import { EmployeeService } from '@/employee/employee.service';
import { EmployeeController } from '@/employee/employee.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService]
})
export class EmployeeModule {}
