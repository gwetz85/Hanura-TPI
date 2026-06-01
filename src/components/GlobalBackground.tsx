"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalBackground() {
  const pathname = usePathname();
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only apply background on /dpc or /pac routes
    if (pathname?.startsWith("/dpc") || pathname?.startsWith("/pac") || pathname?.startsWith("/kepengurusan")) {
      setBgUrl(`/api/background?t=${new Date().getTime()}`);
    } else {
      setBgUrl(null);
    }
  }, [pathname]);

  if (!bgUrl) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1, // Keep it behind everything
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        opacity: 0.15, // Low opacity so it doesn't disrupt the UI
        pointerEvents: "none",
      }}
    />
  );
}
