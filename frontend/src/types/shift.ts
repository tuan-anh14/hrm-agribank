export interface Shift {
    id: string;
    name: string;
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
    startTime: string;
    endTime: string;
}

export interface UpdateShiftPayload {
    name?: string;
    startTime?: string;
    endTime?: string;
}

