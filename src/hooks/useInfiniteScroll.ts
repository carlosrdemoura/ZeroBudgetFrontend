import { useEffect, useRef } from 'react';

interface Options {
  onLoadMore: () => void;
  hasMore: boolean;
  isFetching: boolean;
  rootMargin?: string;
}

export function useInfiniteScroll<T extends HTMLElement>({
  onLoadMore,
  hasMore,
  isFetching,
  rootMargin = '200px',
}: Options) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching) onLoadMore();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetching, onLoadMore, rootMargin]);

  return ref;
}
