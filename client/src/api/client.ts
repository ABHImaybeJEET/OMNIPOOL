import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  async (config) => {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

// ===== AI Endpoints =====
export const parseProject = (raw_description: string) =>
  api.post("/ai/parse-project", { raw_description });

export const matchResources = (
  extrapolated_BOM: unknown[],
  required_skills: string[],
) => api.post("/ai/match-resources", { extrapolated_BOM, required_skills });

// ===== User Endpoints =====
export const syncUser = (data?: { name?: string }) =>
  api.post("/users/sync", data || {});

export const getUsers = () => api.get("/users");

export const getUserById = (id: string) => api.get(`/users/${id}`);

export const updateUser = (id: string, data: Record<string, unknown>) =>
  api.put(`/users/${id}`, data);

// ===== Hardware Endpoints =====
export const getHardware = (params?: Record<string, string>) =>
  api.get("/hardware", { params });

export const createHardware = (data: Record<string, unknown>) =>
  api.post("/hardware", data);

export const updateHardware = (id: string, data: Record<string, unknown>) =>
  api.put(`/hardware/${id}`, data);

export const deleteHardware = (id: string) => api.delete(`/hardware/${id}`);

// ===== Project Endpoints =====
export const getProjects = (params?: Record<string, string>) =>
  api.get("/projects", { params });

export const createProject = (data: {
  title: string;
  raw_description: string;
}) => api.post("/projects", data);

export const getProjectById = (id: string) => api.get(`/projects/${id}`);

export const updateProject = (id: string, data: Record<string, unknown>) =>
  api.put(`/projects/${id}`, data);

export default api;
