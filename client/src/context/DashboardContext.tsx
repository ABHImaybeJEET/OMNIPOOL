import { createContext, useContext, useState } from "react";
import type { FC, ReactNode } from "react";
import { parseProject, matchResources } from "../api/client";

export interface BOMItem {
  hardware_name: string;
  quantity: number;
  notes?: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: string;
  status: string;
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
}

export interface AIResult {
  title: string;
  description: string;
  extrapolated_BOM: BOMItem[];
  required_skills: string[];
}

interface DashboardState {
  projectPrompt: string;
  setProjectPrompt: (prompt: string) => void;
  isLoading: boolean;
  hasLoaded: boolean;
  aiResult: AIResult | null;
  matchedHardware: HardwareItem[];
  matchedMentors: Mentor[];
  submitPrompt: () => Promise<void>;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export const DashboardProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projectPrompt, setProjectPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [matchedHardware, setMatchedHardware] = useState<HardwareItem[]>([]);
  const [matchedMentors, setMatchedMentors] = useState<Mentor[]>([]);

  const submitPrompt = async () => {
    if (!projectPrompt.trim()) return;

    setIsLoading(true);
    setHasLoaded(false);
    setAiResult(null);
    setMatchedHardware([]);
    setMatchedMentors([]);

    try {
      // 1. Parse Project
      const { data } = await parseProject(projectPrompt);
      const result = data.data as AIResult;
      setAiResult(result);

      // 2. Match Resources
      if (
        result.extrapolated_BOM?.length > 0 ||
        result.required_skills?.length > 0
      ) {
        const matchResponse = await matchResources(
          result.extrapolated_BOM,
          result.required_skills,
        );
        setMatchedHardware(matchResponse.data.data.matched_hardware || []);
        setMatchedMentors(matchResponse.data.data.matched_mentors || []);
      }
      setHasLoaded(true);
    } catch (error) {
      console.error("Error processing project prompt:", error);
      // Fallback/Mock for UI display if backend fails during development
      setAiResult({
        title: "Mocked AI Response",
        description: "Your backend failed to respond. Simulated result loaded.",
        extrapolated_BOM: [
          { hardware_name: "Raspberry Pi", quantity: 1, notes: "Mock data" },
        ],
        required_skills: ["Python", "Mocking"],
      });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        projectPrompt,
        setProjectPrompt,
        isLoading,
        hasLoaded,
        aiResult,
        matchedHardware,
        matchedMentors,
        submitPrompt,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider",
    );
  }
  return context;
};
