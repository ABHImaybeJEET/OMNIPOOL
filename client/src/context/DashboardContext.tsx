import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  parseProject,
  matchResources,
  getAdvice,
  createAiConversation,
  getAiConversations,
  getAiConversationById,
  deleteAiConversation,
} from "../api/client";

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
  skills: string[];
}

export interface AIResult {
  title: string;
  description: string;
  extrapolated_BOM: BOMItem[];
  required_skills: string[];
}

export interface ProjectAdvice {
  strategy: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Unknown";
  feasibility_score: number;
  next_steps: string[];
}

export interface AiConversationItem {
  _id: string;
  title: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardState {
  projectPrompt: string;
  setProjectPrompt: (prompt: string) => void;
  isLoading: boolean;
  hasLoaded: boolean;
  aiResult: AIResult | null;
  matchedHardware: HardwareItem[];
  matchedMentors: Mentor[];
  projectAdvice: ProjectAdvice | null;
  submitPrompt: () => Promise<void>;
  conversations: AiConversationItem[];
  currentConversationId: string | null;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
  fetchConversations: () => Promise<void>;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [projectPrompt, setProjectPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [matchedHardware, setMatchedHardware] = useState<HardwareItem[]>([]);
  const [matchedMentors, setMatchedMentors] = useState<Mentor[]>([]);
  const [projectAdvice, setProjectAdvice] = useState<ProjectAdvice | null>(
    null,
  );
  const [conversations, setConversations] = useState<AiConversationItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await getAiConversations();
      if (res.data?.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching AI conversations:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const startNewChat = () => {
    setProjectPrompt("");
    setAiResult(null);
    setMatchedHardware([]);
    setMatchedMentors([]);
    setProjectAdvice(null);
    setHasLoaded(false);
    setCurrentConversationId(null);
  };

  const loadConversation = async (id: string) => {
    setIsLoading(true);
    setHasLoaded(false);
    setAiResult(null);
    setMatchedHardware([]);
    setMatchedMentors([]);
    setProjectAdvice(null);
    setCurrentConversationId(id);

    try {
      const res = await getAiConversationById(id);
      if (res.data?.success) {
        const convo = res.data.data;
        setProjectPrompt(convo.prompt);
        setAiResult(convo.aiResult);
        setProjectAdvice(convo.projectAdvice);

        // Fetch local resources dynamic match
        if (
          convo.aiResult?.extrapolated_BOM?.length > 0 ||
          convo.aiResult?.required_skills?.length > 0
        ) {
          const matchResponse = await matchResources(
            convo.aiResult.extrapolated_BOM,
            convo.aiResult.required_skills,
          );
          setMatchedHardware(matchResponse.data.data.matched_hardware || []);
          setMatchedMentors(matchResponse.data.data.matched_mentors || []);
        }
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await deleteAiConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (currentConversationId === id) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const submitPrompt = async () => {
    if (!projectPrompt.trim()) return;

    setIsLoading(true);
    setHasLoaded(false);
    setAiResult(null);
    setMatchedHardware([]);
    setMatchedMentors([]);
    setProjectAdvice(null);

    try {
      // 1. Parse Project
      const { data } = await parseProject(projectPrompt);
      const result = data.data as AIResult;
      setAiResult(result);

      // 2. Match Resources
      let localHardware: HardwareItem[] = [];
      let localMentors: Mentor[] = [];

      if (
        result.extrapolated_BOM?.length > 0 ||
        result.required_skills?.length > 0
      ) {
        const matchResponse = await matchResources(
          result.extrapolated_BOM,
          result.required_skills,
        );
        localHardware = matchResponse.data.data.matched_hardware || [];
        localMentors = matchResponse.data.data.matched_mentors || [];

        setMatchedHardware(localHardware);
        setMatchedMentors(localMentors);
      }

      // 3. Get Project Advice (RAG Layer)
      const adviceResponse = await getAdvice(
        projectPrompt,
        localHardware,
        localMentors,
      );
      const advice = adviceResponse.data.data as ProjectAdvice;
      setProjectAdvice(advice);
      setHasLoaded(true);

      // 4. Save to Conversation History
      try {
        const convoRes = await createAiConversation({
          title: result.title || projectPrompt.substring(0, 40) + "...",
          prompt: projectPrompt,
          aiResult: result,
          projectAdvice: advice,
        });

        if (convoRes.data?.success) {
          const savedConvo = convoRes.data.data;
          setCurrentConversationId(savedConvo._id);
          setConversations((prev) => [
            {
              _id: savedConvo._id,
              title: savedConvo.title,
              prompt: savedConvo.prompt,
              createdAt: savedConvo.createdAt,
              updatedAt: savedConvo.updatedAt,
            },
            ...prev,
          ]);
        }
      } catch (convoErr) {
        console.warn("Could not save AI conversation history:", convoErr);
      }
    } catch (error) {
      console.error("Error processing project prompt:", error);
      setAiResult({
        title: "Analysis Failed",
        description:
          "We couldn't process your request. Please check your connectivity or API key.",
        extrapolated_BOM: [],
        required_skills: [],
      });
      setProjectAdvice({
        strategy:
          "Error: " + (error as any).message ||
          "Something went wrong during generation.",
        difficulty: "Unknown",
        feasibility_score: 0,
        next_steps: ["Try again in a few moments", "Check your .env settings"],
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
        projectAdvice,
        submitPrompt,
        conversations,
        currentConversationId,
        loadConversation,
        deleteConversation,
        startNewChat,
        fetchConversations,
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
