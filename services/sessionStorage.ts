import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, UserSession } from '../types/api';

export const USER_SESSION_KEY = 'user_session';
const LEGACY_SESSION_KEYS = [
  'auth_token',
  'authToken',
  'token',
  'session',
  'user',
  'user_data',
  'userData',
  'usuario',
  'logged_user',
  'loggedUser',
];

export function normalizeSession(data: AuthResponse | UserSession): UserSession {
  return {
    email: data.email,
    id: data.id,
    nome: data.nome,
    tipo: data.tipo,
    token: data.token,
  };
}

export async function getStoredSession(): Promise<UserSession | null> {
  const stored = await AsyncStorage.getItem(USER_SESSION_KEY);

  if (!stored) return null;

  let parsed: Partial<UserSession> & { id_usuario?: string };

  try {
    parsed = JSON.parse(stored) as Partial<UserSession> & { id_usuario?: string };
  } catch {
    await clearStoredSession();
    return null;
  }

  const id = parsed.id || parsed.id_usuario;

  if (!id || !parsed.email || !parsed.nome || !parsed.tipo || !parsed.token) {
    await clearStoredSession();
    return null;
  }

  const session = {
    email: parsed.email,
    id,
    nome: parsed.nome,
    tipo: parsed.tipo,
    token: parsed.token,
  } as UserSession;

  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));

  return session;
}

export async function saveSession(data: AuthResponse | UserSession) {
  const session = normalizeSession(data);
  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function clearStoredSession() {
  await AsyncStorage.multiRemove([USER_SESSION_KEY, ...LEGACY_SESSION_KEYS]);
}
