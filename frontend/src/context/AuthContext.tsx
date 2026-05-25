import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import api, { setAuthTokenProvider } from '../services/api';

const TOKEN_KEY = 'userToken';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currentBalance: number;
  phone?: string;
  activePlan?: string;
  isVerified?: boolean;
  dp?: string;
}

export interface AuthState {
  token: string | null;
  loading: boolean;
  userData: UserData | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, userData: UserData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  token: null,
  loading: true,
  userData: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const applySession = useCallback(async (token: string, userData: UserData) => {
    setAuthTokenProvider(() => token);
    setAuthState({ token, userData, loading: false });
  }, []);

  const login = useCallback(
    async (token: string, userData: UserData) => {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await applySession(token, userData);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to delete token from SecureStore:', e);
    }

    setAuthTokenProvider(() => null);
    setAuthState({ token: null, loading: false, userData: null });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

        if (!storedToken) {
          if (isMounted) {
            setAuthState({ token: null, loading: false, userData: null });
          }
          return;
        }

        setAuthTokenProvider(() => storedToken);

        const response = await api.get<{ user: UserData }>('/auth/profile');

        if (isMounted) {
          await applySession(storedToken, response.data.user);
        }
      } catch (error) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthTokenProvider(() => null);

        if (isMounted) {
          setAuthState({ token: null, loading: false, userData: null });
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [applySession]);

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
    }),
    [authState, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
