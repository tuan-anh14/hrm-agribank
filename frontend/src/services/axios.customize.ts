import axios from "axios";

// Get backend URL from environment variable or use default
const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
console.log(">>check backend:", backend);

const instance = axios.create({
    baseURL: backend,
});

// Add a request interceptor
instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  const token = localStorage.getItem("access_token");
  const auth = token ? `Bearer ${token}` : '';
  config.headers['Authorization'] = auth;
  return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
    });

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    if(response && response.data){
        return response.data
    } 
    return response;
}, function (error) {
    // Handle network errors (no response from server)
    if (!error.response) {
        // Network error - server không phản hồi
        const networkError = new Error('Network Error');
        (networkError as any).code = error.code || 'ERR_NETWORK';
        (networkError as any).message = error.message || 'Không thể kết nối đến server';
        return Promise.reject(networkError);
    }

    // Server responded with error status
    if(error?.response?.data) {
        return Promise.reject(error);
    }
    
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    return Promise.reject(error);
});

export default instance;