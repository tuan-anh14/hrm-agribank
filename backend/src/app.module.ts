import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeeModule } from './employee/employee.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, EmployeeModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
