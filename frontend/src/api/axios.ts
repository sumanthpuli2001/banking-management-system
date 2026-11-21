import axios, { AxiosResponse } from 'axios';
import { cacheService } from './cache';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apex_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Consistently cache unwrapped payload for instant sub-second page rendering
    if (response.config.method?.toLowerCase() === 'get' && response.data?.success) {
      const payload = (response.data && typeof response.data === 'object' && 'data' in response.data && response.data.data !== undefined)
        ? response.data.data
        : response.data;
      cacheService.set(response.config.url || '', payload);
    }
    // Automatically invalidate cache on state mutations (POST, PUT, DELETE, PATCH)
    if (['post', 'put', 'delete', 'patch'].includes(response.config.method?.toLowerCase() || '')) {
      cacheService.invalidate();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('apex_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data?.accessToken) {
            const newToken = res.data.data.accessToken;
            localStorage.setItem('apex_access_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('apex_access_token');
          localStorage.removeItem('apex_refresh_token');
          localStorage.removeItem('apex_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

// High-speed cached GET request for instant navigation (< 1s)
export const cachedGet = async <T = any>(url: string, bypassCache: boolean = false, ttlMs?: number): Promise<T> => {
  if (!bypassCache) {
    const cached = cacheService.get<T>(url);
    if (cached !== null) {
      // Fire-and-forget background revalidation
      api.get(url).then((res) => {
        const payload = (res.data && typeof res.data === 'object' && 'data' in res.data && res.data.data !== undefined)
          ? res.data.data
          : res.data;
        cacheService.set(url, payload, ttlMs);
      }).catch(() => {});
      return cached;
    }
  }
  const res = await api.get(url);
  const payload = (res.data && typeof res.data === 'object' && 'data' in res.data && res.data.data !== undefined)
    ? res.data.data
    : res.data;
  cacheService.set(url, payload, ttlMs);
  return payload as T;
};

export default api;
