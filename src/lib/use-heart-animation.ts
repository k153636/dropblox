import { useState, useCallback } from "react";

export function useHeartAnimation() {
  const [animating, setAnimating] = useState(false);

  const trigger = useCallback(() => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
  }, []);

  return { animating, trigger, className: animating ? "heart-pop" : "" };
}
