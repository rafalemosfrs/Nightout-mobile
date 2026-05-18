import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, UserSession } from '../types/api';

export const USER_SESSION_KEY = 'user_session';

export function normalizeSession(data: AuthResponse | UserSession): UserSession {
  return {
    email: data.email,
    id: data.id,
    id_usuario: 'id_usuario' in data && data.id_usuario ? data.id_usuario : data.id,
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

  const session = {
    email: parsed.email,
    id: parsed.id,
    id_usuario: parsed.id_usuario || parsed.id,
    nome: parsed.nome,
    tipo: parsed.tipo,
    token: parsed.token,
  } as UserSession;

  if (!parsed.id_usuario) {
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export async function saveSession(data: AuthResponse | UserSession) {
  const session = normalizeSession(data);
  await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(USER_SESSION_KEY);
}
