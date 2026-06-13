import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import emailjs from "@emailjs/browser";
import { auth, googleProvider } from "../config/firebase";
import useStore from "../store/useStore";
import { registerUser, googleLoginUser, checkEmail } from "../api/client";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP State variables
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [devModeOtp, setDevModeOtp] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Generate and send OTP via EmailJS
  const sendOtp = async (targetEmail: string, targetName: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpError("");

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn(
        "EmailJS environment variables (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY) are not configured. Falling back to console logging OTP for testing."
      );
      setDevModeOtp(otp);
      setTimer(60);
      setIsOtpSent(true);
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_name: targetName,
          to_email: targetEmail,
          otp_code: otp,
        },
        {
          publicKey: publicKey,
        }
      );
      setDevModeOtp(null);
      setTimer(60);
      setIsOtpSent(true);
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      setError("Failed to send OTP verification email. Please try again.");
    }
  };

  const handleEmailSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      // Check if email already exists in backend db
      const { data } = await checkEmail(email.trim());
      if (data.exists) {
        setError("An account with this email address already exists.");
        setIsSubmitting(false);
        return;
      }

      await sendOtp(email.trim(), name.trim());
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred during verification check");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (enteredOtp !== generatedOtp) {
      setOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setUser(data.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setOtpError(err.response?.data?.error || "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setIsSubmitting(true);
    await sendOtp(email.trim(), name.trim());
    setIsSubmitting(false);
  };

  const handleBackToForm = () => {
    setIsOtpSent(false);
    setEnteredOtp("");
    setGeneratedOtp("");
    setDevModeOtp(null);
    setOtpError("");
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const { data } = await googleLoginUser({ 
        email: user.email || "", 
        name: user.displayName || user.email?.split("@")[0] || "User", 
        avatar_url: user.photoURL || "" 
      });
      
      setUser(data.data);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign up with Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-card p-8">
        <button
          onClick={isOtpSent ? handleBackToForm : () => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {isOtpSent ? "Back to edit details" : "Back to Home"}
        </button>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {isOtpSent ? "Verify your email" : "Create your OmniPool account"}
        </h1>
        <p className="text-sm text-text-muted mb-6">
          {isOtpSent 
            ? "Enter the 6-digit verification code sent to your inbox."
            : "Connect, pool hardware, and join the community."
          }
        </p>

        {!isOtpSent && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              className="w-full mb-4 px-4 py-2.5 border border-border-default rounded-xl text-sm font-medium text-text-primary hover:bg-bg-secondary transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              Continue with Google
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-default" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-card px-2 text-text-muted">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUpSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  minLength={6}
                  required
                  className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 pr-12 text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {error && <p className="text-sm text-accent-rose">{error}</p>}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-accent-indigo text-white font-medium hover:bg-accent-violet transition-all disabled:opacity-70 flex justify-center items-center cursor-pointer"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Get Verification Code"}
              </button>
            </form>
          </>
        )}

        {isOtpSent && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5">
            <div className="text-center bg-bg-secondary/40 border border-border-default/50 rounded-xl py-3 px-4 mb-2">
              <p className="text-xs text-text-muted">
                Sent verification code to:
              </p>
              <p className="text-sm font-semibold text-text-primary mt-0.5 break-all">
                {email}
              </p>
            </div>

            {devModeOtp && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl p-3 text-xs text-center space-y-1">
                <span className="font-semibold block uppercase tracking-wider text-[10px]">Developer Sandbox Mode</span>
                EmailJS credentials are not configured. Use the code below:
                <span className="block font-mono text-lg font-bold tracking-widest select-all mt-1 bg-bg-secondary py-1 rounded border border-border-default/80">{devModeOtp}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted block text-center">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                className="w-full text-center tracking-[0.6em] font-mono text-2xl bg-bg-tertiary border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-indigo transition-colors"
              />
            </div>

            {otpError && <p className="text-sm text-accent-rose text-center">{otpError}</p>}
            {error && <p className="text-sm text-accent-rose text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || enteredOtp.length !== 6}
              className="w-full px-4 py-2.5 rounded-xl bg-accent-indigo text-white font-medium hover:bg-accent-violet transition-all disabled:opacity-50 flex justify-center items-center cursor-pointer"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Verify & Sign Up"}
            </button>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-border-default/50">
              <button
                type="button"
                onClick={handleBackToForm}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Edit Details
              </button>
              
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || isSubmitting}
                className="text-accent-indigo hover:text-accent-violet disabled:text-text-muted disabled:no-underline font-medium transition-colors cursor-pointer"
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        <p className="text-sm text-text-muted mt-6 text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-accent-indigo hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;

