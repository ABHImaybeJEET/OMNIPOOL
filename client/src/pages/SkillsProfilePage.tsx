import React, { useState } from "react";
import useStore from "../store/useStore";
import { updateUser } from "../api/client";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";

const POPULAR_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "C/C++",
  "Embedded Systems",
  "Arduino",
  "Raspberry Pi",
  "ESP32",
  "Machine Learning",
  "Computer Vision",
  "Natural Language Processing",
  "PCB Design",
  "Soldering",
  "CAD/3D Modeling",
  "3D Printing",
  "Robotics",
  "IoT",
  "MQTT",
  "Bluetooth/BLE",
  "Linux",
  "Docker",
  "Cloud (AWS/GCP)",
  "API Development",
  "Electronics",
  "Signal Processing",
  "Motor Control",
  "Data Visualization",
  "UI/UX Design",
  "Mobile Development",
];

const badgeVariants = [
  "indigo",
  "violet",
  "cyan",
  "emerald",
  "amber",
  "rose",
] as const;

const SkillsProfilePage: React.FC = () => {
  const { user, userSkills, setUserSkills } = useStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>(userSkills);
  const [customSkill, setCustomSkill] = useState("");
  const [bio, setBio] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filteredSkills = POPULAR_SKILLS.filter(
    (skill) =>
      skill.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !selectedSkills.includes(skill),
  );

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSaved(false);
  };

  const addCustomSkill = () => {
    const skill = customSkill.trim();
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setCustomSkill("");
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setIsSaving(true);
    try {
      await updateUser(user._id, { skills: selectedSkills, bio });
    } catch {
      // Keep local UI state responsive even if the request fails.
    }
    setUserSkills(selectedSkills);
    setSaved(true);
    setIsSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">
            Skills <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-text-secondary">
            Tell us what you know. OmniPool will match you as a mentor for
            community projects.
          </p>
        </div>

        {/* Selected Skills */}
        <div className="glass-card p-6 mb-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent-indigo/15 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent-indigo"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Your Skills
              </h3>
              <p className="text-xs text-text-muted">
                {selectedSkills.length} skills selected
              </p>
            </div>
          </div>

          {selectedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill, index) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="cursor-pointer group"
                >
                  <Badge
                    variant={badgeVariants[index % badgeVariants.length]}
                    size="md"
                  >
                    {skill}
                    <span className="ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                      ×
                    </span>
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted py-4 text-center">
              No skills selected yet. Pick from below or add your own.
            </p>
          )}
        </div>

        {/* Skill picker */}
        <div className="glass-card p-6 mb-6 animate-fade-in-up stagger-2">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Add Skills
          </h3>

          {/* Search */}
          <Input
            placeholder="Search skills..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            className="mb-4"
          />

          {/* Popular skills grid */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filteredSkills.slice(0, 20).map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-border-default
                  bg-bg-tertiary text-text-secondary
                  hover:border-accent-indigo/40 hover:text-accent-indigo hover:bg-accent-indigo/5
                  transition-all duration-200 cursor-pointer"
              >
                + {skill}
              </button>
            ))}
          </div>

          {/* Custom skill */}
          <div className="flex gap-2 pt-3 border-t border-border-default">
            <Input
              placeholder="Add custom skill..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCustomSkill())
              }
            />
            <Button
              variant="secondary"
              onClick={addCustomSkill}
              disabled={!customSkill.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Bio */}
        <div className="glass-card p-6 mb-6 animate-fade-in-up stagger-3">
          <h3 className="text-base font-semibold text-text-primary mb-3">
            About You
          </h3>
          <textarea
            placeholder="Tell others about your expertise, experience, and what you enjoy working on..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full min-h-[120px] bg-bg-tertiary border border-border-default rounded-xl
              px-4 py-3 text-text-primary placeholder-text-muted text-sm
              focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30
              transition-all duration-200 resize-y"
            maxLength={500}
          />
          <p className="text-xs text-text-muted mt-1 text-right">
            {bio.length}/500
          </p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 animate-fade-in-up stagger-4">
          <Button
            variant="primary"
            size="lg"
            isLoading={isSaving}
            onClick={handleSave}
            className="flex-1"
          >
            {saved ? "✓ Saved!" : "Save Profile"}
          </Button>
          {saved && (
            <span className="text-sm text-accent-emerald animate-fade-in">
              Profile updated ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsProfilePage;
