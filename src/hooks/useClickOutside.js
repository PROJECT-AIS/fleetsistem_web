/**
 * Custom hook to handle clicks outside of a referenced element
 * Used for closing dropdowns, modals, etc.
 */
import { useEffect, useRef } from 'react';

export function useClickOutside(callback, isActive = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, isActive]);

  return ref;
}

export default useClickOutside;
