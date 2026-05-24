"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./kta.module.css";

export default function KtaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", nik: "", address: "", phone: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate phone number if photo is uploaded, and validate its format if entered
    if (photoFile && !form.phone.trim()) {
      setError("⚠️ Nomor Handphone wajib diisi jika Anda mengupload foto KTP.");
      setLoading(false);
      return;
    }

    if (form.phone.trim()) {
      const phoneRegex = /^081[0-9]{7,11}$/;
      if (!phoneRegex.test(form.phone.trim())) {
        setError("⚠️ Format nomor handphone tidak valid. Harus diawali dengan '081' dan berisi 10 hingga 14 digit angka (contoh: 08123456789).");
        setLoading(false);
        return;
      }
    }

    try {
      let photoKtpUrl = "";
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!upRes.ok) throw new Error("Gagal upload foto KTP");
        const upData = await upRes.json();
        photoKtpUrl = upData.url;
      }

      const res = await fetch("/api/kta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone.trim(), photoKtpUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal mengirim pengajuan");
      }
      setSuccess("✅ Pengajuan KTA berhasil dikirim! Menunggu persetujuan DPC.");
      setForm({ name: "", nik: "", address: "", phone: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
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
        <h1 className={styles.title}>Formulir Pengajuan KTA</h1>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nama Lengkap *</label>
            <input className={styles.input} name="name" value={form.name} onChange={handleChange} placeholder="Masukkan nama lengkap" required />
          </div>
          <div className={styles.inputGroup}>
            <label>NIK (No. KTP) *</label>
            <input className={styles.input} name="nik" value={form.nik} onChange={handleChange} placeholder="16 digit NIK" required maxLength={16} />
          </div>
          <div className={styles.inputGroup}>
            <label>Alamat</label>
            <input className={styles.input} name="address" value={form.address} onChange={handleChange} placeholder="Alamat lengkap" />
          </div>
          <div className={styles.inputGroup}>
            <label>Nomor Handphone {photoFile ? "*" : ""}</label>
            <input
              className={styles.input}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              required={!!photoFile}
              pattern="^081[0-9]{7,11}$"
              title="Nomor handphone harus diawali dengan '081' dan memiliki panjang 10-14 digit angka"
            />
            <span style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem", display: "block" }}>
              Format wajib: diawali 081 (contoh: 08123456789). Wajib diisi jika mengupload foto KTP.
            </span>
          </div>
          <div className={styles.inputGroup}>
            <label>Foto KTP</label>
            <label className={styles.fileLabel} htmlFor="photoFile">
              📷 {photoFile ? photoFile.name : "Pilih foto KTP..."}
            </label>
            <input id="photoFile" type="file" accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
            {photoPreview && <img src={photoPreview} alt="Preview KTP" className={styles.preview} />}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Pengajuan KTA"}
          </button>
        </form>
      </div>
    </div>
  );
}
