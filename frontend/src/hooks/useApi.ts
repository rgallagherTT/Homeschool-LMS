import { useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function useApi(): AxiosInstance {
  const session = useAuthStore((state) => state.session);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach auth token
    instance.interceptors.request.use(
      (config) => {
        const currentSession = useAuthStore.getState().session;
        if (currentSession?.access_token) {
          config.headers.Authorization = `Bearer ${currentSession.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, sign out and redirect to login
          await useAuthStore.getState().signOut();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [session?.access_token]);

  return api;
}

// Standalone API instance for use outside of React components
export function createApiInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const currentSession = useAuthStore.getState().session;
    if (currentSession?.access_token) {
      config.headers.Authorization = `Bearer ${currentSession.access_token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await useAuthStore.getState().signOut();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export default useApi;
