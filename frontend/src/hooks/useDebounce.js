import { useEffect, useState } from 'react';

/** Delays updating the returned value until `value` has been stable for `delayMs`. */
export function useDebounce(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
