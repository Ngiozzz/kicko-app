import { useWindowDimensions } from 'react-native';

// Below this, the dashboard shells (Player/Owner/Manager/AdminShell) swap
// their fixed left sidebar for a bottom tab bar — a different threshold
// than AuthLayout's own NARROW_BREAKPOINT (880), which decides when to stack
// the auth split-screen, a separate layout problem.
export const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const { width } = useWindowDimensions();
  return width < MOBILE_BREAKPOINT;
}
