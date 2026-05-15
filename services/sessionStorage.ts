import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, UserSession } from '../types/api';

export const USER_SESSION_KEY = 'user_session';

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

  const parsed = JSON.parse(stored) as Partial<UserSession>;

  if (!parsed.id || !parsed.email || !parsed.nome || !parsed.tipo || !parsed.token) {
    return null;
  }

  return {
    email: parsed.email,
    id: parsed.id,
    nome: parsed.nome,
    tipo: parsed.tipo,
    token: parsed.token,
  } as UserSession;
}

export async function saveSession(data: AuthResponse | UserSession) {
  const session = normalizeSession(data);
  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(USER_SESSION_KEY);
}
