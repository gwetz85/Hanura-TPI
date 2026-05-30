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
  pac: { id: string; name: string; role: string };
  comments: { id: string }[];
  createdAt: Date | string;
  isReadByDpc: boolean;
}

interface Pac {
  id: string;
  name: string;
}

export default function ActivityManagerClient({ suggestions: initial, pacs }: { suggestions: Suggestion[], pacs: Pac[] }) {
  const [suggestions, setSuggestions] = useState(initial);
  const router = useRouter();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", activityType: "", pacId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getPacLabel = (role: string) => {
    const map: Record<string, string> = {
      PAC_BARAT: "PAC Barat",
      PAC_TIMUR: "PAC Timur",
      PAC_KOTA: "PAC Kota",
      PAC_BUKIT_BESTARI: "PAC Bukit Bestari",
    };
    return map[role] || role;
  };

  const activityTypes = ["Rapat Koordinasi", "Sosialisasi", "Musyawarah", "Bakti Sosial", "Pelatihan", "Kampanye", "Lainnya"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dpc/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal mengirim usulan");
      }
      const newSuggestion = await res.json();
      setSuccess("✅ Kegiatan berhasil dibuat dan diteruskan ke PAC tujuan.");
      setForm({ title: "", description: "", date: "", time: "", location: "", activityType: "", pacId: "" });
      setSuggestions(prev => [newSuggestion, ...prev]);
      setShowForm(false);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard} style={{ maxWidth: "900px" }}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>Kelola Usulan Kegiatan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Klik usulan untuk melihat detail, atau buat kegiatan baru untuk PAC.
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
            {showForm ? "✕ Tutup Form" : "+ Buat Kegiatan Baru"}
          </button>
        </div>

        {success && <div style={{ background: "rgba(46, 213, 115, 0.15)", color: "#2ed573", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(46, 213, 115, 0.3)" }}>{success}</div>}
        {error && <div style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff4757", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(255, 71, 87, 0.3)" }}>{error}</div>}

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
            <h2 style={{ color: "#D4AF37", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>📋 Form Kegiatan Baru</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Ditujukan Kepada (PAC) *</label>
                <select 
                  name="pacId" 
                  value={form.pacId} 
                  onChange={handleChange} 
                  required
                  style={{ width: "100%", padding: "0.8rem", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff" }}
                >
                  <option value="" style={{ background: "#1a1a2e", color: "#aaa" }}>-- Pilih PAC --</option>
                  {pacs.map(p => (
                    <option key={p.id} value={p.id} style={{ background: "#1a1a2e", color: "#fff" }}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Judul Kegiatan *</label>
                <input 
                  name="title" 
                  value={form.title} 
                  onChange={handleChange} 
                  placeholder="Contoh: Rapat Koordinasi" 
                  required 
                  style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Deskripsi / Rancangan Kegiatan *</label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  placeholder="Jelaskan rancangan kegiatan secara detail..." 
                  required 
                  rows={4} 
                  style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Tanggal Kegiatan</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Waktu Kegiatan</label>
                  <input type="time" name="time" value={form.time} onChange={handleChange} style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", colorScheme: "dark" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Lokasi Kegiatan</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="Contoh: Kantor DPC" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "0.4rem" }}>Jenis Kegiatan</label>
                  <select name="activityType" value={form.activityType} onChange={handleChange} style={{ width: "100%", padding: "0.8rem", background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#fff" }}>
                    <option value="" style={{ background: "#1a1a2e", color: "#aaa" }}>Pilih Jenis</option>
                    {activityTypes.map(t => <option key={t} value={t} style={{ background: "#1a1a2e", color: "#fff" }}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ padding: "0.8rem", marginTop: "0.5rem", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #aa8c2c)", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", transition: "opacity 0.2s", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Menyimpan..." : "Simpan & Kirim"}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ color: "#a0a0a0", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Riwayat Usulan ({suggestions.length})
          </h3>
        </div>

        {suggestions.length === 0 ? (
          <p className={styles.empty}>Belum ada usulan kegiatan.</p>
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
                  position: "relative",
                  overflow: "hidden"
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
                {/* Unread indicator left border */}
                {s.isReadByDpc === false && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#ff4757" }} />
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span>
                    <span style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", padding: "0.15rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600 }}>
                      {getPacLabel(s.pac.role)}
                    </span>
                    {s.isReadByDpc === false && (
                      <span style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700, border: "1px solid rgba(255,71,87,0.3)" }}>
                        Pesan Baru
                      </span>
                    )}
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
