import type { Employee } from '@/types/employee';
import type { Shift } from '@/types/shift';

export type WorkScheduleStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WorkSchedule {
    id: string;
    employeeId: string;
    shiftId: string;
    date: string;
    status: WorkScheduleStatus;
    note?: string;
    approvedById?: string;
    approvedDate?: string;
    createdAt: string;
    updatedAt: string;
    employee?: Employee;
    shift?: Shift;
    approvedBy?: {
        id: string;
        fullName: string;
        email?: string;
    } | null;
}

export interface WorkScheduleListResponse {
    data: WorkSchedule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QueryWorkScheduleParams {
    employeeId?: string;
    shiftId?: string;
    startDate?: string;
    endDate?: string;
    status?: WorkScheduleStatus;
    page?: number;
    limit?: number;
}

export interface CreateWorkSchedulePayload {
    employeeId: string;
    shiftId: string;
    date: string;
    note?: string;
}

export interface UpdateWorkSchedulePayload {
    employeeId?: string;
    shiftId?: string;
    date?: string;
    note?: string;
}

export interface ApproveWorkSchedulePayload {
    status: Extract<WorkScheduleStatus, 'APPROVED' | 'REJECTED'>;
    note?: string;
}

