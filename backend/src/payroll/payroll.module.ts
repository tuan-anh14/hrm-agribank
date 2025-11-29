import { Module } from '@nestjs/common';
import { RewardPenaltyModule } from '../reward-penalty/reward-penalty.module';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogModule } from '@/audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, RewardPenaltyModule, AuditLogModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}