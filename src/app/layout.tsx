import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DPC HANURA Tanjungpinang – Portal Internal",
  description: "Sistem komunikasi dan manajemen data internal DPC & PAC HANURA Tanjungpinang",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body style={{ position: "relative" }}>
        {/* Transparent logo fixed to top‑right */}
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
          <Image src="/logo.png" alt="Hanura TPI" width={80} height={80} priority />
        </div>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}