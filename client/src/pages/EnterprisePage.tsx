import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import useStore from "../store/useStore";
import { applyEnterprise } from "../api/client";

const AdminDashboard = () => {
  const {
    enterpriseApplications,
    getEnterpriseApplications,
    updateEnterpriseStatus,
  } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await getEnterpriseApplications("pending");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getEnterpriseApplications]);

  const handleStatus = async (id: string, status: "accepted" | "rejected") => {
    try {
      await updateEnterpriseStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="glass-card p-8 lg:p-10 relative overflow-hidden h-full">
      <h2 className="text-2xl font-bold mb-2">Admin Control Center</h2>
      <p className="text-text-secondary text-sm mb-8">
        Review pending enterprise partnership applications.
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-accent-indigo border-t-transparent animate-spin" />
        </div>
      ) : enterpriseApplications.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          No pending enterprise applications.
        </div>
      ) : (
        <div className="space-y-4">
          {enterpriseApplications.map((app) => (
            <div
              key={app._id}
              className="bg-bg-tertiary border border-border-default/50 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
            >
              <div className="flex-1 w-full max-w-full">
                <h4 className="font-bold text-text-primary text-lg break-words">
                  {app.company_name}
                </h4>
                <div className="text-sm text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className="break-all">{app.email}</span>
                  {app.company_website && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border-default shrink-0"></span>
                      <a
                        href={app.company_website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-indigo hover:underline break-all"
                      >
                        {app.company_website}
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                <button
                  onClick={() => handleStatus(app._id, "accepted")}
                  className="flex-1 md:flex-none px-4 py-2 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 font-medium rounded-lg transition-colors text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatus(app._id, "rejected")}
                  className="flex-1 md:flex-none px-4 py-2 bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 font-medium rounded-lg transition-colors text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveEnterpriseDashboard = () => (
  <div className="glass-card p-8 lg:p-10 relative overflow-hidden flex flex-col items-center justify-center text-center py-16 h-full">
    <div className="w-20 h-20 rounded-full bg-linear-to-r from-accent-indigo to-accent-rose p-1 mb-6">
      <div className="w-full h-full bg-bg-card rounded-full flex items-center justify-center text-accent-indigo">
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    </div>
    <h2 className="text-2xl font-bold mb-3 text-text-primary">
      Enterprise Hub Active
    </h2>
    <p className="text-text-secondary max-w-md mx-auto mb-8">
      Your company has been verified. You can now post components under the
      official Enterprise tag directly into the community hardware pool.
    </p>
    <Link to="/registry">
      <button className="px-8 py-3.5 bg-text-primary text-bg-primary font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-glow-sm">
        Go to Hardware Registry
        <svg
          className="w-5 h-5"
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
      </button>
    </Link>
  </div>
);

const EnterprisePage: React.FC = () => {
  const { user, setUser } = useStore();

  const [formData, setFormData] = useState({
    companyName: "",
    email: user?.email || "",
    companyWebsite: "",
    gstNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };
  const itemVariants = {
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
    setError("");
    if (!user) {
      setError("Please sign in to apply for Enterprise.");
      return;
    }
    const currentUser = user;

    setIsSubmitting(true);
    try {
      const { data } = await applyEnterprise({
        company_name: formData.companyName,
        company_website: formData.companyWebsite,
        gst_number: formData.gstNumber,
      });
      setUser({
        ...currentUser,
        enterprise_status: data.data.enterprise_status,
        company_name: data.data.company_name,
        company_website: data.data.company_website,
        gst_number: data.data.gst_number,
      });
    } catch (error) {
      console.error(error);
      setError(
        "Failed to submit application. Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 flex flex-col items-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[20%] w-96 h-96 bg-accent-amber/10 rounded-full blur-[100px] animate-float" />
        <div
          className="absolute bottom-[20%] left-[10%] w-125 h-125 bg-accent-rose/10 rounded-full blur-[120px] animate-float"
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
        <motion.div
          variants={itemVariants as any}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
            Enterprise Partnership
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl mx-auto">
            Turn Dead Inventory into <br />
            <span className="bg-linear-to-r from-accent-amber via-accent-rose to-accent-indigo text-transparent bg-clip-text">
              Community Innovation
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            OmniPool equips electronic manufacturers and distributors with a
            seamless platform to donate or list surplus stock, fueling
            grassroots engineering while hitting corporate ESG targets.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
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
                variants={itemVariants as any}
                className="glass border border-border-default rounded-2xl p-6 flex gap-5 hover:bg-bg-glass transition-colors h-auto min-h-[9rem]"
              >
                <div
                  className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl ${benefit.color}`}
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
          </motion.div>

          {/* Right Column: View Routers */}
          <motion.div variants={itemVariants as any} className="h-full">
            {user?.role === "admin" ? (
              <AdminDashboard />
            ) : user?.enterprise_status === "accepted" ? (
              <ActiveEnterpriseDashboard />
            ) : (
              <div className="glass-card p-8 lg:p-10 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-rose/10 blur-[80px] -z-10 rounded-full" />

                <h2 className="text-2xl font-bold mb-2">
                  Apply for Partnership
                </h2>
                <p className="text-text-secondary text-sm mb-8">
                  Set up direct API integrations or manual bulk CSV drops.
                </p>

                <AnimatePresence mode="wait">
                  {user?.enterprise_status === "pending" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-full bg-accent-amber/20 flex items-center justify-center text-accent-amber mb-4">
                        <svg
                          className="w-8 h-8 animate-pulse"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">
                        Application Pending
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Our authorization team is currently reviewing your
                        application. Please check back within 24 hours.
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
                      {error ? (
                        <div className="rounded-xl border border-accent-rose/20 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
                          {error}
                        </div>
                      ) : null}

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
                          className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-amber transition-all"
                          placeholder="e.g. Acme Electronics"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          Company Website
                        </label>
                        <input
                          type="url"
                          name="companyWebsite"
                          value={formData.companyWebsite}
                          onChange={handleInputChange}
                          className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-amber transition-all disabled:opacity-50"
                          placeholder="https://company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          GST / Tax Number
                        </label>
                        <input
                          type="text"
                          name="gstNumber"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-accent-amber transition-all"
                          placeholder="GST number (optional)"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !user}
                        className="w-full bg-linear-to-r from-accent-amber to-accent-rose text-white font-bold py-3.5 rounded-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : !user ? (
                          <span>Must Sign In to Apply</span>
                        ) : (
                          <>
                            <span>Submit Application</span>
                          </>
                        )}
                      </button>
                      {!user && (
                        <p className="text-center text-accent-amber text-xs mt-2">
                          You must{" "}
                          <Link to="/signin" className="underline">
                            sign in
                          </Link>{" "}
                          first.
                        </p>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnterprisePage;
