import axios from "axios";

export type UserRole = "viewer" | "admin";
export type AccountType = "community" | "enterprise";
export type EnterpriseStatus = "none" | "pending" | "accepted" | "rejected";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  bio?: string;
  token: string;
  avatar_url?: string;
  role: UserRole;
  account_type: AccountType;
  enterprise_status: EnterpriseStatus;
  company_name?: string;
  company_website?: string;
  gst_number?: string;
  points_total?: number;
  points_monthly?: number;
  donated_items_count?: number;
  donated_units_count?: number;
}

export type LeaderboardScope = "community" | "enterprise" | "all";
export type LeaderboardPeriod = "all" | "monthly";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  company_name: string;
  avatar_url: string;
  account_type: AccountType;
  enterprise_status: EnterpriseStatus;
  points_total: number;
  points_monthly: number;
  donated_items_count: number;
  donated_units_count: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
    : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem("omnipool_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch {
        // ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("omnipool_user");
    }
    return Promise.reject(error);
  },
);

// ===== AI Endpoints =====
export const parseProject = (raw_description: string) =>
  api.post("/ai/parse-project", { raw_description });

export const matchResources = (
  extrapolated_BOM: unknown[],
  required_skills: string[],
) => api.post("/ai/match-resources", { extrapolated_BOM, required_skills });

export const getAdvice = (
  raw_description: string,
  matched_hardware: unknown[],
  matched_mentors: unknown[],
) =>
  api.post("/ai/get-advice", {
    raw_description,
    matched_hardware,
    matched_mentors,
  });

export const createAiConversation = (data: {
  title?: string;
  prompt: string;
  aiResult?: unknown;
  projectAdvice?: unknown;
}) => api.post("/ai/conversations", data);

export const getAiConversations = () => api.get("/ai/conversations");

export const getAiConversationById = (id: string) =>
  api.get(`/ai/conversations/${id}`);

export const deleteAiConversation = (id: string) =>
  api.delete(`/ai/conversations/${id}`);

// ===== User Endpoints =====
export const checkEmail = (email: string) =>
  api.post("/users/check-email", { email });

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  skills?: string[];
}) => api.post("/users", data);

export const loginUser = (data: Record<string, string>) =>
  api.post("/users/login", data);

export const googleLoginUser = (data: {
  email: string;
  name: string;
  avatar_url: string;
}) => api.post("/users/google", data);

export const syncUser = (data: {
  firebaseUid: string;
  email: string;
  name?: string;
  avatar_url?: string;
}) => api.post("/users/sync", data);

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

// ===== Request Endpoints =====
export const createRequest = (data: {
  hardware_id?: string;
  quantity_requested?: number;
  message?: string;
  mentor_id?: string;
}) => api.post("/requests", data);

export const getRequests = (params?: Record<string, string>) =>
  api.get("/requests", { params });

export const updateRequestStatus = (id: string, data: { status: string }) =>
  api.put(`/requests/${id}`, data);

export const deleteRequestConversation = (id: string) =>
  api.delete(`/requests/${id}`);

export const clearRequestChat = (id: string) =>
  api.delete(`/requests/${id}/messages`);

// ===== Chat Endpoints =====
export const getConversations = () => api.get("/chat/conversations");

export const getChatMessages = (requestId: string) =>
  api.get(`/chat/${requestId}`);

// ===== Enterprise Endpoints =====
export const applyEnterprise = (data: {
  company_name: string;
  company_website?: string;
  gst_number?: string;
}) => api.post("/users/enterprise", data);

export const getEnterpriseApplications = (status: string = "pending") =>
  api.get(`/users/enterprise/applications?status=${status}`);

export const updateEnterpriseStatus = (
  id: string,
  status: Extract<EnterpriseStatus, "accepted" | "rejected">,
) => api.put(`/users/enterprise/${id}/status`, { status });

export const getLeaderboard = (params?: {
  scope?: LeaderboardScope;
  period?: LeaderboardPeriod;
  limit?: number;
}) => api.get("/users/leaderboard", { params });

export const getMyRank = (params?: {
  scope?: LeaderboardScope;
  period?: LeaderboardPeriod;
}) => api.get("/users/me/rank", { params });

// ===== Blog Endpoints =====
export const getBlogPosts = (params?: { search?: string; category?: string; tag?: string }) =>
  api.get("/blogs", { params });

export const getBlogPostBySlug = (slug: string) =>
  api.get(`/blogs/post/${slug}`);

export const getBlogPostById = (id: string) =>
  api.get(`/blogs/id/${id}`);

export const createBlogPost = (data: {
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  category?: string;
  tags?: string[];
}) => api.post("/blogs", data);

export const updateBlogPost = (
  id: string,
  data: {
    title?: string;
    summary?: string;
    content?: string;
    cover_image?: string;
    category?: string;
    tags?: string[];
  },
) => api.put(`/blogs/${id}`, data);

export const deleteBlogPost = (id: string) =>
  api.delete(`/blogs/${id}`);

export const toggleLikeBlogPost = (id: string) =>
  api.post(`/blogs/${id}/like`);

export const addBlogPostComment = (id: string, text: string) =>
  api.post(`/blogs/${id}/comments`, { text });

export const deleteBlogPostComment = (id: string, commentId: string) =>
  api.delete(`/blogs/${id}/comments/${commentId}`);

export default api;
