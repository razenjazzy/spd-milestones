import axios from "axios";
import { ENV_CONFIG } from "../config/environment";
import { logger } from "../utils/logger";

const api = axios.create({
  baseURL: ENV_CONFIG.API_BASE,
  timeout: ENV_CONFIG.API_TIMEOUT,
});

// Request interceptor for logging and auth token
api.interceptors.request.use(
  (config) => {
    logger.apiRequest(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
    
    // Add JWT token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      response.data
    );
    return response;
  },
  (error) => {
    const status = error.response?.status || 500;
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'GET';
    
    logger.apiResponse(method, url, status, error.response?.data);
    logger.error('API Error', error, { 
      url, 
      method, 
      status,
      message: error.response?.data?.message || error.message 
    });
    
    // Handle 401 - redirect to login
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (email: string, password: string, name?: string, role?: "admin" | "user", registrationKey?: string) =>
    api.post("/auth/register", { email, password, name, role, registrationKey }),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

// Project API functions
export const projectAPI = {
  getAll: () => api.get("/projects"),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getGantt: (id: string) => api.get(`/projects/${id}/gantt`),
};

// Milestone API functions
export const milestoneAPI = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/milestones`),
  getDeletedByProject: (projectId: string) => api.get(`/projects/${projectId}/milestones/deleted`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/milestones`, data),
  update: (projectId: string, milestoneId: string, data: any) => api.put(`/projects/${projectId}/milestones/${milestoneId}`, data),
  updateDates: (projectId: string, milestoneId: string, data: { newStart: string; newEnd: string; reason: string }) => 
    api.put(`/projects/${projectId}/milestones/${milestoneId}/dates`, data),
  reorder: (projectId: string, milestones: { id: string; order: number }[]) => 
    api.put(`/projects/${projectId}/milestones/reorder`, { milestones }),
  updateOrder: (projectId: string, order: string[]) => 
    api.put(`/milestones/order/${projectId}`, { order }),
  delete: (projectId: string, milestoneId: string) => api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
  restore: (projectId: string, milestoneId: string) => api.put(`/projects/${projectId}/milestones/${milestoneId}/restore`),
  permanentDelete: (projectId: string, milestoneId: string) => api.delete(`/projects/${projectId}/milestones/${milestoneId}/permanent`),
};

export const activityAPI = {
  list: (params?: { projectId?: string; releaseId?: string; activityKind?: string; year?: number; month?: number }) =>
    api.get(`/activities`, {
      params: {
        ...(params?.projectId ? { projectId: params.projectId } : {}),
        ...(params?.releaseId ? { releaseId: params.releaseId } : {}),
        ...(params?.activityKind ? { activityKind: params.activityKind } : {}),
        ...(params?.year ? { year: params.year } : {}),
        ...(params?.month ? { month: params.month } : {}),
      },
    }),
  getByProject: (projectId: string, year?: number, month?: number) =>
    api.get(`/projects/${projectId}/activities`, {
      params: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
      },
    }),
  createStandalone: (data: any) => api.post(`/activities`, data),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/activities`, data),
  createByRelease: (releaseId: string, data: any) => api.post(`/releases/${releaseId}/activities`, data),
  updateStandalone: (activityId: string, data: any) => api.put(`/activities/${activityId}`, data),
  update: (projectId: string, activityId: string, data: any) => api.put(`/projects/${projectId}/activities/${activityId}`, data),
  updateByRelease: (releaseId: string, activityId: string, data: any) => api.put(`/releases/${releaseId}/activities/${activityId}`, data),
  deleteStandalone: (activityId: string) => api.delete(`/activities/${activityId}`),
  delete: (projectId: string, activityId: string) => api.delete(`/projects/${projectId}/activities/${activityId}`),
  deleteByRelease: (releaseId: string, activityId: string) => api.delete(`/releases/${releaseId}/activities/${activityId}`),
  copyMonthStandalone: (payload: { projectId?: string; fromYear: number; fromMonth: number; toYear: number; toMonth: number }) =>
    api.post(`/activities/copy-month`, payload),
  copyMonth: (
    projectId: string,
    payload: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }
  ) => api.post(`/projects/${projectId}/activities/copy-month`, payload),
};

export const releaseAPI = {
  list: (params?: { projectId?: string; activityId?: string }) => api.get(`/releases`, { params }),
  listByProject: (projectId: string, activityId?: string) => api.get(`/projects/${projectId}/releases`, { params: { activityId } }),
  create: (data: any) => api.post(`/releases`, data),
  update: (id: string, data: any) => api.put(`/releases/${id}`, data),
  delete: (id: string) => api.delete(`/releases/${id}`),
  adminRevalidateLink: (id: string, adminPassword: string) => api.post(`/releases/${id}/link/admin-revalidate`, { adminPassword }),
  issueOneTimeCode: (id: string) => api.post(`/releases/${id}/link/one-time-code`),
  redeemOneTimeCode: (id: string, code: string) => api.post(`/releases/${id}/link/redeem`, { code }),
  revealArtifact: (id: string, password: string, artifact: "downloadLink" | "dbScriptLink" | "jarAppLink") =>
    api.post(`/releases/${id}/artifacts/reveal`, { password, artifact }),
};

export const usersAPI = {
  list: () => api.get(`/users`),
  create: (payload: any) => api.post(`/users`, payload),
  update: (id: string, payload: any) => api.put(`/users/${id}`, payload),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const settingsAPI = {
  get: () => api.get(`/settings`),
  update: (payload: any) => api.put(`/settings`, payload),
};

export const dashboardAPI = {
  pipeline: () => api.get(`/projects/dashboard/pipeline`),
};

export const aiAPI = {
  runCommand: (data: { prompt?: string; projectId?: string; provider?: "local" | "gemini" | "gemini-cli"; model?: string; command?: any }) =>
    api.post("/ai/command", data),
};

export default api;
