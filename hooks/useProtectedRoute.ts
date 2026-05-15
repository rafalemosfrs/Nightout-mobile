import { useEffect } from 'react';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import { getHomeRouteForUserType, useAuth } from '../contexts/AuthContext';
import type { UsuarioTipo } from '../types/api';

const DASHBOARD_ROUTES_BY_TYPE: Record<UsuarioTipo, string[]> = {
  CLIENTE: ['cliente'],
  ARTISTA: ['artista', 'artista-perfil'],
  CASASHOW: [
    'casashow',
    'casashow-eventos',
    'casashow-eventos-resumo',
    'casashow-propostas',
    'casashow-propostas-aceitas',
    'casashow-propostas-enviadas',
  ],
};

const TAB_ROUTES_BY_TYPE: Record<UsuarioTipo, string[]> = {
  CLIENTE: ['events', 'profile-costumer', 'venues'],
  ARTISTA: [],
  CASASHOW: ['index', 'events', 'profile-casa-show', 'venues'],
};

function isPublicRoute(rootSegment?: string) {
  return !rootSegment || rootSegment === 'register' || rootSegment === '+not-found';
}

function isAllowedDashboard(tipo: UsuarioTipo, routeName?: string) {
  return !!routeName && DASHBOARD_ROUTES_BY_TYPE[tipo].includes(routeName);
}

function isAllowedTab(tipo: UsuarioTipo, routeName?: string) {
  return !!routeName && TAB_ROUTES_BY_TYPE[tipo].includes(routeName);
}

export function useProtectedRoute() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || isLoading) return;

    const routeSegments = segments as string[];
    const rootSegment = routeSegments[0];
    const routeName = routeSegments[1];

    if (!session) {
      if (!isPublicRoute(rootSegment)) {
        router.replace('/');
      }

      return;
    }

    if (isPublicRoute(rootSegment)) {
      router.replace(getHomeRouteForUserType(session.tipo));
      return;
    }

    if (rootSegment === 'dashboards' && !isAllowedDashboard(session.tipo, routeName)) {
      router.replace(getHomeRouteForUserType(session.tipo));
      return;
    }

    if (rootSegment === '(tabs)' && !isAllowedTab(session.tipo, routeName)) {
      router.replace(getHomeRouteForUserType(session.tipo));
    }
  }, [isLoading, rootNavigationState?.key, segments, session]);
}
