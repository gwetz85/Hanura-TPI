"use client";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../crud.module.css";

export default function BackgroundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session || session.user?.role !== "ADMIN") {
    router.push("/dpc");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.type.startsWith("image/")) {
        setMessage({ text: "File harus berupa gambar (JPG/PNG)", type: "error" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage(null);
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: "Silakan pilih file gambar terlebih dahulu", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch("/api/upload-background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData: base64Data }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessage({ text: data.message || "Background berhasil diupload!", type: "success" });
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          // Force reload to apply background immediately
          setTimeout(() => window.location.reload(), 1500);
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
        <div>
          <Link href="/dpc" className={styles.backLink}>← Kembali ke Dashboard</Link>
          <h1 className={styles.title}>🖼️ Pengaturan Background</h1>
          <p className={styles.subtitle}>Upload gambar untuk dijadikan background di seluruh aplikasi (DPC & PAC).</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.uploadSection}>
          <label className={styles.label}>Pilih File Gambar (JPG / PNG)</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          
          {file && (
            <p className={styles.fileInfo}>
              File terpilih: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className={styles.uploadBtn}
          >
            {loading ? "Mengupload..." : "Upload & Terapkan"}
          </button>

          {message && (
            <div className={message.type === "error" ? styles.errorMsg : styles.successMsg}>
              {message.text}
            </div>
          )}
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#D4AF37" }}>Background Saat Ini</h3>
          <div style={{
            width: "100%",
            height: "200px",
            borderRadius: "12px",
            backgroundImage: `url(/api/background?t=${new Date().getTime()})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
          </div>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>
            Gambar di atas adalah preview background saat ini. Tampilan asli di aplikasi akan dibuat transparan agar tidak menutupi tulisan.
          </p>
        </div>
      </div>
    </div>
  );
}
