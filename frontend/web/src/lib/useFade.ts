import { useEffect, useRef, useState } from 'react';

// Crossfades content whenever `dep` changes, instead of a hard cut —
// used for the role-tab swap (hero, FAQ, nav CTA) so different roles
// don't feel like different colors/copy just snapped into place. Skips
// the fade on the initial mount (there's nothing to crossfade from yet)
// and uses setTimeout rather than requestAnimationFrame, which was
// getting cancelled before it fired in this Expo web build.
export function useFade(dep: unknown) {
  const [visible, setVisible] = useState(true);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(timer);
  }, [dep]);

  return {
    opacity: visible ? 1 : 0,
    transitionProperty: 'opacity' as const,
    transitionDuration: '220ms' as const,
    transitionTimingFunction: 'ease' as const,
  };
}
