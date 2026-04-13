import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import axios from "axios";
import { syncUser } from "../api/client";
import { auth } from "../config/firebase";
import useStore from "../store/useStore";

interface AuthContextValue {
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthLoading: true,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const setUser = useStore((state) => state.setUser);
  const logout = useStore((state) => state.logout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser: FirebaseUser | null) => {
        if (!currentUser) {
          logout();
          setIsAuthLoading(false);
          return;
        }

        try {
          const { data } = await syncUser({
            name: currentUser.displayName || undefined,
          });
          setUser(data.data);
        } catch (error) {
          console.error("User sync failed after Firebase auth", error);
          const backendError = axios.isAxiosError(error)
            ? error.response?.data?.error ||
              error.response?.data?.message ||
              error.message
            : error instanceof Error
              ? error.message
              : "Unexpected backend error";
          sessionStorage.setItem(
            "auth_sync_error",
            `Signed in with Firebase, but the backend could not create your profile: ${backendError}`,
          );
          logout();
          await signOut(auth);
        } finally {
          setIsAuthLoading(false);
        }
      },
    );

    return () => unsubscribe();
  }, [logout, setUser]);

  const value = useMemo(() => ({ isAuthLoading }), [isAuthLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
