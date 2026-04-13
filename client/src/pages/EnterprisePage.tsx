import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const EnterprisePage: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    inventoryType: "Semiconductors",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO (Backend): Replace this timeout with actual API call to save enterprise application
    // Example: await axios.post('/api/enterprise/apply', formData);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after a few seconds
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        companyName: "",
        email: "",
        inventoryType: "Semiconductors",
        message: "",
      });
    }, 4000);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 flex flex-col items-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[20%] w-96 h-96 bg-accent-amber/10 rounded-full blur-[100px] animate-float" />
        <div
          className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-accent-rose/10 rounded-full blur-[120px] animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <motion.div
        className="max-w-6xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
            Enterprise Partnership
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl mx-auto">
            Turn Dead Inventory into <br />
            <span className="bg-gradient-to-r from-accent-amber via-accent-rose to-accent-indigo text-transparent bg-clip-text">
              Community Innovation
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            OmniPool equips electronic manufacturers and distributors with a
            seamless platform to donate or list surplus stock, fueling
            grassroots engineering while hitting corporate ESG targets.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Benefits & Stats */}
          <motion.div variants={containerVariants} className="space-y-6">
            {[
              {
                title: "Tax-Deductible Donations",
                description:
                  "Automated documentation for hardware transfers to academic organizations for immediate tax write-offs.",
                icon: "👔",
                color: "bg-accent-amber/10 text-accent-amber",
              },
              {
                title: "Hit Sustainability Targets",
                description:
                  "Drastically reduce electronic waste by routing functional passive and active components to actual developers.",
                icon: "♻️",
                color: "bg-accent-emerald/10 text-accent-emerald",
              },
              {
                title: "Brand Penetration",
                description:
                  "Build severe goodwill among rising engineers by putting your proprietary components directly in their hands.",
                icon: "🚀",
                color: "bg-accent-indigo/10 text-accent-indigo",
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="glass border border-border-default rounded-2xl p-6 flex gap-5 hover:bg-bg-glass transition-colors"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${benefit.color}`}
                >
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={itemVariants}
              className="mt-8 p-6 glass border border-accent-amber/20 rounded-2xl bg-gradient-to-br from-accent-amber/5 to-transparent"
            >
              <div className="text-3xl font-black text-accent-amber mb-2">
                50,000+
              </div>
              <div className="text-sm text-text-primary font-medium">
                Components redistributed last quarter across 14 enterprise
                partners.
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Workable Application Form */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-8 lg:p-10 relative overflow-hidden"
          >
            {/* Subtle glow behind form */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-rose/10 blur-[80px] -z-10 rounded-full" />

            <h2 className="text-2xl font-bold mb-2">Apply for Partnership</h2>
            <p className="text-text-secondary text-sm mb-8">
              Set up direct API integrations or manual bulk CSV drops.
            </p>

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-accent-emerald/20 flex items-center justify-center text-accent-emerald mb-4">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Application Received!
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Our enterprise onboarding team will contact you within 24
                    hours.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber transition-all"
                      placeholder="e.g. Acme Electronics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber transition-all"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Primary Inventory Type
                    </label>
                    <select
                      name="inventoryType"
                      value={formData.inventoryType}
                      onChange={handleInputChange}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber transition-all appearance-none"
                    >
                      <option>Passive Components (Resistors, Caps)</option>
                      <option>Active Components (ICs, MCU)</option>
                      <option>Sensors & Actuators</option>
                      <option>Development Boards</option>
                      <option>Mixed / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      How much excess volume? (Optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber transition-all resize-none h-24"
                      placeholder="Briefly describe what you're looking to share..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-accent-amber to-accent-rose text-white font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10">
                          Submit Application
                        </span>
                        <svg
                          className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnterprisePage;
