/**
 * Custom hook to handle escape key press
 * Used for closing modals, dropdowns, etc.
 */
import { useEffect } from 'react';

export function useEscapeKey(callback, isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        callback();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [callback, isActive]);
}

export default useEscapeKey;
