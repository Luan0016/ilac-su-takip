import { api } from '../src/api/client';
import { useSession } from '../src/store/session';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

const json = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const session = (n: number) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}`, user: { id: 'u1', email: 'a@b.com' } });

let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  useSession.setState({ session: null });
});

it('login stores session', async () => {
  fetchMock.mockResolvedValueOnce(json(200, session(1)));
  await api.login('a@b.com', 'correct-horse');
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/login$/);
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'a@b.com', password: 'correct-horse' });
  expect(useSession.getState().session).toEqual(session(1));
  const SecureStore = jest.requireMock('expo-secure-store');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('session', JSON.stringify(session(1)));
});

it('on 401 refreshes once and retries original request', async () => {
  useSession.setState({ session: session(1) });
  fetchMock
    .mockResolvedValueOnce(json(401, { message: 'Unauthorized' }))
    .mockResolvedValueOnce(json(200, session(2)))
    .mockResolvedValueOnce(json(200, { id: 'u1', email: 'a@b.com', locale: 'tr' }));

  await expect(api.me()).resolves.toEqual({ id: 'u1', email: 'a@b.com', locale: 'tr' });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/refresh$/);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: 'refresh-1' });
  expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer access-2');
  expect(useSession.getState().session).toEqual(session(2));
});

it('on refresh failure clears session', async () => {
  useSession.setState({ session: session(1) });
  fetchMock.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, {}));
  await expect(api.me()).rejects.toMatchObject({ status: 401 });
  expect(useSession.getState().session).toBeNull();
});

it('maps a 409 on register to an ApiError with status', async () => {
  fetchMock.mockResolvedValueOnce(json(409, { message: 'Email already registered' }));
  await expect(api.register('a@b.com', 'correct-horse', true)).rejects.toMatchObject({ status: 409 });
  expect(useSession.getState().session).toBeNull();
});
