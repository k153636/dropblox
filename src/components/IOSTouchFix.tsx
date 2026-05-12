"use client";

import { useEffect } from "react";

export default function IOSTouchFix() {
  useEffect(() => {
    document.addEventListener("touchstart", () => {}, { passive: true });
  }, []);
  return null;
}
