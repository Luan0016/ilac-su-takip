import { ApiError } from './client';

/** i18n key for an auth error shown to the user. */
export function authErrorKey(e: unknown): string {
  if (!(e instanceof ApiError)) return 'auth.failed';
  if (e.status === 0) return 'auth.network';
  if (e.status === 401) return 'auth.invalid';
  if (e.status === 409) return 'auth.taken';
  return 'auth.failed';
}
