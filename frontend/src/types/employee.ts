export enum EmployeeType {
    FULL_TIME = 'FULL_TIME',
    PART_TIME = 'PART_TIME'
}

export interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    type: EmployeeType;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    positionId?: string | null;
    departmentId?: string | null;
    startDate?: string;
    status?: string;
    salaryCoefficient?: number;
    hourlyRate?: number;
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
    employeeCode?: string;
    type?: EmployeeType;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
    startDate?: string;
    salaryCoefficient?: number;
    hourlyRate?: number;
}

export interface UpdateEmployeePayload {
    fullName?: string;
    employeeCode?: string;
    type?: EmployeeType;
    email?: string;
    gender?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    departmentId?: string;
    positionId?: string;
    status?: string;
    startDate?: string;
    salaryCoefficient?: number;
    hourlyRate?: number;
}

export interface CreateEmployeeWithAccountPayload {
    fullName: string;
    employeeCode?: string;
    type?: EmployeeType;
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
    startDate?: string;
    salaryCoefficient?: number;
    hourlyRate?: number;
}

