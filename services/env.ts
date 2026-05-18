declare const process: {
  env: {
    EXPO_PUBLIC_USERS_API_URL?: string;
    EXPO_PUBLIC_EVENTS_API_URL?: string;
  };
};

const DEFAULT_USERS_API_URL = 'https://night-out-api-usuarios.onrender.com';
const DEFAULT_EVENTS_API_URL = 'https://night-out-api-eventos.onrender.com';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function readEnv(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();
  return trimTrailingSlash(normalizedValue || fallback);
}

export const apiEnv = {
  usersBaseUrl: readEnv(process.env.EXPO_PUBLIC_USERS_API_URL, DEFAULT_USERS_API_URL),
  eventsBaseUrl: readEnv(process.env.EXPO_PUBLIC_EVENTS_API_URL, DEFAULT_EVENTS_API_URL),
};
