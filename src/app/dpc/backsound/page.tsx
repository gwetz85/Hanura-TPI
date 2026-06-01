"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "../crud.module.css";

export default function BacksoundPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!session) return null;
  if (session.user?.role !== "ADMIN") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 style={{ color: "red" }}>Akses Ditolak</h2>
          <p>Hanya Admin yang dapat mengakses halaman ini.</p>
          <Link href="/dpc" className={styles.btnSecondary} style={{ display: "inline-block", marginTop: "1rem" }}>
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ text: "Silakan pilih file MP3 terlebih dahulu", type: "error" });
      return;
    }

    if (file.type !== "audio/mpeg") {
      setMessage({ text: "File harus berformat MP3", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/upload-backsound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData: base64Data }),
        });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Backsound berhasil diupload!", type: "success" });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("backsound-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setMessage({ text: data.error || "Gagal mengupload file", type: "error" });
      }
      } catch (err) {
        setMessage({ text: "Terjadi kesalahan sistem", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setMessage({ text: "Gagal membaca file", type: "error" });
      setLoading(false);
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎵 Upload Backsound</h1>
        <p className={styles.subtitle}>Upload file MP3 untuk dimainkan otomatis saat DPC/PAC login.</p>
      </div>

      <div className={styles.card} style={{ maxWidth: "600px", margin: "0 auto" }}>
        <form onSubmit={handleUpload}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih File MP3</label>
            <input 
              id="backsound-file"
              type="file" 
              accept="audio/mpeg" 
              onChange={handleFileChange}
              className={styles.input}
              disabled={loading}
            />
          </div>

          {message && (
            <div 
              style={{
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                backgroundColor: message.type === "success" ? "rgba(46, 213, 115, 0.1)" : "rgba(255, 71, 87, 0.1)",
                color: message.type === "success" ? "#2ed573" : "#ff4757",
                border: `1px solid ${message.type === "success" ? "#2ed573" : "#ff4757"}`,
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <Link href="/dpc" className={styles.btnSecondary} style={{ textDecoration: "none", flex: 1, textAlign: "center" }}>
              Kembali
            </Link>
            <button 
              type="submit" 
              className={styles.btnPrimary} 
              disabled={!file || loading}
              style={{ flex: 1 }}
            >
              {loading ? "Mengupload..." : "Upload Backsound"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#D4AF37" }}>Test Play Backsound (Saat Ini)</h3>
          <audio controls src={`/api/backsound?t=${new Date().getTime()}`} style={{ width: "100%" }}>
            Browser Anda tidak mendukung elemen audio.
          </audio>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>
            Catatan: Jika file belum pernah diupload, player ini tidak akan bisa dimainkan. Jika backsound tidak terganti, harap melakukan hard-refresh browser (Ctrl + F5).
          </p>
        </div>
      </div>
    </div>
  );
}
