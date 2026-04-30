import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config/apiConfig';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Add request interceptor to include token in all requests
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth state
            Cookies.remove('token');
            Cookies.remove('user');
            // Redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
