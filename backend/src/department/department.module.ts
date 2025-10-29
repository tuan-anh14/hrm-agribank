import { Module } from '@nestjs/common';
import { DepartmentService } from '@/department/department.service';
import { DepartmentController } from '@/department/department.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DepartmentService],
  controllers: [DepartmentController]
})
export class DepartmentModule {}
