"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

export default function EventCountdown() {
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    // Only fetch if authenticated
    if (!session) return;

    fetch("/api/events?activeOnly=true")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvent(data[0]); // Take the closest active event
        }
      })
      .catch(console.error);
  }, [session]);

  useEffect(() => {
    if (!event) return;

    const targetDate = new Date(event.date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(null); // Event passed or happens right now
        // Optionally, refetch to get the next event
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (!session || !event || !timeLeft) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      background: "linear-gradient(90deg, rgba(212, 175, 55, 0.9), rgba(184, 150, 46, 0.9))",
      backdropFilter: "blur(10px)",
      color: "#000",
      padding: "0.5rem 1rem",
      zIndex: 10000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      fontWeight: 600,
      fontSize: "0.9rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🗓️</span>
          <span>{event.title}</span>
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ background: "rgba(0,0,0,0.8)", color: "#D4AF37", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
            {timeLeft.days} <span style={{ fontSize: "0.7rem", color: "#ccc" }}>Hari</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.8)", color: "#D4AF37", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
            {timeLeft.hours.toString().padStart(2, '0')} <span style={{ fontSize: "0.7rem", color: "#ccc" }}>Jam</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.8)", color: "#D4AF37", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
            {timeLeft.minutes.toString().padStart(2, '0')} <span style={{ fontSize: "0.7rem", color: "#ccc" }}>Menit</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.8)", color: "#D4AF37", padding: "0.2rem 0.5rem", borderRadius: "6px", minWidth: "50px", textAlign: "center" }}>
            {timeLeft.seconds.toString().padStart(2, '0')} <span style={{ fontSize: "0.7rem", color: "#ccc" }}>Detik</span>
          </div>
        </div>
      </div>
    </div>
  );
}
