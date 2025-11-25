import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardPenaltyDto } from './dto/create-reward-penalty.dto';
import { UpdateRewardPenaltyDto } from './dto/update-reward-penalty.dto';

@Injectable()
export class RewardPenaltyService {
    constructor(private readonly prisma: PrismaService) { }

    create(createRewardPenaltyDto: CreateRewardPenaltyDto) {
        return this.prisma.rewardPenalty.create({
            data: createRewardPenaltyDto,
        });
    }

    findAll() {
        return this.prisma.rewardPenalty.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.rewardPenalty.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true,
                    },
                },
            },
        });
    }

    update(id: string, updateRewardPenaltyDto: UpdateRewardPenaltyDto) {
        return this.prisma.rewardPenalty.update({
            where: { id },
            data: updateRewardPenaltyDto,
        });
    }

    remove(id: string) {
        return this.prisma.rewardPenalty.delete({
            where: { id },
        });
    }

    async getMonthlyRewards(employeeId: string, month: number, year: number) {
        // Calculate start and end of the month
        // Note: month is 1-12
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        return this.prisma.rewardPenalty.findMany({
            where: {
                employeeId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }
}
