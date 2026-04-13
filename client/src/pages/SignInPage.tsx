import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "../config/firebase";
import useStore from "../store/useStore";
import { useAuth } from "../context/AuthContext";
import {
  getAuthErrorCode,
  getGoogleSignInMessage,
  getResetPasswordMessage,
  getSignInMessage,
} from "../utils/authErrors";

const SignInPage: React.FC = () => {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const { isAuthLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncError = sessionStorage.getItem("auth_sync_error");
    if (syncError) {
      setError(syncError);
      sessionStorage.removeItem("auth_sync_error");
    }
  }, []);

  const from =
    (location.state as { from?: string } | null)?.from || "/dashboard";

  if (!isAuthLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const code = getAuthErrorCode(error);
      const emailAddress = email.trim();

      if (
        emailAddress &&
        [
          "auth/invalid-credential",
          "auth/invalid-login-credentials",
          "auth/wrong-password",
          "auth/user-not-found",
        ].includes(code || "")
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, emailAddress);

          if (methods.includes("google.com") && !methods.includes("password")) {
            setError(
              "This account was created with Google. Click 'Continue with Google' to sign in.",
            );
            return;
          }

          if (methods.includes("password")) {
            setError("Incorrect password for this email address.");
            return;
          }

          if (methods.length === 0) {
            setError(
              "No account exists for this email. Create an account first or check the email address.",
            );
            return;
          }
        } catch {
          // Fall through to generic mapping below.
        }
      }

      setError(getSignInMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setStatusMessage("");
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError(getGoogleSignInMessage(getAuthErrorCode(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setStatusMessage("");

    const emailAddress = email.trim();
    if (!emailAddress) {
      setError("Please enter your email address first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, emailAddress);
      setStatusMessage(`Password reset email sent to ${emailAddress}.`);
    } catch (error) {
      setError(getResetPasswordMessage(getAuthErrorCode(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Sign in to OmniPool
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Continue with Firebase authentication.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full mb-4 px-4 py-2.5 border border-border-default rounded-xl text-sm font-medium text-text-primary hover:bg-bg-secondary transition-all disabled:opacity-70"
        >
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

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary"
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 pr-12 text-text-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="-mt-12 ml-auto mr-3 flex items-center justify-end text-text-muted hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSubmitting}
              className="text-sm text-accent-indigo hover:underline disabled:opacity-70"
            >
              Forgot password?
            </button>
          </div>
          {error && <p className="text-sm text-accent-rose">{error}</p>}
          {statusMessage && (
            <p className="text-sm text-accent-emerald">{statusMessage}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl bg-accent-indigo text-white font-medium hover:bg-accent-violet transition-all disabled:opacity-70"
          >
            Sign In
          </button>
        </form>

        <p className="text-sm text-text-muted mt-6 text-center">
          New to OmniPool?{" "}
          <Link to="/signup" className="text-accent-indigo hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
