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

// Guards against multiple simultaneous refresh attempts
let isRefreshing = false;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const store = useAuthStore.getState();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
    // On 401: attempt token refresh once, then retry the original request
    if (res.status === 401 && !isRefreshing && store.refreshToken && store.user) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: store.user.id, refreshToken: store.refreshToken }),
        });
        const refreshJson = (await refreshRes.json()) as ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>;
        if (refreshJson.success && refreshJson.data) {
          store.setToken(refreshJson.data.accessToken);
          store.setRefreshToken(refreshJson.data.refreshToken);
          isRefreshing = false;
          return request<T>(method, path, body);
        }
      } catch {
        // Refresh network error — fall through to logout
      }
      isRefreshing = false;
      store.logout();
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
