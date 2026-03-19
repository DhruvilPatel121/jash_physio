import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUser,
  createUser,
  updateUser,
  subscribeToUser,
} from "@/services/firebase";
import type { User, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve a unique session ID for this tab/instance
// We use sessionStorage so the ID persists through page refreshes
// but is cleared when the tab is closed.
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("active_session_id");
  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("active_session_id", sessionId);
  }
  return sessionId;
};

const CURRENT_SESSION_ID = getSessionId();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Fetch user data from database
        let userData = await getUser(fbUser.uid);

        // If user profile doesn't exist in database, create a fallback one
        if (!userData) {
          const fallbackUser: User = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            role: "staff",
            createdAt: Date.now(),
            sessionId: CURRENT_SESSION_ID,
          };

          setUser(fallbackUser);
          try {
            await createUser(fbUser.uid, fallbackUser);
          } catch (err) {
            console.error("Failed to create fallback user profile", err);
          }
        } else {
          setUser(userData);

          // Set up a listener to monitor session changes in real-time
          if (unsubscribeUser) unsubscribeUser();
          unsubscribeUser = subscribeToUser(fbUser.uid, (updatedData) => {
            if (updatedData) {
              // Check if another session has logged in
              if (
                updatedData.sessionId &&
                updatedData.sessionId !== CURRENT_SESSION_ID
              ) {
                // Another login detected! Force logout.
                toast({
                  title: "Session Expired",
                  description:
                    "You have been logged out because another login was detected with these credentials.",
                  variant: "destructive",
                });
                signOut();
              } else {
                setUser(updatedData);
              }
            }
          });
        }
      } else {
        setUser(null);
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update the sessionId in the database upon successful login
      await updateUser(userCredential.user.uid, {
        sessionId: CURRENT_SESSION_ID,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create user profile in database with current session ID
      await createUser(userCredential.user.uid, {
        email,
        name,
        role,
        createdAt: Date.now(),
        sessionId: CURRENT_SESSION_ID,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Optional: Clear sessionId in DB on manual logout to allow immediate re-login elsewhere
    if (user) {
      try {
        // Only clear if it's OUR session being logged out
        const freshData = await getUser(user.uid);
        if (freshData?.sessionId === CURRENT_SESSION_ID) {
          await updateUser(user.uid, { sessionId: "" });
        }
      } catch (e) {
        console.warn("Failed to clear session ID on logout", e);
      }
    }

    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
