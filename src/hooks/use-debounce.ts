"use client";

import { useEffect, useState } from "react";

/** Trả về `value` sau khi nó ngừng thay đổi trong `delay` ms. */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
