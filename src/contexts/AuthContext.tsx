import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiRequest } from '../services/api';
import {
  clearAuthTokens,
  getAuthTokens,
  saveAuthTokens,
  StoredAuthTokens,
} from '../services/authStorage';

export type UserProfile = {
  id: string;
  cognitoSub: string;
  nome: string | null;
  email: string | null;
  dataNascimento: string | null;
  genero: string | null;
  tipoDaltonismo: string | null;
  nivelDificuldadeLooks: number | null;
};

type RefreshTokenResponse = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
};

type AuthContextData = {
  tokens: StoredAuthTokens | null;
  user: UserProfile | null;
  isRestoringSession: boolean;
  isAuthenticated: boolean;
  signIn: (tokens: StoredAuthTokens, user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<StoredAuthTokens | null>;
  updateUser: (user: Partial<UserProfile>) => void;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [tokens, setTokens] = useState<StoredAuthTokens | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const isAuthenticated = Boolean(tokens?.accessToken && user);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedTokens = await getAuthTokens();

        if (!storedTokens?.accessToken) {
          await clearSessionState();
          return;
        }

        try {
          const profile = await apiRequest<UserProfile>('/users/me', {
            method: 'GET',
            token: storedTokens.accessToken,
          });

          setTokens(storedTokens);
          setUser(profile);
          return;
        } catch {
          const refreshedTokens = await refreshStoredSession(storedTokens);

          if (!refreshedTokens) {
            await clearSessionState();
            return;
          }

          const profile = await apiRequest<UserProfile>('/users/me', {
            method: 'GET',
            token: refreshedTokens.accessToken,
          });

          setTokens(refreshedTokens);
          setUser(profile);
        }
      } catch (error) {
        console.error('[Sessão] Erro ao restaurar sessão:', error);
        await clearSessionState();
      } finally {
        setIsRestoringSession(false);
      }
    }

    void restoreSession();
  }, []);

  async function clearSessionState() {
    setTokens(null);
    setUser(null);
    await clearAuthTokens();
  }

  async function refreshStoredSession(currentTokens: StoredAuthTokens) {
    try {
      const response = await apiRequest<RefreshTokenResponse>(
        '/auth/refresh-token',
        {
          method: 'POST',
          body: JSON.stringify({
            refreshToken: currentTokens.refreshToken,
          }),
        },
      );

      const nextTokens: StoredAuthTokens = {
        accessToken: response.accessToken,
        idToken: response.idToken,
        refreshToken: response.refreshToken ?? currentTokens.refreshToken,
        expiresIn: response.expiresIn,
        tokenType: response.tokenType,
      };

      await saveAuthTokens(nextTokens);
      setTokens(nextTokens);

      return nextTokens;
    } catch (error) {
      console.error('[Sessão] Não foi possível renovar a sessão:', error);
      return null;
    }
  }

  async function signIn(nextTokens: StoredAuthTokens, nextUser: UserProfile) {
    await saveAuthTokens(nextTokens);
    setTokens(nextTokens);
    setUser(nextUser);
  }

  async function signOut() {
    try {
      const storedTokens = await getAuthTokens();
      const accessToken = tokens?.accessToken || storedTokens?.accessToken;

      if (typeof accessToken === 'string' && accessToken.trim().length > 0) {
        const normalizedAccessToken = accessToken.trim();

        await apiRequest('/auth/logout', {
          method: 'POST',
          token: normalizedAccessToken,
          body: JSON.stringify({
            accessToken: normalizedAccessToken,
          }),
        });
      } else {
        console.log('[Sessão] Logout local executado sem accessToken válido.');
      }
    } catch (error) {
      console.error('[Sessão] Erro ao encerrar sessão no servidor:', error);
    } finally {
      await clearSessionState();
    }
  }

  async function refreshSession() {
    if (!tokens) {
      return null;
    }

    return refreshStoredSession(tokens);
  }

  function updateUser(nextUserData: Partial<UserProfile>) {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        ...nextUserData,
      };
    });
  }

  const value = useMemo(
    () => ({
      tokens,
      user,
      isRestoringSession,
      isAuthenticated,
      signIn,
      signOut,
      refreshSession,
      updateUser,
    }),
    [tokens, user, isRestoringSession, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
