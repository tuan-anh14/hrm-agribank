import { Module } from '@nestjs/common';
import { RewardPenaltyService } from './reward-penalty.service';
import { RewardPenaltyController } from './reward-penalty.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RewardPenaltyController],
    providers: [RewardPenaltyService],
    exports: [RewardPenaltyService],
})
export class RewardPenaltyModule { }
