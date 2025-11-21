export interface Payroll {
    id: string;
    employeeId: string;
    month: number;
    year: number;
    salaryCoefficient?: number;
    baseSalary?: number;
    standardWorkHours: number;
    overtimeHours: number;
    totalWorkAmount: number;
    totalOTAmount: number;
    bonus?: number;
    allowance?: number;
    deduction?: number;
    totalSalary: number;
    status: string;
    employee?: {
        id: string;
        fullName: string;
        employeeCode: string;
        type?: string;
        department?: {
            id: string;
            name: string;
        };
        position?: {
            id: string;
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
    total?: number;
}
