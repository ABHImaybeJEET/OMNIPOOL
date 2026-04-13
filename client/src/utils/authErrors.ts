import { type AuthError } from "firebase/auth";

export const getAuthErrorCode = (error: unknown): string | undefined =>
  (error as AuthError | undefined)?.code;

export const getSignInMessage = (
  code: string | undefined,
  signInMethods: string[] = [],
): string => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      if (
        signInMethods.includes("google.com") &&
        !signInMethods.includes("password")
      ) {
        return "This account uses Google sign-in. Click Continue with Google to sign in.";
      }

      if (signInMethods.includes("password")) {
        return "Incorrect password for this email address.";
      }

      if (signInMethods.length === 0) {
        return "No account exists for this email in this Firebase project.";
      }

      return "Invalid email or password.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/account-exists-with-different-credential":
      return "This email already uses another sign-in method. Sign in with the original method first, then link the other provider.";
    case "auth/credential-already-in-use":
      return "That sign-in method is already linked to another account.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in Firebase Auth settings.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid. Check VITE_FIREBASE_API_KEY.";
    case "auth/app-not-authorized":
      return "This app/domain is not authorized in Firebase for this API key.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error while signing in. Check your connection and try again.";
    default:
      return `Unable to sign in (${code || "unknown-error"}).`;
  }
};

export const getSignUpMessage = (code: string | undefined): string => {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email. Use sign-in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-up is not enabled in Firebase Auth settings.";
    case "auth/account-exists-with-different-credential":
      return "This email is already linked to a different sign-in method. Use that method first, then link the other provider.";
    case "auth/credential-already-in-use":
      return "This sign-in method is already linked to another account.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid. Check VITE_FIREBASE_API_KEY.";
    case "auth/app-not-authorized":
      return "This app/domain is not authorized in Firebase for this API key.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error while creating account. Check your connection and try again.";
    default:
      return `Unable to create account (${code || "unknown-error"}).`;
  }
};

export const getGoogleSignInMessage = (code: string | undefined): string => {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Auth settings.";
    case "auth/account-exists-with-different-credential":
      return "This email already uses another sign-in method. Sign in with that method first, then link Google.";
    case "auth/credential-already-in-use":
      return "This Google account is already linked to another OmniPool account.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled in Firebase Auth settings.";
    case "auth/invalid-api-key":
      return "Firebase API key is invalid. Check VITE_FIREBASE_API_KEY.";
    case "auth/app-not-authorized":
      return "This app/domain is not authorized in Firebase for this API key.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error while signing in. Check your connection and try again.";
    default:
      return `Google sign-in failed (${code || "unknown-error"}).`;
  }
};

export const getResetPasswordMessage = (code: string | undefined): string => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/missing-email":
      return "Please enter your email address first.";
    case "auth/user-not-found":
      return "No account was found for that email address.";
    case "auth/operation-not-allowed":
      return "Password reset is not enabled in Firebase Auth settings.";
    case "auth/too-many-requests":
      return "Too many reset attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error while sending reset email. Check your connection and try again.";
    default:
      return `Unable to send reset email (${code || "unknown-error"}).`;
  }
};
