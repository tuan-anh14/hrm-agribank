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
import { ShiftModule } from './shift/shift.module';
import { PayrollModule } from './payroll/payroll.module';
import { RewardPenaltyModule } from './reward-penalty/reward-penalty.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EmployeeModule,
    AuthModule,
    DepartmentModule,
    PositionModule,
    AttendanceModule,
    WorkscheduleModule,
    ShiftModule,
    PayrollModule,
    RewardPenaltyModule,
    AuditLogModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
