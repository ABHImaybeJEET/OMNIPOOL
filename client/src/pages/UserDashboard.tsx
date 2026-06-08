import React, { useState, useEffect } from "react";
import useStore from "../store/useStore";
import type { AppUser } from "../store/useStore";
import { updateUser } from "../api/client";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import {
  Component,
  Settings,
  Sparkles,
  Search
} from "lucide-react";



const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'C/C++', 'Embedded Systems', 'Arduino', 'Raspberry Pi', 'ESP32',
  'Machine Learning', 'Computer Vision', 'Natural Language Processing',
  'PCB Design', 'Soldering', 'CAD/3D Modeling', '3D Printing',
  'Robotics', 'IoT', 'MQTT', 'Bluetooth/BLE',
  'Linux', 'Docker', 'Cloud (AWS/GCP)', 'API Development',
  'Electronics', 'Signal Processing', 'Motor Control',
  'Data Visualization', 'UI/UX Design', 'Mobile Development',
];

const badgeVariants = ['indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose'] as const;

// --- MAIN DASHBOARD CONTENT ---
const DashboardContent = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const { userSkills, setUserSkills } = useStore();
  const [selectedSkills, setSelectedSkills] = useState<string[]>(userSkills);
  const [customSkill, setCustomSkill] = useState('');
  const [bio, setBio] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Initialize skills and bio from user data
  useEffect(() => {
    if (user?.skills && user.skills.length > 0) {
      setSelectedSkills(user.skills);
      setUserSkills(user.skills);
    }
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user?._id]); // Re-initialize when user changes

  const filteredSkills = POPULAR_SKILLS.filter(
    (skill) =>
      skill.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !selectedSkills.includes(skill)
  );

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSaved(false);
    setError('');
  };

  const addCustomSkill = () => {
    const skill = customSkill.trim();
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setCustomSkill('');
      setSaved(false);
      setError('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = await updateUser('self', { skills: selectedSkills, bio });
      if (response.data?.success && user) {
        // Update the store with new user data
        const updatedUser: AppUser = { ...user, skills: selectedSkills, bio };
        setUser(updatedUser);
        setUserSkills(selectedSkills);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to save changes';
      setError(errorMsg);
      console.error('Error saving user data:', err);
    }
    setIsSaving(false);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-bg-primary pt-10 pb-20 relative">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none" />

      {/* Header Banner */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mb-12 md:mb-16 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-accent-indigo/20 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-2">
              Welcome back, {user?.name?.split(' ')[0] || "User"}
            </h1>
            <p className="text-text-secondary text-base sm:text-lg">
              Manage your personal settings, skills, and platform preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 space-y-16">
        
        {/* Section: Account Profile */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-indigo" />
              Account Details
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Your core personal information and account standing.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 shadow-sm hover:border-accent-indigo/30 transition-colors">
              <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-1">Name</p>
              <p className="text-text-primary text-base font-semibold">{user?.name || "Unknown"}</p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 shadow-sm hover:border-accent-indigo/30 transition-colors">
              <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-1">Email Base</p>
              <p className="text-text-primary text-base font-semibold truncate">{user?.email || "Unknown"}</p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 shadow-sm hover:border-accent-indigo/30 transition-colors flex flex-col justify-between">
              <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-1">Account Tier</p>
              <p className="text-text-primary text-base font-semibold capitalize flex items-center gap-2">
                {user?.account_type || "community"}
                {user?.account_type === "enterprise" && <Sparkles className="w-4 h-4 text-accent-emerald" />}
              </p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 shadow-sm transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent-indigo/10 to-transparent rounded-full -mr-12 -mt-12" />
              <p className="text-xs uppercase tracking-widest text-text-muted font-bold mb-1 relative z-10">Enterprise Status</p>
              <p className={`text-base font-semibold capitalize relative z-10 ${user?.enterprise_status === "accepted" ? "text-accent-emerald" : "text-text-primary"}`}>
                {user?.enterprise_status || "Standard"}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-border-default" />

        {/* Section: Expertise */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Component className="w-5 h-5 text-accent-indigo" />
              Expertise & Skills
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Add specific hardware and software skills to get matched accurately with people who need your help.
            </p>
          </div>
          
          <div className="md:col-span-8 bg-bg-secondary border border-border-default rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex justify-between items-center">
              Active Skills
              <span className="text-xs font-medium bg-bg-tertiary px-2.5 py-1 rounded-full text-text-secondary">{selectedSkills.length} selected</span>
            </h3>
            
            <div className="mb-8 min-h-[60px]">
              {selectedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill, index) => (
                    <button key={skill} onClick={() => toggleSkill(skill)} className="cursor-pointer group">
                      <Badge variant={badgeVariants[index % badgeVariants.length]} size="md">
                        {skill}
                        <span className="ml-1.5 opacity-40 group-hover:opacity-100 transition-opacity">×</span>
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-border-default rounded-xl bg-bg-primary/50 text-sm text-text-muted py-6">
                  No skills selected yet. Add some below!
                </div>
              )}
            </div>

            <div className="border-t border-border-default pt-6">
              <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-4">Discover Skills</h4>
              <Input
                placeholder="Search catalog..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="mb-4 bg-bg-primary"
                icon={<Search className="w-4 h-4 text-text-muted" />}
              />

              <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto">
                {filteredSkills.slice(0, 15).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border-default bg-bg-primary text-text-secondary hover:border-accent-indigo/40 hover:text-accent-indigo hover:bg-accent-indigo/5 transition-all duration-200 cursor-pointer"
                  >
                    + {skill}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-4 pt-6 border-t border-border-default">
                <Input
                  className="bg-bg-primary"
                  placeholder="Type custom skill & press enter..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                />
                <Button variant="secondary" onClick={addCustomSkill} disabled={!customSkill.trim()}>Add</Button>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-border-default" />

        {/* Section: Biography */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-indigo" />
              Public Biography
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Tell the community about your past projects, specializations, and what drives you.
            </p>
          </div>
          <div className="md:col-span-8 bg-bg-secondary border border-border-default rounded-3xl p-6 md:p-8 shadow-sm">
            <textarea
              placeholder="I'm a hardware engineer currently working on open source robotics..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[140px] bg-bg-primary border border-border-default rounded-xl px-5 py-4 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20 transition-all duration-200 resize-y"
              maxLength={500}
            />
            <div className="flex justify-end mt-2">
              <span className="text-xs font-medium text-text-muted">{bio.length} / 500 characters</span>
            </div>
          </div>
        </section>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-6 pt-8 pb-10">
          {error && <span className="text-sm font-semibold text-accent-rose">
            {error}
          </span>}
          {saved && <span className="text-sm font-semibold text-accent-emerald animate-pulse flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Successfully Updated!
          </span>}
          <Button variant="primary" size="lg" isLoading={isSaving} onClick={handleSave} className="min-w-48 shadow-lg shadow-accent-indigo/20">
            Save Modifications
          </Button>
        </div>

      </div>
    </main>
  );
};

const UserDashboard: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary font-sans pt-16">
      <DashboardContent />
    </div>
  );
};

export default UserDashboard;
