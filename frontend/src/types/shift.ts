export const ShiftType = {
    MORNING: 'MORNING',
    AFTERNOON: 'AFTERNOON',
    FULL_DAY: 'FULL_DAY'
} as const;

export type ShiftType = typeof ShiftType[keyof typeof ShiftType];

export interface Shift {
    id: string;
    name: string;
    type: ShiftType;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShiftListResponse {
    data: Shift[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QueryShiftParams {
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateShiftPayload {
    name: string;
    type?: ShiftType;
    startTime: string;
    endTime: string;
}

export interface UpdateShiftPayload {
    name?: string;
    type?: ShiftType;
    startTime?: string;
    endTime?: string;
}

