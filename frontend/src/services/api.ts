import axios from 'services/axios.customize';
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload, CreateEmployeeWithAccountPayload } from '@/types/employee';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/types/department';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '@/types/position';
import type { Attendance, CreateAttendancePayload, UpdateAttendancePayload, QueryAttendanceParams, AttendanceListResponse, CheckInPayload, CheckOutPayload } from '@/types/attendance';
import type { Shift, ShiftListResponse, QueryShiftParams, CreateShiftPayload, UpdateShiftPayload } from '@/types/shift';
import type { WorkSchedule, WorkScheduleListResponse, QueryWorkScheduleParams, CreateWorkSchedulePayload, UpdateWorkSchedulePayload, ApproveWorkSchedulePayload } from '@/types/workschedule';
import type { Payroll, GeneratePayrollPayload, QueryPayrollParams, PayrollListResponse } from '@/types/payroll';
import type { RewardPenalty, CreateRewardPenaltyDto } from '@/types/reward-penalty';

export const loginAPI = (username: string, password: string) => {
    const urlBackend = "/api/v1/auth/login"
    return axios.post<IBackendRes<ILoginHRM>>(urlBackend, { username, password })
}

export const activateAccountAPI = (payload: IActivateAccountReq) => {
    const urlBackend = "/api/v1/auth/activate";
    return axios.post<IBackendRes<IActivateAccountRes>>(urlBackend, payload, {
        headers: {
            delay: 2000
        }
    });
}

export const fetchAccountAPI = () => {
    const urlBackend = "/api/v1/auth/account";
    return axios.get<IBackendRes<IFetchAccount>>(urlBackend);
}

export const refreshTokenAPI = () => {
    const urlBackend = "/api/v1/auth/refresh";
    return axios.post<IBackendRes<IAuthTokens>>(urlBackend, {});
}

export const logoutAPI = () => {
    const urlBackend = "/api/v1/auth/logout";
    return axios.post<IBackendRes<{ success: boolean }>>(urlBackend, {});
}

// Employee APIs
export const createEmployeeWithAccountAPI = (payload: CreateEmployeeWithAccountPayload) => {
    const urlBackend = "/api/v1/employee/with-account";
    return axios.post<IBackendRes<{ message: string; employee: Employee; account: any }>>(urlBackend, payload);
}

// Departments - CRUD Operations
export const getAllDepartmentsAPI = () => {
    const urlBackend = "/api/v1/department";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Department[]>(urlBackend);
}

export const getDepartmentByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.get<IBackendRes<Department>>(urlBackend);
}

export const createDepartmentAPI = (payload: CreateDepartmentPayload) => {
    const urlBackend = "/api/v1/department";
    return axios.post<IBackendRes<Department>>(urlBackend, payload);
}

export const updateDepartmentAPI = (id: string, payload: UpdateDepartmentPayload) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.put<IBackendRes<Department>>(urlBackend, payload);
}

export const deleteDepartmentAPI = (id: string) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.delete<IBackendRes<Department>>(urlBackend);
}

// Positions - CRUD Operations
export const getAllPositionsAPI = () => {
    const urlBackend = "/api/v1/position";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Position[]>(urlBackend);
}

export const getPositionByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.get<IBackendRes<Position>>(urlBackend);
}

export const createPositionAPI = (payload: CreatePositionPayload) => {
    const urlBackend = "/api/v1/position";
    return axios.post<IBackendRes<Position>>(urlBackend, payload);
}

export const updatePositionAPI = (id: string, payload: UpdatePositionPayload) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.put<IBackendRes<Position>>(urlBackend, payload);
}

export const deletePositionAPI = (id: string) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.delete<IBackendRes<Position>>(urlBackend);
}

// Employees - CRUD Operations
export const getAllEmployeesAPI = () => {
    const urlBackend = "/api/v1/employee";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Employee[]>(urlBackend);
}

export const getEmployeeByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.get<IBackendRes<Employee>>(urlBackend);
}

export const createEmployeeAPI = (payload: CreateEmployeePayload) => {
    const urlBackend = "/api/v1/employee";
    return axios.post<IBackendRes<Employee>>(urlBackend, payload);
}

export const updateEmployeeAPI = (id: string, payload: UpdateEmployeePayload) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.put<IBackendRes<Employee>>(urlBackend, payload);
}

export const deleteEmployeeAPI = (id: string) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.delete<IBackendRes<Employee>>(urlBackend);
}

// Attendance - CRUD Operations
export const getAllAttendancesAPI = (params?: QueryAttendanceParams) => {
    const urlBackend = "/api/v1/attendance";
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const getAttendanceByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.get<IBackendRes<Attendance>>(urlBackend);
}

