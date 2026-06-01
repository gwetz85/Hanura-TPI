"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../crud.module.css";

interface Submission {
  id: string;
  name: string;
  nik: string;
  address: string;
  phone: string;
  photoKtpUrl?: string | null;
  status: string;
  pac: { id: string; name: string; role: string };
  createdAt: Date | string;
}

interface Pac {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Verifikasi",
  APPROVED: "Sudah Terverifikasi",
  REJECTED: "Ditolak"
};

export default function KtaManagerClient({ submissions: initial, pacs }: { submissions: Submission[]; pacs: Pac[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPacId, setSelectedPacId] = useState<string>("ALL");

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setLoading(id);
    try {
      const res = await fetch(`/api/dpc/kta/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch {
      alert("Gagal mengubah status.");
    } finally {
      setLoading(null);
    }
  };

  const filteredSubmissions = selectedPacId === "ALL"
    ? submissions
    : submissions.filter(s => s.pac.id === selectedPacId);

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <Link href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</Link>
        
        <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>Kelola Pengajuan KTA</h1>
            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>
              {filteredSubmissions.length} pengajuan ditampilkan ({submissions.length} total)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.85rem", color: "#d0d0d0", fontWeight: "600" }}>Filter PAC:</label>
            <select
              value={selectedPacId}
              onChange={e => setSelectedPacId(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                color: "#f0f0f0",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <option value="ALL" style={{ background: "#15151a" }}>Semua PAC</option>
              {pacs.map(p => (
                <option key={p.id} value={p.id} style={{ background: "#15151a" }}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className={styles.empty}>Tidak ada pengajuan KTA untuk filter ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PAC</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>Alamat</th>
                  <th>No. HP</th>
                  <th style={{ minWidth: "130px" }}>Foto KTP</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(s => (
                  <tr key={s.id}>
                    <td>{s.pac.name}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.nik}</td>
                    <td>{s.address || "-"}</td>
                    <td>
                      {s.phone ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <a href={`tel:${s.phone}`} style={{ color: "#f0f0f0", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            📞 {s.phone}
                          </a>
                          <a 
                            href={`https://wa.me/${s.phone.replace(/^0/, "62")}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "#2ed573", fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: 500 }}
                          >
                            💬 Hubungi WhatsApp
                          </a>
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      {s.photoKtpUrl ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <a 
                            href={s.photoKtpUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.photoLink}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                          >
                            👁️ Lihat Foto
                          </a>
                          <a 
                            href={s.photoKtpUrl} 
                            download={`KTP_${s.name.replace(/\s+/g, "_")}.jpg`}
                            style={{ 
                              background: "rgba(212, 175, 55, 0.15)", 
                              color: "#D4AF37", 
                              border: "1px solid rgba(212, 175, 55, 0.3)", 
                              padding: "0.25rem 0.5rem", 
                              borderRadius: "6px", 
                              fontSize: "0.75rem", 
                              textDecoration: "none", 
                              textAlign: "center",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.25rem",
                              fontWeight: 600,
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212, 175, 55, 0.3)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)"}
                          >
                            📥 Unduh KTP
                          </a>
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[s.status]}`}>{STATUS_LABELS[s.status] || s.status}</span>
                    </td>
                    <td>
                      {s.status === "PENDING" && (
                        <>
                          <button
                            className={styles.btnApprove}
                            disabled={loading === s.id}
                            onClick={() => updateStatus(s.id, "APPROVED")}
                          >
                            ✓ Verifikasi
                          </button>
                          <button
                            className={styles.btnReject}
                            disabled={loading === s.id}
                            onClick={() => updateStatus(s.id, "REJECTED")}
                          >
                            ✕ Tolak
                          </button>
                        </>
                      )}
                      {s.status !== "PENDING" && <span style={{ color: "#606060", fontSize: "0.8rem" }}>—</span>}
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
