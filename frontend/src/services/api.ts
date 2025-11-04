import axios from 'services/axios.customize';
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload, CreateEmployeeWithAccountPayload } from '@/types/employee';

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

export const getAllDepartmentsAPI = () => {
    const urlBackend = "/api/v1/department";
    return axios.get<IBackendRes<any[]>>(urlBackend);
}

export const getAllPositionsAPI = () => {
    const urlBackend = "/api/v1/position";
    return axios.get<IBackendRes<any[]>>(urlBackend);
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