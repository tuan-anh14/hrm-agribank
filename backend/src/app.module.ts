import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmployeeModule } from '@/employee/employee.module';
import { AuthModule } from '@/auth/auth.module';
import { DepartmentModule } from '@/department/department.module';
import { PositionModule } from './position/position.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, 
    EmployeeModule, 
    AuthModule, 
    DepartmentModule, PositionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
