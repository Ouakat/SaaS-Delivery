"use client";
import { SessionProvider } from "next-auth/react";
import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { AuthManager } from "@/lib/auth/manager";
import { toast } from "sonner";

interface AuthContextType {
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  initialized: false,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Inner component that handles JWT auth logic
function JWTAuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = React.useState(false);
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check if user is authenticated from stored tokens
        if (AuthManager.isTokenValid()) {
          const userData = AuthManager.getUser();
          const permissions = AuthManager.getPermissions();

          if (userData) {
            // Set user in store
            setUser({ ...userData, permissions } as any);

            // Setup automatic token refresh
            AuthManager.setupTokenRefresh();

            // Verify token with server (optional - for extra security)
            try {
              const response = await fetch("/api/auth/verify", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${AuthManager.getToken()}`,
                  "Content-Type": "application/json",
                },
              });

              if (!response.ok) {
                throw new Error("Token verification failed");
              }
            } catch (verifyError) {
              console.error("Token verification failed:", verifyError);
              // If verification fails, logout user
              AuthManager.removeTokens();
              logout();
            }
          }
        } else {
          // Token is invalid or expired
          AuthManager.removeTokens();
          logout();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        AuthManager.removeTokens();
        logout();
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser, logout]);

  // Handle browser tab focus to check token validity
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (!AuthManager.isTokenValid()) {
  //       toast.error("Your session has expired. Please sign in again.");
  //       logout();
  //     }
  //   };

  //   window.addEventListener("focus", handleFocus);
  //   return () => window.removeEventListener("focus", handleFocus);
  // }, [logout]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      // When coming back online, verify auth state
      if (AuthManager.isTokenValid()) {
        AuthManager.refreshToken().catch(() => {
          toast.error("Unable to refresh session. Please sign in again.");
          logout();
        });
      }
    };

    const handleOffline = () => {
      // Optionally handle offline state
      console.log("App went offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ initialized }}>
      {children}
    </AuthContext.Provider>
  );
}

// Main AuthProvider that combines both NextAuth and JWT auth
const AuthProvider = ({ children }: AuthProviderProps) => {
  return (
    <SessionProvider>
      <JWTAuthProvider>{children}</JWTAuthProvider>
    </SessionProvider>
  );
};

export default AuthProvider;
