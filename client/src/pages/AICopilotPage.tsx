import React, { useState } from "react";
import {
  DashboardProvider,
  useDashboardContext,
} from "../context/DashboardContext";
import {
  Sparkles,
  Cpu,
  Code2,
  Users,
  Search,
  Loader2,
  MessageSquare,
  Trash2,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- SKELETON LOADER ---
const BentoSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-bg-tertiary rounded-md w-1/3 mb-6" />
    <div className="space-y-3">
      <div className="h-10 bg-bg-secondary rounded-lg w-full" />
      <div className="h-10 bg-bg-secondary rounded-lg w-full" />
      <div className="h-10 bg-bg-secondary rounded-lg w-3/4" />
    </div>
  </div>
);

// --- SIDEBAR HISTORY PANEL ---
const SidebarPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { conversations, currentConversationId, loadConversation, deleteConversation, startNewChat } = useDashboardContext();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed left-0 w-72 bg-bg-secondary border-r border-border-default/80 flex flex-col transition-transform duration-300 shrink-0 ${
          isOpen 
            ? "translate-x-0 z-50 top-0 bottom-0 h-screen" 
            : "-translate-x-full z-30 top-16 bottom-0 h-[calc(100vh-64px)] md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border-default/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-indigo shrink-0" />
            <h2 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">Project History</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted md:hidden cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              startNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-border-default hover:border-accent-indigo bg-white hover:bg-bg-secondary text-text-primary text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-accent-indigo" />
            New Project
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-text-muted/40 mx-auto mb-2" />
              <p className="text-xs text-text-muted">No recent projects. Start a new one to see history here.</p>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = currentConversationId === convo._id;
              return (
                <div
                  key={convo._id}
                  className={`group relative flex items-center justify-between rounded-xl p-3 text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#E8E2EC] border-l-4 border-accent-indigo text-text-primary font-bold shadow-xs"
                      : "hover:bg-bg-tertiary/75 text-text-secondary"
                  }`}
                  onClick={() => {
                    loadConversation(convo._id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-6">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? "text-accent-indigo" : "text-text-muted"}`} />
                    <span className="truncate pr-1 text-xs sm:text-sm">{convo.title}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(convo._id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-bg-tertiary hover:text-accent-rose text-text-muted transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

// --- MAIN DASHBOARD CONTENT ---
const DashboardContent = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => {
  const {
    projectPrompt,
    setProjectPrompt,
    isLoading,
    hasLoaded,
    aiResult,
    matchedHardware,
    matchedMentors,
    projectAdvice,
    submitPrompt,
  } = useDashboardContext();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      submitPrompt();
    }
  };

  return (
    <main className="flex-1 bg-bg-primary bg-grid-texture p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Center AI Input */}
        <div className="relative max-w-2xl mx-auto mb-10 px-2 sm:px-4">
          <div className="flex flex-col gap-2">
            
            {/* Mobile Sidebar Toggle Button */}
            <div className="flex justify-between items-center md:hidden mb-4 border-b border-border-default/45 pb-3">
              <button
                onClick={onOpenSidebar}
                className="py-2 px-3.5 rounded-xl border border-border-default bg-white text-text-primary flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer hover:bg-bg-secondary transition-all"
              >
                <Menu className="w-4 h-4 text-accent-indigo" />
                History
              </button>
              <div className="text-xs font-black tracking-wider uppercase text-accent-indigo flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Copilot
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary text-center tracking-tight mb-2">
              Build your next <span className="gradient-text">masterpiece</span>.
            </h1>
            <p className="text-sm sm:text-base text-text-muted text-center max-w-lg mx-auto mb-6">
              Describe your hardware project, and OMNIPOOL will find the pieces.
            </p>
 
            <div className="relative group">
              <div className="absolute inset-0 bg-accent-indigo/10 blur-2xl group-focus-within:bg-accent-indigo/20 transition-all rounded-[2rem]" />
              <div className="relative flex items-center bg-white border border-border-default/80 hover:border-accent-indigo/40 focus-within:border-accent-indigo p-1.5 rounded-[2rem] shadow-xl hover:shadow-glow-sm transition-all duration-300">
                <Search className="w-5 h-5 text-text-muted ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. A weather station with OLED..."
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 outline-none text-text-primary text-sm sm:text-base placeholder-text-muted/60"
                  value={projectPrompt}
                  onChange={(e) => setProjectPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={submitPrompt}
                  disabled={isLoading}
                  className="bg-accent-indigo text-white p-2.5 sm:px-5 sm:py-2.5 rounded-full font-bold hover:bg-accent-indigo-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm hover:shadow"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-sm">Generate</span>
                </button>
              </div>
              <div className="flex flex-wrap justify-center mt-5 gap-2.5 text-[10px] sm:text-[11px] text-text-muted uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1.5 bg-bg-secondary/50 border border-border-default/60 px-3.5 py-1.5 rounded-full shadow-sm hover:border-accent-indigo/35 hover:text-accent-indigo transition-all">
                  <Cpu className="w-3.5 h-3.5 text-accent-indigo" /> Hardware RAG
                </span>
                <span className="flex items-center gap-1.5 bg-bg-secondary/50 border border-border-default/60 px-3.5 py-1.5 rounded-full shadow-sm hover:border-accent-indigo/35 hover:text-accent-indigo transition-all">
                  <Users className="w-3.5 h-3.5 text-accent-cyan" /> Mentor Match
                </span>
                <span className="flex items-center gap-1.5 bg-bg-secondary/50 border border-border-default/60 px-3.5 py-1.5 rounded-full shadow-sm hover:border-accent-indigo/35 hover:text-accent-indigo transition-all">
                  <Code2 className="w-3.5 h-3.5 text-accent-emerald" /> Skill Analysis
                </span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Bento Grid layout */}
        {(isLoading || hasLoaded) && (
          <div className="space-y-6">
            {/* RAG GROUNDED ADVICE - FULL WIDTH */}
            <AnimatePresence>
              {(projectAdvice || isLoading) && (
                <motion.article
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-accent-indigo/90 to-accent-violet/90 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/20"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles className="w-32 h-32 rotate-12" />
                  </div>
 
                  <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" /> Project AI Advisor
                      </div>
                      <h3 className="text-2xl font-bold mb-4">
                        {aiResult?.title || "Personalized Strategy"}
                      </h3>
                      {isLoading ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-white/20 rounded w-full animate-pulse" />
                          <div className="h-4 bg-white/20 rounded w-4/5 animate-pulse" />
                          <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
                        </div>
                      ) : (
                        <p className="text-white/90 leading-relaxed max-w-2xl text-sm sm:text-base">
                          {projectAdvice?.strategy}
                        </p>
                      )}
                    </div>
 
                    <div className="flex flex-col sm:flex-row md:flex-col gap-4 min-w-[200px]">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                        <p className="text-white/60 text-xs uppercase font-bold mb-1">
                          Feasibility
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${projectAdvice?.feasibility_score || 0}%`,
                              }}
                              className="h-full bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                          </div>
                          <span className="text-sm font-bold">
                            {projectAdvice?.feasibility_score}%
                          </span>
                        </div>
                      </div>
 
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                        <p className="text-white/60 text-xs uppercase font-bold mb-1">
                          Difficulty
                        </p>
                        <span className="text-lg font-bold">
                          {projectAdvice?.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {!isLoading && projectAdvice?.next_steps && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {projectAdvice.next_steps.map((step, i) => (
                        <div
                          key={i}
                          className="bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl border border-white/10 flex gap-3 items-center"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-xs sm:text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.article>
              )}
            </AnimatePresence>
 
            <section
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              aria-live="polite"
              aria-atomic="true"
              aria-busy={isLoading}
            >
              <AnimatePresence mode="popLayout">
                {/* 1. Bill of Materials */}
                <motion.article
                  key="bom-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-[1.5rem] relative overflow-hidden focus-within:ring-2 focus-within:ring-accent-indigo"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-accent-indigo/10 rounded-xl text-accent-indigo">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Bill of Materials
                    </h3>
                  </div>
                  {isLoading ? (
                    <BentoSkeleton />
                  ) : (
                    <ul className="space-y-3">
                      {aiResult?.extrapolated_BOM?.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center bg-bg-secondary/60 p-3.5 rounded-xl border border-border-default/50"
                        >
                          <span className="text-sm font-medium text-text-primary">
                            {item.hardware_name}
                          </span>
                          <span className="text-xs font-mono font-bold bg-accent-indigo/10 text-accent-indigo px-2.5 py-1 rounded-lg">
                            x{item.quantity}
                          </span>
                        </li>
                      ))}
                      {!aiResult?.extrapolated_BOM?.length && (
                        <p className="text-text-muted text-sm">
                          No hardware detected.
                        </p>
                      )}
                    </ul>
                  )}
                </motion.article>
 
                {/* 2. Required Technical Skills */}
                <motion.article
                  key="skills-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6 rounded-[1.5rem] relative overflow-hidden focus-within:ring-2 focus-within:ring-accent-cyan"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-accent-cyan/10 rounded-xl text-accent-cyan">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Required Skills
                    </h3>
                  </div>
                  {isLoading ? (
                    <BentoSkeleton />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {aiResult?.required_skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium bg-bg-secondary border border-border-default text-text-secondary px-3 py-1.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {!aiResult?.required_skills?.length && (
                        <p className="text-text-muted text-sm">
                          No specific skills parsed.
                        </p>
                      )}
                    </div>
                  )}
                </motion.article>
 
                {/* 3. Matched Local Hardware */}
                <motion.article
                  key="hardware-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6 rounded-[1.5rem] relative overflow-hidden focus-within:ring-2 focus-within:ring-accent-emerald"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-accent-emerald/10 rounded-xl text-accent-emerald">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Local Hardware Matches
                    </h3>
                  </div>
                  {isLoading ? (
                    <BentoSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matchedHardware?.length > 0 ? (
                        matchedHardware.map((hw, idx) => (
                          <div
                            key={idx}
                            className="bg-bg-secondary/60 p-3.5 rounded-xl border border-border-default/50 flex flex-col"
                          >
                            <span className="text-sm font-medium text-text-primary truncate">
                              {hw.name}
                            </span>
                            <span className="text-xs text-accent-emerald mt-1 font-semibold">
                              {hw.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-text-muted text-sm col-span-2">
                          No local community hardware available for these parts
                          yet.
                        </p>
                      )}
                    </div>
                  )}
                </motion.article>
 
                {/* 4. Matched Mentors */}
                <motion.article
                  key="mentors-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6 rounded-[1.5rem] relative overflow-hidden focus-within:ring-2 focus-within:ring-accent-rose"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-accent-rose/10 rounded-xl text-accent-rose">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">
                      Expert Mentors
                    </h3>
                  </div>
                  {isLoading ? (
                    <BentoSkeleton />
                  ) : (
                    <ul className="space-y-3">
                      {matchedMentors?.length > 0 ? (
                        matchedMentors.map((mentor, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-3 bg-bg-secondary/60 p-3.5 rounded-xl border border-border-default/50"
                          >
                            <div className="w-9 h-9 rounded-full bg-accent-indigo/10 flex items-center justify-center text-xs font-bold text-accent-indigo shrink-0 font-mono">
                              {mentor.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-text-primary truncate">
                                {mentor.name}
                              </span>
                              <span className="text-xs text-text-muted truncate">
                                {mentor.skills?.slice(0, 2).join(", ")}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <p className="text-text-muted text-sm">
                          No matched mentors nearby.
                        </p>
                      )}
                    </ul>
                  )}
                </motion.article>
              </AnimatePresence>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

// --- ROOT PAGE COMPONENT ---
const AICopilotPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <DashboardProvider>
      <div className="flex min-h-[calc(100vh-64px)] bg-bg-primary font-sans overflow-hidden md:pl-72">
        <SidebarPanel isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <DashboardContent onOpenSidebar={() => setIsSidebarOpen(true)} />
      </div>
    </DashboardProvider>
  );
};

export default AICopilotPage;
