"use client";
import { useState } from "react";
import styles from "../crud.module.css";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  date?: Date | string | null;
  time?: string | null;
  location?: string | null;
  activityType?: string | null;
  reply?: string | null;
  status: string;
  pac: { name: string; role: string };
  comments: { id: string }[];
  createdAt: Date | string;
}

export default function ActivityManagerClient({ suggestions: initial }: { suggestions: Suggestion[] }) {
  const [suggestions] = useState(initial);
  const router = useRouter();

  const getPacLabel = (role: string) => {
    const map: Record<string, string> = {
      PAC_BARAT: "PAC Barat",
      PAC_TIMUR: "PAC Timur",
      PAC_KOTA: "PAC Kota",
      PAC_BUKIT_BESTARI: "PAC Bukit Bestari",
    };
    return map[role] || role;
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Kelola Usulan Kegiatan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Klik usulan untuk melihat detail dan berdiskusi dengan PAC.
            </p>
          </div>
          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{suggestions.length} usulan</span>
        </div>

        {suggestions.length === 0 ? (
          <p className={styles.empty}>Belum ada usulan kegiatan masuk.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {suggestions.map(s => (
              <div
                key={s.id}
                onClick={() => router.push(`/activity/${s.id}`)}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "1.25rem 1.5rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(212,175,55,0.07)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.25)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span>
                    <span style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600 }}>
                      {getPacLabel(s.pac.role)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", marginBottom: "0.35rem" }}>{s.title}</div>
                  <div style={{ color: "#606060", fontSize: "0.82rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                    {s.date && <span>📅 {new Date(s.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    {s.location && <span>📍 {s.location}</span>}
                    {s.activityType && <span>🏷️ {s.activityType}</span>}
                    {!s.date && !s.location && !s.activityType && (
                      <span style={{ color: "#404040" }}>{s.description.substring(0, 80)}...</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
                  {s.comments.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#a0a0a0", fontSize: "0.8rem" }}>
                      <span>💬</span>
                      <span>{s.comments.length}</span>
                    </div>
                  )}
                  <span style={{ color: "#404040", fontSize: "0.75rem" }}>
                    {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </span>
                  <span style={{ color: "#D4AF37", fontSize: "0.8rem" }}>Lihat →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
