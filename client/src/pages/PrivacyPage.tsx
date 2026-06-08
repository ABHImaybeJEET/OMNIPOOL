import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, RefreshCw, FileText, ArrowLeft } from "lucide-react";

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-bg-primary pt-10 pb-20 overflow-hidden">
      {/* Background ambient blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-indigo/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 animate-fade-in-up">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-accent-indigo transition-all duration-200 mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-accent-indigo/10 rounded-2xl text-accent-indigo mb-4 border border-accent-indigo/20 shadow-sm animate-pulse-glow">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-text-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
            Your trust is our priority. Learn how OmniPool handles and protects your data.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-text-muted">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Last Updated: June 8, 2026</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="glass-card p-6 sm:p-10 md:p-12 rounded-3xl border border-border-default/60 shadow-lg space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Eye className="w-5 h-5 text-accent-indigo" />
              1. Information We Collect
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We collect information to provide a better, safer hardware-sharing and mentorship environment. This includes:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>
                <strong>Profile & Account Details:</strong> Name, email address, bio, profile image, and account credentials.
              </li>
              <li>
                <strong>Hardware Inventory Data:</strong> Details of the engineering hardware, components, and tools you list in the registry.
              </li>
              <li>
                <strong>Communication Content:</strong> Messages, files, and queries exchanged with peer engineers or mentors through our platform.
              </li>
              <li>
                <strong>Usage Metrics:</strong> Browser details, IP addresses, page interactions, and system settings to improve system performance.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Lock className="w-5 h-5 text-accent-indigo" />
              2. How We Protect Your Data
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We implement state-of-the-art security measures to shield your data from unauthorized access, modification, or deletion:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>
                All network traffic and data transfer is encrypted using advanced Transport Layer Security (TLS/HTTPS).
              </li>
              <li>
                Sensitive database properties, session tokens, and keys are heavily hashed or encrypted at rest.
              </li>
              <li>
                Access privileges to user records are tightly restricted to authorized service operations under OAuth authentication layers.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <FileText className="w-5 h-5 text-accent-indigo" />
              3. Data Sharing & Third Parties
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              OmniPool does not sell or rent your personal information to third parties. We share details only in the following contexts:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>
                <strong>Community Interactions:</strong> The hardware listings and public biography you supply are visible to registered users to coordinate rentals and mentoring.
              </li>
              <li>
                <strong>Service Partners:</strong> We coordinate with cloud database hosting and auth management systems (like MongoDB and Firebase) to run base platform pipelines securely.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We will release data when legally required by law enforcement under compliance requirements.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Shield className="w-5 h-5 text-accent-indigo" />
              4. Your Choices & Data Rights
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              You retain full control over your private records on our platform:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>
                You can review, modify, or delete your listed inventory and profile bio directly from your Dashboard at any time.
              </li>
              <li>
                To request a complete removal of your profile and data records, please submit a deletion ticket via settings.
              </li>
            </ul>
          </section>

          <div className="border-t border-border-default/45 pt-6 text-center text-xs text-text-muted leading-relaxed">
            If you have any questions or concerns regarding this Privacy Policy, feel free to open a ticket or contact us at <a href="mailto:omnipoolofficial@gmail.com" className="text-accent-indigo hover:underline">omnipoolofficial@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
