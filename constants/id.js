import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SESSION_KEY = 'user_session';

let loggedUserId = null;
let loggedUserRole = null;

export async function initializeLoggedUserInfo() {
  try {
    const stored = await AsyncStorage.getItem(USER_SESSION_KEY);

    if (!stored) return;

    const session = JSON.parse(stored);
    loggedUserId =
      session?.id ||
      session?.id_usuario ||
      null;
      
    loggedUserRole = session?.tipo || session?.role || null;
  } catch (error) {
    console.warn('Falha ao inicializar ID de usu�rio:', error);
  }
}

export function setLoggedUserInfo({ id, role }) {
  loggedUserId = id ?? loggedUserId;
  loggedUserRole = role ?? loggedUserRole;
}

export function getLoggedUserId() {
  return loggedUserId;
}

export function getLoggedUserRole() {
  return loggedUserRole;
}

export function clearLoggedUserInfo() {
  loggedUserId = null;
  loggedUserRole = null;
}
