export const RewardPenaltyType = {
    REWARD: 'REWARD',
    PENALTY: 'PENALTY',
} as const;

export type RewardPenaltyType = (typeof RewardPenaltyType)[keyof typeof RewardPenaltyType];

export interface RewardPenalty {
    id: string;
    employeeId: string;
    type: RewardPenaltyType;
    reason?: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
    employee?: {
        id: string;
        fullName: string;
        employeeCode: string;
    };
}

export interface CreateRewardPenaltyDto {
    employeeId: string;
    type: RewardPenaltyType;
    reason?: string;
    amount: number;
}
