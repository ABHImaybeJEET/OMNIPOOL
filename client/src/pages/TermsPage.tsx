import React from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Users, ShieldAlert, Cpu, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-bg-primary pt-10 pb-20 overflow-hidden">
      {/* Background ambient blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent-indigo/5 rounded-full blur-3xl pointer-events-none" />

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
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-text-primary mb-4">
            Terms of Service
          </h1>
          <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
            Please read these terms carefully before sharing hardware or joining our mentorship program.
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
              <Users className="w-5 h-5 text-accent-indigo" />
              1. Platform Membership & Accounts
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              OmniPool is a peer-to-peer ecosystem for engineering collaboration. By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>Provide accurate, current, and complete information during signup.</li>
              <li>Maintain the security of your password and assume responsibility for all activities under your account credentials.</li>
              <li>Only register if you are at least 18 years of age or possess legal guardian consent to interact on technical platforms.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Cpu className="w-5 h-5 text-accent-indigo" />
              2. Hardware Registry & Lending Rules
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              When listing equipment, sensors, microcontrollers, or development boards in the registry, you verify that:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>You hold full ownership rights or explicit usage permission for the physical items you offer.</li>
              <li>All listings are accurately described, representing the correct specifications and physical conditions of the gear.</li>
              <li>Lenders and renters determine coordination arrangements (shipping, drop-offs, deposits) independently. OmniPool provides the connection interface but is not a party to physical transactions.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <AlertTriangle className="w-5 h-5 text-accent-rose" />
              3. Disclaimer of Physical Damages & Liability
            </h2>
            <div className="p-4 bg-accent-rose/5 border border-accent-rose/10 rounded-2xl text-accent-rose/90 text-sm leading-relaxed flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>IMPORTANT:</strong> OmniPool acts solely as a discovery index for sharing and matching. We do not inspect physical hardware, verify engineering certifications, or insure transactions. Lenders and borrowers use the platform at their own risk. OmniPool is not liable for device breakage, hardware failure, firmware damage, electrical shock, or any losses resulting from sharing physical parts.
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Users className="w-5 h-5 text-accent-indigo" />
              4. Code of Conduct & Mentorship
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              To keep our collaborative sandbox friendly and productive, users agree not to:
            </p>
            <ul className="list-disc pl-5 text-text-secondary text-sm space-y-2 leading-relaxed">
              <li>Post false listings, spam projects, or spread misleading technical information.</li>
              <li>Harass, intimidate, or discriminate against other makers, students, or professional mentors.</li>
              <li>Use shared components or platform copilot resources for military applications, illegal modifications, or unsafe engineering setups.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 border-b border-border-default/45 pb-3">
              <Scale className="w-5 h-5 text-accent-indigo" />
              5. Modification of Services
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              We reserve the right to suspend accounts, hide false hardware listings, or update features at our discretion to maintain the platform's core safety and integrity.
            </p>
          </section>

          <div className="border-t border-border-default/45 pt-6 text-center text-xs text-text-muted leading-relaxed">
            Please direct any queries regarding usage, policy infringements, or system guidelines to <a href="mailto:omnipoolofficial@gmail.com" className="text-accent-indigo hover:underline">omnipoolofficial@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
