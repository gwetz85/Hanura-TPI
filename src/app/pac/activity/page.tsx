"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./activity.module.css";

interface Suggestion {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  activityType: string | null;
  status: string;
  comments: { id: string }[];
  createdAt: string;
  isReadByPac: boolean;
}

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", activityType: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }

    fetch("/api/activity")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSuggestions(data);
        setLoadingSuggestions(false);
      })
      .catch(() => setLoadingSuggestions(false));
  }, [session, status, router]);

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal mengirim usulan");
      }
      const newSuggestion = await res.json();
      setSuccess("✅ Usulan kegiatan berhasil dikirim! Menunggu balasan dari DPC.");
      setForm({ title: "", description: "", date: "", time: "", location: "", activityType: "" });
      setSuggestions(prev => [{ ...newSuggestion, comments: [] }, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = ["Rapat Koordinasi", "Sosialisasi", "Musyawarah", "Bakti Sosial", "Pelatihan", "Kampanye", "Lainnya"];

  return (
    <div className={styles.container}>
      <div className={styles.glassCard} style={{ maxWidth: "900px" }}>
        <a href="/pac" className={styles.backLink}>← Kembali ke Dashboard</a>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>Usulan Kegiatan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Buat usulan dan diskusikan kegiatan bersama DPC.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? "rgba(255,71,87,0.2)" : "linear-gradient(135deg, #D4AF37, #aa8c2c)",
              color: showForm ? "#ff4757" : "#000",
              border: showForm ? "1px solid rgba(255,71,87,0.3)" : "none",
              padding: "0.6rem 1.25rem",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {showForm ? "✕ Tutup Form" : "+ Buat Usulan Baru"}
          </button>
        </div>

        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}

        {/* FORM */}
        {showForm && (
          <div style={{
            background: "rgba(212,175,55,0.04)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            animation: "fadeIn 0.2s ease"
          }}>
            <h2 style={{ color: "#D4AF37", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>📋 Form Usulan Kegiatan</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Judul Kegiatan *</label>
                <input className={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="Contoh: Rapat Koordinasi PAC Barat" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Deskripsi / Rancangan Kegiatan *</label>
                <textarea className={styles.textarea} name="description" value={form.description} onChange={handleChange} placeholder="Jelaskan rancangan kegiatan secara detail..." required rows={4} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.inputGroup}>
                  <label>Tanggal Kegiatan</label>
                  <input className={styles.input} type="date" name="date" value={form.date} onChange={handleChange} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Waktu Kegiatan</label>
                  <input className={styles.input} type="time" name="time" value={form.time} onChange={handleChange} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.inputGroup}>
                  <label>Lokasi Kegiatan</label>
                  <input className={styles.input} name="location" value={form.location} onChange={handleChange} placeholder="Contoh: Kantor DPC HANURA" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Jenis Kegiatan</label>
                  <select className={styles.input} name="activityType" value={form.activityType} onChange={handleChange} style={{ appearance: "none" }}>
                    <option value="">Pilih Jenis</option>
                    {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Usulan Kegiatan"}
              </button>
            </form>
          </div>
        )}

        {/* LIST USULAN */}
        {loadingSuggestions ? (
          <p style={{ textAlign: "center", color: "#606060", padding: "2rem" }}>Memuat data...</p>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#404040" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
            <p>Belum ada usulan kegiatan. Buat usulan pertama Anda!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ color: "#a0a0a0", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Riwayat Usulan ({suggestions.length})
            </h3>
            {suggestions.map(s => (
              <div
                key={s.id}
                onClick={() => router.push(`/activity/${s.id}`)}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(212,175,55,0.06)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.2)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Unread indicator left border */}
                {s.isReadByPac === false && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#ff4757" }} />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "0.15rem 0.6rem",
                      borderRadius: "12px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: s.status === "REPLIED" ? "rgba(100,149,237,0.15)" : "rgba(255,196,0,0.15)",
                      color: s.status === "REPLIED" ? "#6495ed" : "#ffc400",
                      border: `1px solid ${s.status === "REPLIED" ? "rgba(100,149,237,0.3)" : "rgba(255,196,0,0.3)"}`
                    }}>
                      {s.status === "REPLIED" ? "✓ Dibalas" : "⏳ Menunggu"}
                    </span>
                    {s.activityType && (
                      <span style={{ color: "#D4AF37", fontSize: "0.75rem" }}>🏷️ {s.activityType}</span>
                    )}
                    {s.isReadByPac === false && (
                      <span style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, border: "1px solid rgba(255,71,87,0.3)" }}>
                        Pesan Baru
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: "#e0e0e0", fontSize: "0.95rem", marginBottom: "0.3rem" }}>{s.title}</div>
                  <div style={{ display: "flex", gap: "1rem", color: "#505050", fontSize: "0.78rem", flexWrap: "wrap" }}>
                    {s.date && <span>📅 {new Date(s.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                    {s.location && <span>📍 {s.location}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                  {s.comments.length > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#a0a0a0", fontSize: "0.78rem" }}>
                      💬 {s.comments.length}
                    </span>
                  )}
                  <span style={{ color: "#404040", fontSize: "0.73rem" }}>
                    {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </span>
                  <span style={{ color: "#D4AF37", fontSize: "0.78rem" }}>Detail →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
