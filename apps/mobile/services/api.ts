import { useAuthStore } from '@store/auth.store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TIMEOUT_MS = 15_000;

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Shared refresh promise — all concurrent 401s wait on the same attempt
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const store = useAuthStore.getState();
  if (!store.refreshToken || !store.user) return false;
  try {
    const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, refreshToken: store.refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
    if (json.success && json.data) {
      store.setToken(json.data.accessToken);
      store.setRefreshToken(json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const store = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (body != null) headers['Content-Type'] = 'application/json';
  if (store.token) headers['Authorization'] = `Bearer ${store.token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      throw Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' });
    }
    throw err;
  }
  clearTimeout(timer);

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    if (res.status === 401 && useAuthStore.getState().refreshToken) {
      // All concurrent 401s share a single refresh attempt
      if (!refreshPromise) {
        refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
      }
      const refreshed = await refreshPromise;
      if (refreshed) {
        return request<T>(method, path, body);
      }
      useAuthStore.getState().logout();
      throw Object.assign(new Error('Session expired. Please log in again.'), {
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    const errJson = json as ApiError;
    throw Object.assign(new Error(errJson.error?.message ?? 'Request failed'), {
      code: errJson.error?.code ?? 'ERROR',
      statusCode: res.status,
    });
  }

  return (json as ApiSuccess<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export function isAuthError(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number } | null;
  return e?.code === 'UNAUTHORIZED' || e?.statusCode === 401 || e?.statusCode === 403;
}
