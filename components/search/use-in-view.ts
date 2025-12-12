"use client";

import * as React from "react";

export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const [inView, setInView] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin;
  const threshold = options?.threshold;

  const ref = React.useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setInView(entry?.isIntersecting ?? false);
        },
        { root, rootMargin, threshold },
      );

      observerRef.current.observe(node);
    },
    [root, rootMargin, threshold],
  );

  React.useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref, inView };
}
