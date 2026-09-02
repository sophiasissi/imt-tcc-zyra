import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiError, apiRequest } from '../services/api';
import {
  clearAuthTokens,
  getAuthTokens,
  getCachedProfile,
  saveAuthTokens,
  saveCachedProfile,
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

  const clearSessionState = useCallback(async () => {
    setTokens(null);
    setUser(null);
    await clearAuthTokens();
  }, []);

  /**
   * Renova os tokens. Propaga o erro para quem chamou decidir o que fazer:
   * uma recusa do Cognito significa sessão encerrada, mas uma falha de rede
   * significa apenas "tente de novo depois".
   */
  const performRefresh = useCallback(
    async (currentTokens: StoredAuthTokens) => {
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
    },
    [],
  );

  const refreshStoredSession = useCallback(
    async (currentTokens: StoredAuthTokens) => {
      try {
        return await performRefresh(currentTokens);
      } catch (error) {
        console.error('[Sessão] Não foi possível renovar a sessão:', error);
        return null;
      }
    },
    [performRefresh],
  );

  const fetchProfile = useCallback(async (accessToken: string) => {
    const profile = await apiRequest<UserProfile>('/users/me', {
      method: 'GET',
      token: accessToken,
    });

    await saveCachedProfile(profile);

    return profile;
  }, []);

  /**
   * Mantém a sessão no ar usando o último perfil guardado.
   *
   * Usado quando a falha foi de rede: o token continua válido, o servidor é
   * que está inalcançável. Apagar a sessão aqui deslogaria a pessoa por ter
   * aberto o app no metrô — e ela não conseguiria entrar de novo, justamente
   * por estar sem internet.
   */
  const keepSessionOffline = useCallback(
    async (currentTokens: StoredAuthTokens) => {
      const cachedProfile = await getCachedProfile<UserProfile>();

      setTokens(currentTokens);

      if (cachedProfile) {
        setUser(cachedProfile);
      }

      return Boolean(cachedProfile);
    },
    [],
  );

  useEffect(() => {
    async function restoreSession() {
      let storedTokens: StoredAuthTokens | null = null;

      try {
        storedTokens = await getAuthTokens();

        if (!storedTokens?.accessToken) {
          await clearSessionState();
          return;
        }

        try {
          const profile = await fetchProfile(storedTokens.accessToken);

          setTokens(storedTokens);
          setUser(profile);
          return;
        } catch (error) {
          const recusouToken = error instanceof ApiError && error.isUnauthorized;

          // Qualquer falha que não seja recusa do token (rede, 404, 500) não
          // justifica destruir a sessão: renovar não resolveria, e o usuário
          // seria deslogado por um problema que não é dele.
          if (!recusouToken) {
            console.log(
              '[Sessão] Perfil indisponível agora. Sessão preservada:',
              error instanceof Error ? error.message : error,
            );

            await keepSessionOffline(storedTokens);
            return;
          }

          const refreshedTokens = await performRefresh(storedTokens);
          const profile = await fetchProfile(refreshedTokens.accessToken);

          setTokens(refreshedTokens);
          setUser(profile);
        }
      } catch (error) {
        // Falha durante a renovação ou na segunda busca do perfil.
        const recusouToken = error instanceof ApiError && error.isUnauthorized;

        if (!recusouToken && storedTokens?.accessToken) {
          console.log(
            '[Sessão] Não foi possível renovar agora. Sessão preservada.',
          );

          await keepSessionOffline(storedTokens);
        } else {
          console.error('[Sessão] Sessão encerrada:', error);
          await clearSessionState();
        }
      } finally {
        setIsRestoringSession(false);
      }
    }

    void restoreSession();
  }, [clearSessionState, performRefresh, fetchProfile, keepSessionOffline]);

  const signIn = useCallback(
    async (nextTokens: StoredAuthTokens, nextUser: UserProfile) => {
      await saveAuthTokens(nextTokens);
      await saveCachedProfile(nextUser);
      setTokens(nextTokens);
      setUser(nextUser);
    },
    [],
  );

  const signOut = useCallback(async () => {
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
  }, [tokens?.accessToken, clearSessionState]);

  const refreshSession = useCallback(async () => {
    if (!tokens) {
      return null;
    }

    return refreshStoredSession(tokens);
  }, [tokens, refreshStoredSession]);

  const updateUser = useCallback((nextUserData: Partial<UserProfile>) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = {
        ...currentUser,
        ...nextUserData,
      };

      // Mantém o cache alinhado para a próxima abertura offline.
      void saveCachedProfile(nextUser);

      return nextUser;
    });
  }, []);

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
    [
      tokens,
      user,
      isRestoringSession,
      isAuthenticated,
      signIn,
      signOut,
      refreshSession,
      updateUser,
    ],
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
