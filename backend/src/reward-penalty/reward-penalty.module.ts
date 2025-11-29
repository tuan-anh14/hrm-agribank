import { Module } from '@nestjs/common';
import { RewardPenaltyService } from './reward-penalty.service';
import { RewardPenaltyController } from './reward-penalty.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, AuditLogModule, NotificationModule],
  controllers: [RewardPenaltyController],
  providers: [RewardPenaltyService],
  exports: [RewardPenaltyService],
})
export class RewardPenaltyModule {}