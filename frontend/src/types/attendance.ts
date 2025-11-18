export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT';

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: AttendanceStatus;
    note?: string | null;
    createdAt: string;
    updatedAt?: string;
    employee?: {
        id: string;
        fullName: string;
        email?: string;
        phone?: string;
        department?: {
            id: string;
            name: string;
        } | null;
        position?: {
            id: string;
            title: string;
        } | null;
    };
}

export interface CreateAttendancePayload {
    employeeId: string;
    date?: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: AttendanceStatus;
    note?: string;
}

export interface UpdateAttendancePayload {
    employeeId?: string;
    date?: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: AttendanceStatus;
    note?: string;
}

export interface QueryAttendanceParams {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface AttendanceListResponse {
    data: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CheckInPayload {
    checkInTime?: string;
    note?: string;
}

export interface CheckOutPayload {
    checkOutTime?: string;
    note?: string;
}

