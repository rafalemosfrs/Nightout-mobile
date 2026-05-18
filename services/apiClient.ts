import { apiEnv } from './env';
import { getStoredSession } from './sessionStorage';
import type { ApiErrorPayload } from '../types/api';

type QueryParamValue = string | number | boolean | null | undefined;

interface ApiRequestConfig extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  params?: Record<string, QueryParamValue>;
  body?: BodyInit | object | null;
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();
let currentAuthToken: string | null = null;

export class ApiError extends Error {
  status: number;
  data: ApiErrorPayload | unknown;

  constructor(message: string, status: number, data: ApiErrorPayload | unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function subscribeUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function setApiAuthToken(token?: string | null) {
  currentAuthToken = token || null;
}

export function clearApiAuthToken() {
  currentAuthToken = null;
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener());
}

function buildUrl(baseURL: string, path: string, params?: Record<string, QueryParamValue>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseURL}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

function extractErrorMessage(data: ApiErrorPayload | unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;

  const payload = data as ApiErrorPayload;

  if (Array.isArray(payload.message)) {
    return payload.message.join('\n');
  }

  return payload.message || payload.error || fallback;
}

function createApiClient(baseURL: string) {
  async function request<TResponse>(
    path: string,
    config: ApiRequestConfig = {}
  ): Promise<TResponse> {
    const { auth = true, params, headers, body, ...requestConfig } = config;
    const requestHeaders = new Headers(headers);

    if (!requestHeaders.has('Accept')) {
      requestHeaders.set('Accept', 'application/json');
    }

    let requestBody = body as BodyInit | undefined;

    if (body && typeof body === 'object' && !isFormData(body)) {
      requestHeaders.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    }

    if (auth) {
      let token = currentAuthToken;

      if (!token) {
        const session = await getStoredSession();
        token = session?.token || null;
        setApiAuthToken(token);
      }

      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    const normalizedHeaders = Object.fromEntries(requestHeaders.entries());

    const response = await fetch(buildUrl(baseURL, path, params), {
      ...requestConfig,
      headers: normalizedHeaders,
      body: requestBody,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        notifyUnauthorized();
      }

      throw new ApiError(
        extractErrorMessage(data, 'Erro ao comunicar com a API.'),
        response.status,
        data
      );
    }

    return data as TResponse;
  }

  return {
    get: <TResponse>(path: string, config?: ApiRequestConfig) =>
      request<TResponse>(path, { ...config, method: 'GET' }),
    post: <TResponse, TPayload extends object = Record<string, unknown>>(
      path: string,
      payload?: TPayload,
      config?: ApiRequestConfig
    ) => request<TResponse>(path, { ...config, method: 'POST', body: payload || null }),
    put: <TResponse, TPayload extends object = Record<string, unknown>>(
      path: string,
      payload?: TPayload,
      config?: ApiRequestConfig
    ) => request<TResponse>(path, { ...config, method: 'PUT', body: payload || null }),
    delete: <TResponse>(path: string, config?: ApiRequestConfig) =>
      request<TResponse>(path, { ...config, method: 'DELETE' }),
  };
}

export const usersApi = createApiClient(apiEnv.usersBaseUrl);
export const eventsApi = createApiClient(apiEnv.eventsBaseUrl);
