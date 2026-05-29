"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../dpc/crud.module.css";

interface BoardMember {
  id: string;
  level: string;
  position: string;
  name: string;
  ktaNumber: string | null;
  nik: string | null;
  nomorSk: string | null;
  photoUrl: string | null;
}

const LEVELS = [
  { key: "DPD", label: "DPD" },
  { key: "DPC", label: "DPC" },
  { key: "PAC BARAT", label: "PAC Tanjungpinang Barat" },
  { key: "PAC KOTA", label: "PAC Tanjungpinang Kota" },
  { key: "PAC TIMUR", label: "PAC Tanjungpinang Timur" },
  { key: "PAC BUKIT BESTARI", label: "PAC Bukit Bestari" },
];

export default function BoardClient({ boardMembers: _initialMembers, userRole }: { boardMembers: BoardMember[], userRole: string }) {
  const isDpc = userRole === "DPC";

  const [skUrls, setSkUrls] = useState<Record<string, string | null>>({});
  const [uploadingSk, setUploadingSk] = useState<string | null>(null);
  const [showSkModal, setShowSkModal] = useState(false);
  const [skPreviewUrl, setSkPreviewUrl] = useState<string | null>(null);
  const [skPreviewLevel, setSkPreviewLevel] = useState<string>("");

  const fetchAllSk = useCallback(async () => {
    const results: Record<string, string | null> = {};
    await Promise.all(
      LEVELS.map(async (l) => {
        try {
          const res = await fetch(`/api/board/sk?level=${encodeURIComponent(l.key)}`);
          if (res.ok) {
            const data = await res.json();
            results[l.key] = data.fileUrl || null;
          }
        } catch { results[l.key] = null; }
      })
    );
    setSkUrls(results);
  }, []);

  useEffect(() => { fetchAllSk(); }, [fetchAllSk]);

  const handleUploadSk = async (level: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSk(level);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Gagal mengupload file");
      const data = await res.json();
      const resSk = await fetch("/api/board/sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, fileUrl: data.url })
      });
      if (!resSk.ok) throw new Error("Gagal menyimpan data SK");
      setSkUrls(prev => ({ ...prev, [level]: data.url }));
    } catch (err: any) { alert(err.message); }
    finally { setUploadingSk(null); e.target.value = ''; }
  };

  const handleDeleteSk = async (level: string) => {
    if (!confirm(`Yakin ingin hapus SK untuk ${level}?`)) return;
    try {
      const res = await fetch("/api/board/sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, fileUrl: "" })
      });
      if (!res.ok) throw new Error("Gagal menghapus SK");
      setSkUrls(prev => ({ ...prev, [level]: null }));
    } catch (err: any) { alert(err.message); }
  };

  const handlePreviewSk = (level: string) => {
    const url = skUrls[level];
    if (!url) return;
    try {
      if (url.startsWith("data:")) {
        const arr = url.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        setSkPreviewUrl(URL.createObjectURL(blob));
      } else {
        setSkPreviewUrl(url);
      }
      setSkPreviewLevel(level);
      setShowSkModal(true);
    } catch { alert("Gagal membuka file SK."); }
  };

  const closeSkModal = () => {
    setShowSkModal(false);
    if (skPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(skPreviewUrl);
    setSkPreviewUrl(null);
  };

  return (
    <div className={styles.container} style={{ alignItems: "flex-start" }}>
      <div className={styles.glassCard} style={{ maxWidth: "960px", margin: "0 auto" }}>

        <a href={isDpc ? "/dpc" : "/pac"} className={styles.backLink} style={{ fontSize: "1rem" }}>← Kembali ke Dashboard</a>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title} style={{ fontSize: "1.85rem" }}>Struktur Kepengurusan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "1.05rem", marginTop: "0.5rem" }}>SK Kepengurusan DPD, DPC, dan PAC.</p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className={styles.table} style={{ fontSize: "1rem" }}>
            <thead>
              <tr>
                <th style={{ width: "60px", textAlign: "center", fontSize: "1rem", padding: "1rem" }}>No</th>
                <th style={{ fontSize: "1rem", padding: "1rem" }}>Tingkatan</th>
                <th style={{ textAlign: "center", fontSize: "1rem", padding: "1rem" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl, idx) => {
                const hasSk = !!skUrls[lvl.key];
                const isUploading = uploadingSk === lvl.key;

                return (
                  <tr key={lvl.key}>
                    <td style={{ textAlign: "center", color: "#888", fontWeight: 600, fontSize: "1rem", padding: "1rem" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, fontSize: "1.1rem", padding: "1rem" }}>{lvl.label}</td>
                    <td style={{ textAlign: "center", padding: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
                        {hasSk ? (
                          <button onClick={() => handlePreviewSk(lvl.key)} className={styles.btnApprove} style={{ fontSize: "0.95rem", border: "none", cursor: "pointer", padding: "0.5rem 1.1rem", borderRadius: "10px", fontWeight: 600 }}>
                            📄 Lihat SK
                          </button>
                        ) : (
                          <span style={{ color: "#555", fontSize: "0.95rem", padding: "0.5rem 1.1rem" }}>Belum ada SK</span>
                        )}
                        {isDpc && (
                          <>
                            <label className={styles.btnSave} style={{ cursor: "pointer", fontSize: "0.95rem", padding: "0.5rem 1.1rem", borderRadius: "10px" }}>
                              {isUploading ? "⏳ Uploading..." : "📤 Upload SK"}
                              <input type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => handleUploadSk(lvl.key, e)} disabled={isUploading} />
                            </label>
                            {hasSk && (
                              <button onClick={() => handleDeleteSk(lvl.key)} className={styles.btnReject} style={{ fontSize: "0.95rem", padding: "0.5rem 1.1rem", borderRadius: "10px" }}>
                                🗑️ Hapus SK
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal SK Preview */}
        {showSkModal && skPreviewUrl && (
          <div className={styles.modalOverlay} onClick={closeSkModal} style={{ zIndex: 999999, padding: "1.5rem" }}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: "1100px", height: "90vh", display: "flex", flexDirection: "column", padding: "1.5rem 2rem", maxHeight: "calc(100vh - 3rem)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem", flexShrink: 0 }}>
                <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "1.4rem" }}>Preview SK — {LEVELS.find(l => l.key === skPreviewLevel)?.label}</h2>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <a href={skPreviewUrl} download={`SK_${skPreviewLevel}`} className={styles.btnApprove} style={{ textDecoration: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>⬇️ Download</a>
                  <button onClick={closeSkModal} className={styles.btnReject} style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>✖ Tutup</button>
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "10px", overflow: "hidden", minHeight: 0 }}>
                <iframe src={skPreviewUrl} width="100%" height="100%" style={{ border: "none" }} title="Preview SK" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
