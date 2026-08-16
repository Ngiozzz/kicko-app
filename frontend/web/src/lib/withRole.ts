import { Role } from '../content/roleContent';

// /sign-in and /sign-up both read a ?role= param to pick which copy to
// show — this appends it to a Cta's href without needing every call
// site to special-case the two routes that care about it.
export function withRole(href: '/sign-up' | '/sign-in', role: Role): string {
  return `${href}?role=${role}`;
}
