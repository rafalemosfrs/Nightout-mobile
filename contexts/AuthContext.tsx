import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService, usersService } from '../services/api';
import {
  clearApiAuthToken,
  setApiAuthToken,
  subscribeUnauthorized,
} from '../services/apiClient';
import {
  clearStoredSession,
  getStoredSession,
  saveSession,
} from '../services/sessionStorage';
import {
  clearLoggedUserInfo,
  initializeLoggedUserInfo,
  setLoggedUserInfo,
} from '../constants/id';
import type {
  ArtistaCadastroPayload,
  CasaDeShowCadastroPayload,
  ClienteCadastroPayload,
  LoginPayload,
  UserSession,
  UsuarioTipo,
} from '../types/api';

interface AuthContextValue {
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<UserSession>;
  logout: () => Promise<void>;
  registerClient: typeof usersService.registerClient;
  registerArtist: typeof usersService.registerArtist;
  registerCasaShow: typeof usersService.registerCasaShow;
  hasRole: (roles: UsuarioTipo | UsuarioTipo[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const USER_HOME_BY_TYPE = {
  CLIENTE: '/dashboards/cliente',
  ARTISTA: '/dashboards/artista',
  CASASHOW: '/dashboards/casashow',
} as const satisfies Record<UsuarioTipo, string>;

export type UserHomeRoute = (typeof USER_HOME_BY_TYPE)[UsuarioTipo] | '/';

export function getHomeRouteForUserType(tipo?: UsuarioTipo | null): UserHomeRoute {
  if (!tipo) return '/';
  return USER_HOME_BY_TYPE[tipo] || '/';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(async () => {
    clearApiAuthToken();
    await clearStoredSession();
    clearLoggedUserInfo();
    setSession(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await initializeLoggedUserInfo();
        const storedSession = await getStoredSession();

        if (!isMounted) return;

        setSession(storedSession);

        if (storedSession) {
          setApiAuthToken(storedSession.token);
          setLoggedUserInfo({
            id: storedSession.id,
            role: storedSession.tipo,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      clearAuthState();
    });
  }, [clearAuthState]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setApiAuthToken(response.token);
    const nextSession = await saveSession(response);

    setLoggedUserInfo({
      id: nextSession.id,
      role: nextSession.tipo,
    });
    setSession(nextSession);

    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    await clearAuthState();
  }, [clearAuthState]);

  const hasRole = useCallback(
    (roles: UsuarioTipo | UsuarioTipo[]) => {
      if (!session) return false;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(session.tipo);
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      login,
      logout,
      registerClient: (payload: ClienteCadastroPayload) =>
        usersService.registerClient(payload),
      registerArtist: (payload: ArtistaCadastroPayload) =>
        usersService.registerArtist(payload),
      registerCasaShow: (payload: CasaDeShowCadastroPayload) =>
        usersService.registerCasaShow(payload),
      hasRole,
    }),
    [hasRole, isLoading, login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
