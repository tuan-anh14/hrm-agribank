import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardPenaltyDto } from './create-reward-penalty.dto';

export class UpdateRewardPenaltyDto extends PartialType(CreateRewardPenaltyDto) { }
