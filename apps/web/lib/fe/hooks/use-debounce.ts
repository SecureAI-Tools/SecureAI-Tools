import { useState, useEffect } from "react";

export default function useDebounce<T>(value: T, delayMS: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMS);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMS]);

  return debouncedValue;
}
