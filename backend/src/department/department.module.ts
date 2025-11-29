import { Module } from '@nestjs/common';
import { DepartmentService } from '@/department/department.service';
import { DepartmentController } from '@/department/department.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  providers: [DepartmentService],
  controllers: [DepartmentController],
})
export class DepartmentModule {}