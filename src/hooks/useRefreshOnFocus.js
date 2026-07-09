import { useEffect, useCallback } from 'react';

export function useRefreshOnFocus(refetchFn, intervalMs = 60000) {
  const handleFocus = useCallback(() => {
    refetchFn();
  }, [refetchFn]);

  useEffect(() => {
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [handleFocus]);

  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(refetchFn, intervalMs);
    return () => clearInterval(id);
  }, [refetchFn, intervalMs]);
}
