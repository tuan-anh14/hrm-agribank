

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RequestType {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        requests: number;
    };
}

export interface Request {
    id: string;
    employeeId: string;
    requestTypeId: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
    status: RequestStatus;
    approvedById?: string;
    approvedDate?: string;
    createdAt: string;
    updatedAt: string;
    employee?: {
        id: string;
        employeeCode: string;
        fullName: string;
        email?: string;
        department?: {
            id: string;
            name: string;
        } | null;
        position?: {
            id: string;
            title: string;
        } | null;
    };
    requestType?: RequestType;
    approvedBy?: {
        id: string;
        fullName: string;
        email?: string;
    } | null;
}

export interface RequestListResponse {
    data: Request[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface QueryRequestParams {
    employeeId?: string;
    requestTypeId?: string;
    startDate?: string;
    endDate?: string;
    status?: RequestStatus;
    page?: number;
    limit?: number;
}

export interface CreateRequestPayload {
    employeeId?: string;
    requestTypeId: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
}

export interface UpdateRequestPayload {
    requestTypeId?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
}

export interface ApproveRequestPayload {
    status: Extract<RequestStatus, 'APPROVED' | 'REJECTED'>;
    note?: string;
}

// RequestType types
export interface CreateRequestTypePayload {
    name: string;
    description?: string;
}

export interface UpdateRequestTypePayload {
    name?: string;
    description?: string;
}

