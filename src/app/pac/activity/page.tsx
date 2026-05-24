"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./activity.module.css";

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setSuccess("✅ Usulan kegiatan berhasil dikirim! Menunggu balasan dari DPC.");
      setForm({ title: "", description: "", date: "" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/pac" className={styles.backLink}>← Kembali ke Dashboard</a>
        <h1 className={styles.title}>Formulir Usulan Kegiatan</h1>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Judul Kegiatan *</label>
            <input className={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="Contoh: Rapat Koordinasi PAC" required />
          </div>
          <div className={styles.inputGroup}>
            <label>Deskripsi *</label>
            <textarea className={styles.textarea} name="description" value={form.description} onChange={handleChange} placeholder="Jelaskan rencana kegiatan secara detail..." required />
          </div>
          <div className={styles.inputGroup}>
            <label>Tanggal Rencana (opsional)</label>
            <input className={styles.input} type="date" name="date" value={form.date} onChange={handleChange} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Usulan Kegiatan"}
          </button>
        </form>
      </div>
    </div>
  );
}
