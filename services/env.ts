declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const DEFAULT_USERS_API_URL = 'https://night-out-api-usuarios.onrender.com';
const DEFAULT_EVENTS_API_URL = 'https://night-out-api-eventos.onrender.com';
//const DEFAULT_USERS_API_URL = 'http://localhost:3000';
//const DEFAULT_EVENTS_API_URL = 'http://localhost:3002';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function readEnv(name: string, fallback: string) {
  const value = process?.env?.[name]?.trim();
  return trimTrailingSlash(value || fallback);
}

export const apiEnv = {
  usersBaseUrl: readEnv('EXPO_PUBLIC_USERS_API_URL', DEFAULT_USERS_API_URL),
  eventsBaseUrl: readEnv('EXPO_PUBLIC_EVENTS_API_URL', DEFAULT_EVENTS_API_URL),
};
