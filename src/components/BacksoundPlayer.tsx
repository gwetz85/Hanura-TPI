"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function BacksoundPlayer() {
  const { data: session } = useSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Browsers block autoplay until the user interacts with the page
    const handleInteract = () => {
      setHasInteracted(true);
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("keydown", handleInteract);
    };
    window.addEventListener("click", handleInteract);
    window.addEventListener("keydown", handleInteract);
    
    return () => {
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("keydown", handleInteract);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    
    const role = session.user?.role as string | undefined;
    // Only play for DPC and PAC roles
    if (!role || (role !== "DPC" && !role.startsWith("PAC"))) return;

    if (hasInteracted && audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Auto-play failed, might need more user interaction:", err);
      });
    }
  }, [session, hasInteracted, isPlaying]);

  if (!session) return null;
  
  const role = session.user?.role as string | undefined;
  if (!role || (role !== "DPC" && !role.startsWith("PAC"))) return null;

  return (
    <audio ref={audioRef} loop>
      <source src={`/api/backsound?t=${new Date().getTime()}`} type="audio/mpeg" />
    </audio>
  );
}
