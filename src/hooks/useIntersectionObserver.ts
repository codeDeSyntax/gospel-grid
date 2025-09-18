import { useEffect, useRef, useState, useCallback } from "react";

interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useIntersectionObserver(options: IntersectionOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    root = null,
    rootMargin = "100px", // Load thumbnails 100px before they become visible
    threshold = 0.1,
  } = options;

  const observe = useCallback((element: Element | null) => {
    targetRef.current = element;
  }, []);

  useEffect(() => {
    if (!targetRef.current) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    // Start observing
    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [root, rootMargin, threshold]);

  return {
    isIntersecting,
    entry,
    observe,
    ref: targetRef,
  };
}

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  onVisible?: () => void;
  onHidden?: () => void;
  enabled?: boolean;
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    rootMargin = "100px",
    threshold = 0.1,
    onVisible,
    onHidden,
    enabled = true,
  } = options;

  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const { isIntersecting, observe } = useIntersectionObserver({
    rootMargin,
    threshold,
  });

  useEffect(() => {
    if (!enabled) return;

    if (isIntersecting && !hasBeenVisible) {
      setHasBeenVisible(true);
      onVisible?.();
    } else if (!isIntersecting && hasBeenVisible) {
      onHidden?.();
    }
  }, [isIntersecting, hasBeenVisible, onVisible, onHidden, enabled]);

  return {
    isVisible: isIntersecting,
    hasBeenVisible,
    observe,
    shouldLoad: enabled ? hasBeenVisible : true,
  };
}
