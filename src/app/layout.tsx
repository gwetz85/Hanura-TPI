import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import EventCountdown from "@/components/EventCountdown";
import GlobalLogo from "@/components/GlobalLogo";
import BacksoundPlayer from "@/components/BacksoundPlayer";
import prisma from "@/lib/prisma";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const events = await prisma.event.findMany({
    where: { isActive: true, date: { gt: new Date() } },
    orderBy: { date: "asc" },
    take: 1
  });
  const activeEvent = events.length > 0 ? {
    id: events[0].id,
    title: events[0].title,
    description: events[0].description,
    date: events[0].date.toISOString()
  } : null;

  return (
    <html lang="id" className={inter.variable}>
      <head>
        <style>{`
          .app-logo {
            position: fixed;
            top: 16px;
            right: 20px;
            z-index: 99999;
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
        {/* Logo tersembunyi di halaman login */}
        <GlobalLogo />
        <SessionWrapper>
          <BacksoundPlayer />
          <EventCountdown initialEvent={activeEvent} />
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}