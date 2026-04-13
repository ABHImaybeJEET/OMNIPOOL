import { create } from "zustand";

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
  owner_id: string | { name: string; email: string };
  specs: Record<string, string>;
  image_url: string;
}

export interface AppUser {
  _id: string;
  firebaseUid: string;
  name: string;
  email: string;
  skills: string[];
  bio?: string;
  availability?: boolean;
}

interface AppState {
  // Auth
  user: AppUser | null;
  setUser: (user: AppState["user"]) => void;
  logout: () => void;

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

  // User skills
  userSkills: string[];
  setUserSkills: (skills: string[]) => void;
}

const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user, userSkills: user?.skills || [] }),
  logout: () => set({ user: null, userSkills: [], myHardware: [] }),

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

  // Skills
  userSkills: [],
  setUserSkills: (skills) => set({ userSkills: skills }),
}));

export default useStore;
