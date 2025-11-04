export interface Employee {
    id: string;
    fullName: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    positionId?: string | null;
    departmentId?: string | null;
    startDate?: string;
    status?: string;
    createdAt: string;
    updatedAt?: string;
    department?: {
        id: string;
        name: string;
    } | null;
    position?: {
        id: string;
        title: string;
    } | null;
}

export interface CreateEmployeePayload {
    fullName: string;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
    startDate?: string;
}

export interface UpdateEmployeePayload {
    fullName?: string;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
    startDate?: string;
}

export interface CreateEmployeeWithAccountPayload {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
}

