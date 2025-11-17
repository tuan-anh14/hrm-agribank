import axios from 'services/axios.customize';
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload, CreateEmployeeWithAccountPayload } from '@/types/employee';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/types/department';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '@/types/position';

export const loginAPI = (username: string, password: string) => {
    const urlBackend = "/api/v1/auth/login"
    return axios.post<IBackendRes<ILoginHRM>>(urlBackend, {username, password})
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