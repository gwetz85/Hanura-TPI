"use client";
import { usePathname } from "next/navigation";

export default function GlobalLogo() {
  const pathname = usePathname();

  // Sembunyikan logo di halaman login
  if (pathname === "/login") return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Logo Hanura TPI"
      className="app-logo"
    />
  );
}
