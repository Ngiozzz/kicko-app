import { useEffect, useRef } from 'react';

// Web-only: closes a dropdown/panel when a pointerdown lands outside `ref`,
// or when Escape is pressed. RN Web forwards View/Pressable refs to the
// underlying DOM node, so ref.current.contains(...) works like plain HTML.
export function useClickOutside<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(e: PointerEvent) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        onOutside();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOutside();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onOutside]);

  return ref;
}
