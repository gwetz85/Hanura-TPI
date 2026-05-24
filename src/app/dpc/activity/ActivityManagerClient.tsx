"use client";
import { useState } from "react";
import styles from "../crud.module.css";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  date?: string | null;
  reply?: string | null;
  status: string;
  pac: { name: string; role: string };
  createdAt: Date | string;
}

export default function ActivityManagerClient({ suggestions: initial }: { suggestions: Suggestion[] }) {
  const [suggestions, setSuggestions] = useState(initial);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleReply = async (id: string) => {
    setLoading(id);
    const reply = replies[id] ?? "";
    try {
      const res = await fetch(`/api/dpc/activity/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply, status: "REPLIED" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, reply, status: "REPLIED" } : s));
    } catch {
      alert("Gagal menyimpan balasan.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        <div className={styles.header}>
          <h1 className={styles.title}>Kelola Usulan Kegiatan</h1>
          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{suggestions.length} usulan</span>
        </div>

        {suggestions.length === 0 ? (
          <p className={styles.empty}>Belum ada usulan kegiatan masuk.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PAC</th>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th style={{ minWidth: 240 }}>Balasan DPC</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <tr key={s.id}>
                    <td>{s.pac.name}</td>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td style={{ maxWidth: 200, whiteSpace: "pre-wrap" }}>{s.description}</td>
                    <td>{s.date ? new Date(s.date).toLocaleDateString("id-ID") : "-"}</td>
                    <td><span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span></td>
                    <td>
                      {s.status === "REPLIED" ? (
                        <span style={{ color: "#6495ed", fontSize: "0.875rem" }}>{s.reply}</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <textarea
                            className={styles.replyInput}
                            placeholder="Tulis balasan DPC..."
                            value={replies[s.id] ?? ""}
                            onChange={e => setReplies(prev => ({ ...prev, [s.id]: e.target.value }))}
                          />
                          <button
                            className={styles.btnSave}
                            onClick={() => handleReply(s.id)}
                            disabled={loading === s.id || !replies[s.id]}
                          >
                            {loading === s.id ? "Menyimpan..." : "Kirim Balasan"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
