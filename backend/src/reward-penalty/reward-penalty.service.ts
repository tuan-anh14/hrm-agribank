import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardPenaltyDto } from './dto/create-reward-penalty.dto';
import { UpdateRewardPenaltyDto } from './dto/update-reward-penalty.dto';
import { AuditAction, AuditModule, AuditStatus, RewardPenaltyType } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { NotificationService } from '@/notification/notification.service';
import {
    notifyRewardCreated,
    notifyPenaltyCreated,
} from '@/notification/notification-templates.helper';

@Injectable()
export class RewardPenaltyService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLogService: AuditLogService,
        private readonly notificationService: NotificationService,
    ) { }

    async create(createRewardPenaltyDto: CreateRewardPenaltyDto) {
        const rewardPenalty = await this.prisma.rewardPenalty.create({
            data: createRewardPenaltyDto,
        });

        await this.auditLogService.createLog({
            module: AuditModule.REWARD_PENALTY,
            action: AuditAction.CREATE,
            status: AuditStatus.SUCCESS,
            entityName: 'RewardPenalty',
            entityId: rewardPenalty.id,
            afterData: rewardPenalty,
            description: `Tạo thưởng/phạt cho nhân sự ${rewardPenalty.employeeId}`,
        });

        // Gửi notification cho employee
        try {
            if (rewardPenalty.type === RewardPenaltyType.REWARD) {
                await notifyRewardCreated(
                    this.notificationService,
                    rewardPenalty.employeeId,
                    rewardPenalty.amount,
                    rewardPenalty.reason || undefined,
                );
            } else if (rewardPenalty.type === RewardPenaltyType.PENALTY) {
                await notifyPenaltyCreated(
                    this.notificationService,
                    rewardPenalty.employeeId,
                    rewardPenalty.amount,
                    rewardPenalty.reason || undefined,
                );
            }
        } catch (error) {
            console.error(`Error sending notification for reward/penalty ${rewardPenalty.id}:`, error);
        }

        return rewardPenalty;
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

    async update(id: string, updateRewardPenaltyDto: UpdateRewardPenaltyDto) {
        const before = await this.prisma.rewardPenalty.findUnique({ where: { id } });
        if (!before) {
            throw new NotFoundException(`RewardPenalty with ID ${id} not found`);
        }

        const rewardPenalty = await this.prisma.rewardPenalty.update({
            where: { id },
            data: updateRewardPenaltyDto,
        });

        await this.auditLogService.createLog({
            module: AuditModule.REWARD_PENALTY,
            action: AuditAction.UPDATE,
            status: AuditStatus.SUCCESS,
            entityName: 'RewardPenalty',
            entityId: rewardPenalty.id,
            beforeData: before,
            afterData: rewardPenalty,
            description: `Cập nhật thưởng/phạt ${rewardPenalty.id}`,
        });

        return rewardPenalty;
    }

    async remove(id: string) {
        const before = await this.prisma.rewardPenalty.findUnique({ where: { id } });

        const rewardPenalty = await this.prisma.rewardPenalty.delete({
            where: { id },
        });

        await this.auditLogService.createLog({
            module: AuditModule.REWARD_PENALTY,
            action: AuditAction.DELETE,
            status: AuditStatus.SUCCESS,
            entityName: 'RewardPenalty',
            entityId: id,
            beforeData: before ?? undefined,
            description: `Xóa thưởng/phạt ${id}`,
        });

        return rewardPenalty;
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
