import { Module } from '@nestjs/common';
import { RewardPenaltyModule } from '../reward-penalty/reward-penalty.module';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, RewardPenaltyModule, AuditLogModule, NotificationModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}