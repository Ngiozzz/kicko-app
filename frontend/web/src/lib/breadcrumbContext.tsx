import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'expo-router';

export type Crumb = { label: string; href?: string };

type Override = { pathname: string; crumbs: Crumb[] } | null;
type SetOverride = (o: Override | ((prev: Override) => Override)) => void;

const BreadcrumbContext = createContext<{ override: Override; setOverride: SetOverride } | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<Override>(null);
  // Memoized so the context value only changes when `override` itself
  // actually changes — without this, every render creates a fresh {override,
  // setOverride} object, which would sit in useBreadcrumb's effect deps
  // below and re-fire on every provider render, including the one caused by
  // that same effect's own setOverride call: an infinite update loop.
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

// A screen calls this to replace the shell's route-based breadcrumb with
// something that reflects its actual data (e.g. the venue name, or whether
// a match session ended up funded vs cancelled) — pass null while there's
// nothing meaningful to show yet (still loading). Clears itself on unmount
// so it never leaks onto the next screen.
export function useBreadcrumb(crumbs: Crumb[] | null) {
  const pathname = usePathname();
  const ctx = useContext(BreadcrumbContext);
  const setOverride = ctx?.setOverride;
  const key = crumbs ? JSON.stringify(crumbs) : null;

  useEffect(() => {
    if (!setOverride || !crumbs) return;
    setOverride({ pathname, crumbs });
    return () => setOverride((prev) => (prev?.pathname === pathname ? null : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverride, pathname, key]);
}

// Used by the shell itself to read whatever the current route last set.
export function useBreadcrumbOverride(pathname: string): Crumb[] | null {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx?.override || ctx.override.pathname !== pathname) return null;
  return ctx.override.crumbs;
}
