"use client";
import { useState } from "react";
import styles from "../crud.module.css";

interface Submission {
  id: string;
  name: string;
  nik: string;
  address: string;
  phone: string;
  photoKtpUrl?: string | null;
  status: string;
  pac: { name: string; role: string };
  createdAt: Date | string;
}

export default function KtaManagerClient({ submissions: initial }: { submissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        <div className={styles.header}>
          <h1 className={styles.title}>Kelola Pengajuan KTA</h1>
          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{submissions.length} pengajuan</span>
        </div>

        {submissions.length === 0 ? (
          <p className={styles.empty}>Belum ada pengajuan KTA masuk.</p>
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
                  <th>Foto KTP</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td>{s.pac.name}</td>
                    <td>{s.name}</td>
                    <td>{s.nik}</td>
                    <td>{s.address}</td>
                    <td>{s.phone}</td>
                    <td>
                      {s.photoKtpUrl ? (
                        <a href={s.photoKtpUrl} target="_blank" rel="noopener noreferrer" className={styles.photoLink}>
                          Lihat Foto
                        </a>
                      ) : "-"}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span>
                    </td>
                    <td>
                      {s.status === "PENDING" && (
                        <>
                          <button
                            className={styles.btnApprove}
                            disabled={loading === s.id}
                            onClick={() => updateStatus(s.id, "APPROVED")}
                          >
                            ✓ Setujui
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
