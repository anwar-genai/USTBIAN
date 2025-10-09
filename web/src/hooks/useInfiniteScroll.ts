import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  threshold?: number; // Distance from bottom (in pixels) to trigger load
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 500,
}: UseInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    // Check if we're near the bottom
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    const distanceFromBottom = pageHeight - scrollPosition;

    console.log('Scroll check:', { 
      loading, 
      hasMore, 
      distanceFromBottom, 
      threshold,
      shouldLoad: !loading && hasMore && distanceFromBottom < threshold 
    });

    // Don't trigger if already loading or no more items
    if (loading || !hasMore) {
      console.log('Skipping load:', loading ? 'already loading' : 'no more items');
      return;
    }

    // Trigger load when within threshold pixels from bottom
    if (distanceFromBottom < threshold) {
      console.log('🚀 Triggering onLoadMore!');
      onLoadMore();
    }
  }, [loading, hasMore, threshold, onLoadMore]);

  useEffect(() => {
    // Debounce scroll events for performance
    let timeoutId: NodeJS.Timeout;
    
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll);
    
    // Also check immediately on mount/update in case content is short
    handleScroll();

    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return { observerTarget };
}

