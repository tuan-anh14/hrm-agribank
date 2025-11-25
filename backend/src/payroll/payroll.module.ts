import { Module } from '@nestjs/common';
import { RewardPenaltyModule } from '../reward-penalty/reward-penalty.module';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
    imports: [PrismaModule, RewardPenaltyModule],
    controllers: [PayrollController],
    providers: [PayrollService],
    exports: [PayrollService],
})
export class PayrollModule { }
