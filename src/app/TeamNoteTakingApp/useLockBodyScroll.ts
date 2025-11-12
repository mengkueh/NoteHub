import { useEffect } from "react";

export function useLockBodyScroll(lock: boolean = true) {
  useEffect(() => {
    if (!lock) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lock]);
}

