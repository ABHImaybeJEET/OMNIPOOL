import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "../config/firebase";
import useStore from "../store/useStore";
import { useAuth } from "../context/AuthContext";
import {
  getAuthErrorCode,
  getGoogleSignInMessage,
  getSignUpMessage,
} from "../utils/authErrors";

const SignUpPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const { isAuthLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncError = sessionStorage.getItem("auth_sync_error");
    if (syncError) {
      setError(syncError);
      sessionStorage.removeItem("auth_sync_error");
    }
  }, []);

  if (!isAuthLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
    } catch (error) {
      setError(getSignUpMessage(getAuthErrorCode(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError(getGoogleSignInMessage(getAuthErrorCode(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Create your OmniPool account
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Authentication is powered by Firebase.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignUp}
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

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={6}
              required
              className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 pr-12 text-text-primary"
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
            className="w-full px-4 py-2.5 rounded-xl bg-accent-indigo text-white font-medium hover:bg-accent-violet transition-all disabled:opacity-70"
          >
            Sign Up
          </button>
        </form>

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
