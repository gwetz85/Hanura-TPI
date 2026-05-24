import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DPC HANURA Tanjungpinang – Portal Internal",
  description: "Sistem komunikasi dan manajemen data internal DPC & PAC HANURA Tanjungpinang",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <style>{`
          .app-logo {
            position: fixed;
            top: 16px;
            right: 20px;
            z-index: 9999;
            width: 96px;
            height: 96px;
            object-fit: contain;
            opacity: 0.95;
            transition: opacity 0.2s, transform 0.2s;
            filter: drop-shadow(0 4px 12px rgba(212,175,55,0.4));
            pointer-events: auto;
          }
          .app-logo:hover {
            opacity: 1;
            transform: scale(1.08);
          }
        `}</style>
      </head>
      <body>
        {/* Transparent logo fixed to top‑right on every page */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo Hanura TPI"
          className="app-logo"
        />
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}