export const getAttendancesByEmployeeIdAPI = (employeeId: string, params?: QueryAttendanceParams) => {
    const urlBackend = `/api/v1/attendance/employee/${employeeId}`;
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const getMyAttendancesAPI = (params?: QueryAttendanceParams) => {
    const urlBackend = "/api/v1/attendance/me";
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const createAttendanceAPI = (payload: CreateAttendancePayload) => {
    const urlBackend = "/api/v1/attendance";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

export const updateAttendanceAPI = (id: string, payload: UpdateAttendancePayload) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.put<IBackendRes<Attendance>>(urlBackend, payload);
}

export const deleteAttendanceAPI = (id: string) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.delete<IBackendRes<Attendance>>(urlBackend);
}

export const checkInAPI = (payload: CheckInPayload = {}) => {
    const urlBackend = "/api/v1/attendance/check-in";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

export const checkOutAPI = (payload: CheckOutPayload = {}) => {
    const urlBackend = "/api/v1/attendance/check-out";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

// Shifts - CRUD Operations
export const getAllShiftsAPI = (params?: QueryShiftParams) => {
    const urlBackend = "/api/v1/shift";
    return axios.get<ShiftListResponse>(urlBackend, { params });
}

export const getShiftByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.get<IBackendRes<Shift>>(urlBackend);
}

export const createShiftAPI = (payload: CreateShiftPayload) => {
    const urlBackend = "/api/v1/shift";
    return axios.post<IBackendRes<Shift>>(urlBackend, payload);
}

export const updateShiftAPI = (id: string, payload: UpdateShiftPayload) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.put<IBackendRes<Shift>>(urlBackend, payload);
}

export const deleteShiftAPI = (id: string) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.delete<IBackendRes<Shift>>(urlBackend);
}

// Work Schedule APIs
export const getAllWorkSchedulesAPI = (params?: QueryWorkScheduleParams) => {
    const urlBackend = "/api/v1/workschedule";
    return axios.get<WorkScheduleListResponse>(urlBackend, { params });
}

export const getWorkScheduleByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.get<IBackendRes<WorkSchedule>>(urlBackend);
}

export const createWorkScheduleAPI = (payload: CreateWorkSchedulePayload) => {
    const urlBackend = "/api/v1/workschedule";
    return axios.post<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const updateWorkScheduleAPI = (id: string, payload: UpdateWorkSchedulePayload) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.put<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const approveWorkScheduleAPI = (id: string, payload: ApproveWorkSchedulePayload) => {
    const urlBackend = `/api/v1/workschedule/${id}/approve`;
    return axios.patch<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const deleteWorkScheduleAPI = (id: string) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.delete<IBackendRes<WorkSchedule>>(urlBackend);
}

export const getMyWorkSchedulesAPI = (params?: QueryWorkScheduleParams) => {
    const urlBackend = "/api/v1/workschedule/me";
    return axios.get<WorkScheduleListResponse>(urlBackend, { params });
}

export const createMyWorkScheduleAPI = (payload: Omit<CreateWorkSchedulePayload, 'employeeId'>) => {
    const urlBackend = "/api/v1/workschedule/me";
    return axios.post<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

// Payroll APIs
export const generatePayrollAPI = (payload: GeneratePayrollPayload) => {
    const urlBackend = "/api/v1/payroll/generate";
    return axios.post<IBackendRes<Payroll[]>>(urlBackend, payload);
}

export const getAllPayrollsAPI = (params?: QueryPayrollParams) => {
    const urlBackend = "/api/v1/payroll";
    return axios.get<Payroll[]>(urlBackend, { params });
}

export const getPayrollByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/payroll/${id}`;
    return axios.get<IBackendRes<Payroll>>(urlBackend);
}

export const updatePayrollStatusAPI = (id: string, status: string) => {
    const urlBackend = `/api/v1/payroll/${id}/status`;
    return axios.patch<IBackendRes<Payroll>>(urlBackend, { status });
}

export const payPayrollAPI = (id: string) => {
    const urlBackend = `/api/v1/payroll/${id}/pay`;
    return axios.post<IBackendRes<Payroll>>(urlBackend, {});
}

// RewardPenalty APIs
export const createRewardPenaltyAPI = (payload: CreateRewardPenaltyDto) => {
    const urlBackend = "/api/v1/reward-penalty";
    return axios.post<IBackendRes<RewardPenalty>>(urlBackend, payload);
}

export const getAllRewardPenaltiesAPI = () => {
    const urlBackend = "/api/v1/reward-penalty";
    return axios.get<RewardPenalty[]>(urlBackend);
}

export const deleteRewardPenaltyAPI = (id: string) => {
    const urlBackend = `/api/v1/reward-penalty/${id}`;
    return axios.delete<IBackendRes<RewardPenalty>>(urlBackend);
}