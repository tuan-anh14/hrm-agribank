export interface Payroll {
    id: string;
    employeeId: string;
    month: number;
    year: number;

    salaryCoefficient?: number;
    baseSalary?: number;

    standardWorkHours: number;
    overtimeHours: number;

    salaryV1?: number;
    salaryV2?: number;
    actualWorkDays?: number;

    totalWorkAmount: number;
    totalOTAmount: number;
    bonus?: number;
    allowance?: number;

    insuranceDeduction?: number;
    taxDeduction?: number;
    otherDeduction?: number;

    totalSalary: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';

    employee?: {
        id: string;
        fullName: string;
        employeeCode: string;
        department?: {
            name: string;
        };
        position?: {
            title: string;
        };
    };

    createdAt: string;
    updatedAt: string;
}

export interface GeneratePayrollPayload {
    month: number;
    year: number;
}

export interface QueryPayrollParams {
    employeeId?: string;
    month?: number;
    year?: number;
}

export interface PayrollListResponse {
    data: Payroll[];
    meta?: any;
}
