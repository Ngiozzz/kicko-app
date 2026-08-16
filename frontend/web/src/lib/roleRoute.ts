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
