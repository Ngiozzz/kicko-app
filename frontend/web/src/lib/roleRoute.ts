// Where a signed-in user belongs, based on their real role from the
// backend — not on which landing-page link they happened to click.
export function resolveHomeRoute(role: string): string {
  switch (role) {
    case 'player':
      return '/player';
    case 'owner':
      return '/owner';
    case 'manager':
      return '/manager';
    case 'admin':
      return '/admin-dashboard';
    default:
      return '/';
  }
}

// sign-in/sign-up carry an optional ?next= (see withRole) so a visitor
// who was sent to auth from a specific venue lands back there instead
// of their role's generic home. Only ever set by our own links, but
// it's still a URL query param, so only accept an in-app path (a
// single leading slash, not "//host" which browsers treat as
// protocol-relative) rather than trusting it outright.
export function resolveNext(next: string | undefined, role: string): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return resolveHomeRoute(role);
}
