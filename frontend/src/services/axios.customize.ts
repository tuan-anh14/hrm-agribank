import axios from "axios";
import { removeToken } from "@/utils/token.util";

const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
console.log(">>check backend:", backend);

const instance = axios.create({
    baseURL: backend,
});

instance.interceptors.request.use(function (config) {
  const token = localStorage.getItem("access_token");
  const auth = token ? `Bearer ${token}` : '';
  config.headers['Authorization'] = auth;
  return config;
}, function (error) {
    return Promise.reject(error);
    });

instance.interceptors.response.use(function (response) {
    if(response && response.data){
        return response.data
    } 
    return response;
}, function (error) {
    if (error?.response?.status === 401) {
        removeToken();
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }

    if (!error.response) {
        const networkError = new Error('Network Error');
        (networkError as any).code = error.code || 'ERR_NETWORK';
        (networkError as any).message = error.message || 'Không thể kết nối đến server';
        return Promise.reject(networkError);
    }

    return Promise.reject(error);
});

export default instance;