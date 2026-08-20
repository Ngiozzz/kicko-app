import { Role } from '../content/roleContent';

// /sign-in and /sign-up both read a ?role= param to pick which copy to
// show — this appends it to a Cta's href without needing every call
// site to special-case the two routes that care about it. An optional
// `next` carries where to send the user after auth succeeds (e.g. back
// to the venue they were trying to book) instead of their role's
// generic home — see resolveNext in roleRoute.ts for how it's consumed.
export function withRole(href: '/sign-up' | '/sign-in', role: Role, next?: string): string {
  const params = new URLSearchParams({ role });
  if (next) params.set('next', next);
  return `${href}?${params.toString()}`;
}
