import axios from "axios";
import { useAuthStore } from "../store/authStore";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Request interceptor to add token
instance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore.getState();
    let token = authStore.token;

    // Fallback to localStorage if Zustand store is empty
    if (!token) {
      token = localStorage.getItem("auth_token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default instance;
