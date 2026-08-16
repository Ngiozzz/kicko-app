import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiConfigured = Boolean(API_URL);

/**
 * Calls the Kicko backend, attaching the current Supabase session's access
 * token as a Bearer header. Auth itself (sign up / sign in) stays direct
 * to Supabase from the client — everything else (account data, bookings,
 * venues, ...) goes through here instead of calling Supabase directly, so
 * web, mobile, and USSD all share one source of truth for business logic.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL isn’t set — add it to .env once the backend is running somewhere reachable.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status}).`);
  }
  return body as T;
}
