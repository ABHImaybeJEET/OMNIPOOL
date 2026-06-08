import { create } from "zustand";
import {
  getEnterpriseApplications as fetchEnterpriseApplications,
  updateEnterpriseStatus as setEnterpriseStatus,
} from "../api/client";

export type UserRole = "viewer" | "admin";
export type AccountType = "community" | "enterprise";
export type EnterpriseStatus = "none" | "pending" | "accepted" | "rejected";

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  bio?: string;
  token: string;
  avatar_url?: string;
  role?: UserRole;
  account_type?: AccountType;
  enterprise_status?: EnterpriseStatus;
  company_name?: string;
  company_website?: string;
  gst_number?: string;
  points_total?: number;
  points_monthly?: number;
  donated_items_count?: number;
  donated_units_count?: number;
}

export interface EnterpriseApplication {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  account_type: AccountType;
  enterprise_status: EnterpriseStatus;
  company_name?: string;
  company_website?: string;
  gst_number?: string;
}

export interface BOMItem {
  hardware_name: string;
  quantity: number;
  notes: string;
}

export interface HardwareMatch {
  _id: string;
  name: string;
  description: string;
  category: string;
  availability_status: string;
  owner_id: { name: string; email: string; avatar_url: string };
  score: number;
  image_url?: string;
  specs?: Record<string, string>;
}

export interface MentorMatch {
  _id: string;
  name: string;
  skills: string[];
  bio: string;
  availability: boolean;
  score: number;
  avatar_url?: string;
}

export interface ParseResult {
  title: string;
  extrapolated_BOM: BOMItem[];
  required_skills: string[];
  project_id: string | null;
}

export interface HardwareItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  availability_status: string;
  owner_id:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        avatar_url: string;
        company_name?: string;
        account_type?: string;
        role?: string;
      };
  specs: Record<string, string>;
  image_url: string;
  quantity?: number;
  owner_type?: string;
  brand?: string;
  condition?: string;
  sub_category?: string;
}

export interface HardwareRequest {
  _id: string;
  hardware_id: HardwareItem | string;
  requester_id:
    | { _id: string; name: string; email: string; avatar_url: string }
    | string;
  owner_id:
    | { _id: string; name: string; email: string; avatar_url: string }
    | string;
  quantity_requested: number;
  message: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  requester_completed?: boolean;
  owner_completed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  request_id: string;
  sender_id:
    | { _id: string; name: string; email: string; avatar_url: string }
    | string;
  receiver_id:
    | { _id: string; name: string; email: string; avatar_url: string }
    | string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation extends HardwareRequest {
  unread_count?: number;
}

type SetStateAction<T> = T | ((prev: T) => T);

interface AppState {
  // Auth
  user: AppUser | null;
  setUser: (user: AppState["user"]) => void;
  logout: () => void;

  // Enterprise admin
  enterpriseApplications: EnterpriseApplication[];
  setEnterpriseApplications: (items: EnterpriseApplication[]) => void;
  getEnterpriseApplications: (status?: EnterpriseStatus) => Promise<void>;
  updateEnterpriseStatus: (
    id: string,
    status: Extract<EnterpriseStatus, "accepted" | "rejected">,
  ) => Promise<void>;

  // AI Parse
  parseResult: ParseResult | null;
  isParsingProject: boolean;
  setParseResult: (result: ParseResult | null) => void;
  setIsParsingProject: (loading: boolean) => void;

  // Resource Matching
  matchedHardware: HardwareMatch[];
  matchedMentors: MentorMatch[];
  isMatchingResources: boolean;
  setMatchedHardware: (items: HardwareMatch[]) => void;
  setMatchedMentors: (mentors: MentorMatch[]) => void;
  setIsMatchingResources: (loading: boolean) => void;

  // Hardware Registry
  myHardware: HardwareItem[];
  setMyHardware: (items: HardwareItem[]) => void;

  // Requests
  myRequests: HardwareRequest[];
  incomingRequests: HardwareRequest[];
  setMyRequests: (items: HardwareRequest[]) => void;
  setIncomingRequests: (items: HardwareRequest[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  conversations: ChatConversation[];
  setChatMessages: (items: ChatMessage[]) => void;
  setConversations: (items: SetStateAction<ChatConversation[]>) => void;

  // User skills
  userSkills: string[];
  setUserSkills: (skills: string[]) => void;
}

const getInitialUser = () => {
  try {
    const item = localStorage.getItem("omnipool_user");
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const useStore = create<AppState>((set) => ({
  // Auth
  user: getInitialUser(),
  setUser: (user) => {
    if (user) {
      localStorage.setItem("omnipool_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("omnipool_user");
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("omnipool_user");
    set({ user: null });
  },

  // Enterprise admin
  enterpriseApplications: [],
  setEnterpriseApplications: (items) => set({ enterpriseApplications: items }),
  getEnterpriseApplications: async (status = "pending") => {
    const { data } = await fetchEnterpriseApplications(status);
    set({ enterpriseApplications: data.data || [] });
  },
  updateEnterpriseStatus: async (id, status) => {
    await setEnterpriseStatus(id, status);
    set((state) => ({
      enterpriseApplications: state.enterpriseApplications.filter(
        (app) => app._id !== id,
      ),
    }));
  },

  // AI Parse
  parseResult: null,
  isParsingProject: false,
  setParseResult: (result) => set({ parseResult: result }),
  setIsParsingProject: (loading) => set({ isParsingProject: loading }),

  // Resource Matching
  matchedHardware: [],
  matchedMentors: [],
  isMatchingResources: false,
  setMatchedHardware: (items) => set({ matchedHardware: items }),
  setMatchedMentors: (mentors) => set({ matchedMentors: mentors }),
  setIsMatchingResources: (loading) => set({ isMatchingResources: loading }),

  // Hardware
  myHardware: [],
  setMyHardware: (items) => set({ myHardware: items }),

  // Requests
  myRequests: [],
  incomingRequests: [],
  setMyRequests: (items) => set({ myRequests: items }),
  setIncomingRequests: (items) => set({ incomingRequests: items }),

  // Chat
  chatMessages: [],
  conversations: [],
  setChatMessages: (items) => set({ chatMessages: items }),
  setConversations: (items) =>
    set((state) => ({
      conversations:
        typeof items === "function" ? items(state.conversations) : items,
    })),

  // Skills
  userSkills: [],
  setUserSkills: (skills) => set({ userSkills: skills }),
}));

export default useStore;
