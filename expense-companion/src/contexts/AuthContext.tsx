import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import keycloak from '@/config/keycloak';
import type Keycloak from 'keycloak-js';

interface AuthContextType {
  keycloak: Keycloak;
  authenticated: boolean;
  initialized: boolean;
  token: string | undefined;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Token refresh settings
const TOKEN_REFRESH_MIN_VALIDITY = 70; // Refresh if token expires in less than 70 seconds
const TOKEN_REFRESH_INTERVAL = 60000; // Check every 60 seconds

export function AuthProvider({ children }: AuthProviderProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Keycloak
    keycloak
      .init({
        onLoad: 'check-sso', // or 'login-required' to force login
        checkLoginIframe: false,
        pkceMethod: 'S256',
      })
      .then((auth) => {
        setAuthenticated(auth);
        setInitialized(true);

        if (auth) {
          console.log('[Auth] User authenticated');
          
          // Setup automatic token refresh
          setupTokenRefresh();
          
          // Setup token expiry handler
          keycloak.onTokenExpired = () => {
            console.log('[Auth] Token expired, refreshing...');
            refreshToken();
          };
        } else {
          console.log('[Auth] User not authenticated');
        }
      })
      .catch((error) => {
        console.error('[Auth] Failed to initialize Keycloak', error);
        setInitialized(true);
      });

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const refreshToken = async () => {
    try {
      const refreshed = await keycloak.updateToken(TOKEN_REFRESH_MIN_VALIDITY);
      if (refreshed) {
        console.log('[Auth] Token refreshed successfully');
        return true;
      } else {
        console.log('[Auth] Token is still valid');
        return false;
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh token', error);
      
      // If refresh fails, redirect to login
      console.log('[Auth] Redirecting to login due to token refresh failure');
      setAuthenticated(false);
      await keycloak.login();
      return false;
    }
  };

  const setupTokenRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Setup periodic token refresh check
    refreshIntervalRef.current = setInterval(() => {
      if (keycloak.authenticated) {
        refreshToken();
      }
    }, TOKEN_REFRESH_INTERVAL);
  };

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    // Clear refresh interval before logout
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    keycloak.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authenticated,
        initialized,
        token: keycloak.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
