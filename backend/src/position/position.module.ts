import { Module } from '@nestjs/common';
import { PositionService } from '@/position/position.service';
import { PositionController } from '@/position/position.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  providers: [PositionService],
  controllers: [PositionController],
  exports: [PositionService],
})
export class PositionModule {}