import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';
import { AuthModule } from '@/auth/auth.module';
import { DepartmentModule } from '@/department/department.module';
import { PositionModule } from './position/position.module';
import { AttendanceModule } from './attendance/attendance.module';
import { WorkscheduleModule } from './workschedule/workschedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, 
    EmployeeModule, 
    AuthModule, 
    DepartmentModule, PositionModule, AttendanceModule, WorkscheduleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
