"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Module-level memory cache — survives page navigations without re-fetch
let memoryCache: string | null | "none" = null;
let fetchPromise: Promise<string | null> | null = null;

async function loadBackground(): Promise<string | null> {
  // Return memory cache immediately
  if (memoryCache === "none") return null;
  if (memoryCache) return memoryCache;

  // Check localStorage cache (survives refresh)
  try {
    const cached = localStorage.getItem("bg_cache");
    const cachedAt = localStorage.getItem("bg_cache_ts");
    // Use cache if less than 10 minutes old
    if (cached && cachedAt && Date.now() - parseInt(cachedAt) < 10 * 60 * 1000) {
      memoryCache = cached;
      return cached;
    }
  } catch {}

  // Prevent duplicate fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/background", { cache: "force-cache" })
    .then(async (res) => {
      if (!res.ok) {
        memoryCache = "none";
        fetchPromise = null;
        return null;
      }
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          memoryCache = dataUrl;
          fetchPromise = null;
          // Persist to localStorage
          try {
            localStorage.setItem("bg_cache", dataUrl);
            localStorage.setItem("bg_cache_ts", Date.now().toString());
          } catch {}
          resolve(dataUrl);
        };
        reader.readAsDataURL(blob);
      });
    })
    .catch(() => {
      memoryCache = "none";
      fetchPromise = null;
      return null;
    });

  return fetchPromise;
}

// Call when admin uploads new background to invalidate cache
export function invalidateBackgroundCache() {
  memoryCache = null;
  fetchPromise = null;
  try {
    localStorage.removeItem("bg_cache");
    localStorage.removeItem("bg_cache_ts");
  } catch {}
}

export default function GlobalBackground() {
  const pathname = usePathname();
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  const isActive =
    pathname?.startsWith("/dpc") ||
    pathname?.startsWith("/pac") ||
    pathname?.startsWith("/kepengurusan");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setBgDataUrl(null);
      setVisible(false);
      return;
    }

    // If already cached in memory, apply instantly
    if (memoryCache && memoryCache !== "none") {
      setBgDataUrl(memoryCache);
      setTimeout(() => mountedRef.current && setVisible(true), 50);
      return;
    }

    setVisible(false);
    loadBackground().then((url) => {
      if (!mountedRef.current) return;
      setBgDataUrl(url);
      if (url) setTimeout(() => mountedRef.current && setVisible(true), 50);
    });
  }, [isActive]);

  if (!bgDataUrl || !isActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        backgroundImage: `url(${bgDataUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        opacity: visible ? 0.15 : 0,
        pointerEvents: "none",
        transition: "opacity 0.6s ease",
        willChange: "opacity",
      }}
    />
  );
}
