import React from "react";
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

// --- MAIN DASHBOARD CONTENT ---
const DashboardContent = () => {
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
        <div className="relative max-w-2xl mx-auto mb-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-text-primary text-center mb-2">
              Build your next masterpiece.
            </h1>
            <p className="text-text-muted text-center mb-6">
              Describe your hardware project, and OMNIPOOL will find the pieces.
            </p>

            <div className="relative group">
              <div className="absolute inset-0 bg-accent-indigo/10 blur-2xl group-focus-within:bg-accent-indigo/20 transition-all rounded-[2rem]" />
              <div className="relative flex items-center bg-white border-2 border-border-default hover:border-accent-indigo/30 focus-within:border-accent-indigo p-2 rounded-[2rem] shadow-xl transition-all">
                <Search className="w-6 h-6 text-text-muted ml-4" />
                <input
                  type="text"
                  placeholder="e.g. A weather station with OLED and ESP32..."
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-text-primary"
                  value={projectPrompt}
                  onChange={(e) => setProjectPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={submitPrompt}
                  disabled={isLoading}
                  className="bg-accent-indigo text-white px-6 py-3 rounded-full font-bold hover:bg-accent-indigo-dark transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Generate
                </button>
              </div>
              <div className="flex justify-center mt-4 gap-6 text-[11px] text-text-muted uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" /> Hardware RAG
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Mentor Match
                </span>
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3 h-3" /> Skill Analysis
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
                        <p className="text-white/90 leading-relaxed max-w-2xl">
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
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm">{step}</span>
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
                            <span className="text-xs text-accent-emerald mt-1">
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
                            <div className="w-9 h-9 rounded-full bg-accent-indigo/10 flex items-center justify-center text-xs font-bold text-accent-indigo">
                              {mentor.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-text-primary">
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
  return (
    <DashboardProvider>
      <div className="flex min-h-[calc(100vh-64px)] bg-bg-primary font-sans">
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
};

export default AICopilotPage;
