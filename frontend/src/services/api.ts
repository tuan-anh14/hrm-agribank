import axios from 'services/axios.customize'

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
export const createEmployeeWithAccountAPI = (payload: {
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
}) => {
    const urlBackend = "/api/v1/employee/with-account";
    return axios.post<IBackendRes<{ message: string; employee: any; account: any }>>(urlBackend, payload);
}

export const getAllDepartmentsAPI = () => {
    const urlBackend = "/api/v1/department";
    return axios.get<IBackendRes<any[]>>(urlBackend);
}

export const getAllPositionsAPI = () => {
    const urlBackend = "/api/v1/position";
    return axios.get<IBackendRes<any[]>>(urlBackend);
}