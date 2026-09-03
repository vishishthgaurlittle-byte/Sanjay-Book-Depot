'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Stop observing after the first intersection (default true). */
  once?: boolean;
  /** IntersectionObserver rootMargin, e.g. '200px' to start early. */
  rootMargin?: string;
  threshold?: number;
}

/**
 * Observe when an element enters the viewport.
 *
 * Used to defer mounting heavy Three.js canvases until they are about to be
 * seen, keeping ~600 kB of WebGL code off the critical path.
 *
 * Returns `inView: true` immediately when IntersectionObserver is unavailable
 * (old browsers, some server-render shims) so content is never hidden forever.
 */
export function useInView<T extends Element = HTMLDivElement>({
  once = true,
  rootMargin = '0px',
  threshold = 0,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
