import { useSession, type Session } from '../store/session';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean };

async function send(path: string, { method = 'GET', body, auth }: Options, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'network');
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) throw new ApiError(res.status, (data as { message?: string } | undefined)?.message ?? `HTTP ${res.status}`);
  return data as T;
}

/** Exchanges the refresh token once; on failure the session is cleared. */
async function refresh(): Promise<Session | null> {
  const { session, setSession, clear } = useSession.getState();
  if (!session) return null;
  const res = await send('/auth/refresh', { method: 'POST', body: { refreshToken: session.refreshToken } });
  if (!res.ok) {
    await clear();
    return null;
  }
  const next = await parse<Session>(res);
  await setSession(next);
  return next;
}

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const res = await send(path, options, useSession.getState().session?.accessToken);
  if (res.status === 401 && options.auth) {
    const next = await refresh();
    if (!next) throw new ApiError(401, 'Unauthorized');
    return parse<T>(await send(path, options, next.accessToken));
  }
  return parse<T>(res);
}

export const api = {
  async register(email: string, password: string, consent: boolean) {
    const session = await request<Session>('/auth/register', { method: 'POST', body: { email, password, consent } });
    await useSession.getState().setSession(session);
    return session;
  },
  async login(email: string, password: string) {
    const session = await request<Session>('/auth/login', { method: 'POST', body: { email, password } });
    await useSession.getState().setSession(session);
    return session;
  },
  async logout() {
    const { session, clear } = useSession.getState();
    if (session) await request<void>('/auth/logout', { method: 'POST', body: { refreshToken: session.refreshToken } }).catch(() => undefined);
    await clear();
  },
  me: () => request<{ id: string; email: string; locale: string }>('/me', { auth: true }),
};
