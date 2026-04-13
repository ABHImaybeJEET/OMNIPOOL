import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import useStore from "../../store/useStore";

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = useStore((state) => state.user);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/registry", label: "Registry" },
    { path: "/skills", label: "Skills" },
    { path: "/enterprise", label: "Enterprise" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const handleSignOut = async () => {
    await signOut(auth);
    setIsMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center group-hover:shadow-glow-sm transition-shadow">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-text-primary">
              OmniPool
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive(link.path)
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Links (Desktop) */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-text-secondary">
                  {user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-accent-indigo text-white hover:bg-accent-violet hover:shadow-glow-sm transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-secondary hover:text-text-primary p-2 cursor-pointer"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-border-default bg-white/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  block px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    isActive(link.path)
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                  }
                `}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-border-default/50 mt-2 pt-2 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all text-center"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setIsMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-accent-indigo text-white text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
