import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { RewardPenaltyType } from '@prisma/client';

export class CreateRewardPenaltyDto {
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @IsNotEmpty()
    @IsEnum(RewardPenaltyType)
    type: RewardPenaltyType;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;
}
