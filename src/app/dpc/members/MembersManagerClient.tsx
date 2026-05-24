"use client";
import { useState } from "react";
import styles from "../crud.module.css";
import { useRouter } from "next/navigation";

interface Pac { id: string; name: string; role: string; }
interface Member {
  id: string;
  name: string;
  nik: string | null;
  address: string | null;
  phone: string | null;
  pac: { name: string; role: string };
  createdAt: Date | string;
}

export default function MembersManagerClient({ members, pacs }: { members: Member[], pacs: Pac[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pacId: "",
    name: "",
    nik: "",
    address: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacId || !formData.name) return;
    setLoading(true);

    try {
      const res = await fetch("/api/dpc/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menambah anggota");
      setFormData({ pacId: "", name: "", nik: "", address: "", phone: "" });
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        <div className={styles.header}>
          <h1 className={styles.title}>Daftar Anggota</h1>
          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{members.length} anggota</span>
        </div>

        <div style={{ marginBottom: "2rem", background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#f0f0f0" }}>Tambah Anggota Baru</h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Pilih PAC</label>
              <select 
                value={formData.pacId} 
                onChange={(e) => setFormData({ ...formData, pacId: e.target.value })}
                className={styles.replyInput}
                required
              >
                <option value="">-- Pilih PAC --</option>
                {pacs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nama Lengkap</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.replyInput}
                required
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "#aaa" }}>NIK (Opsional)</label>
              <input 
                type="text" 
                value={formData.nik} 
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className={styles.replyInput}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", color: "#aaa" }}>No. HP (Opsional)</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={styles.replyInput}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Alamat (Opsional)</label>
              <textarea 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={styles.replyInput}
                style={{ minHeight: "80px" }}
              />
            </div>
            
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className={styles.btnSave} disabled={loading || !formData.pacId || !formData.name}>
                {loading ? "Menyimpan..." : "Tambah Anggota"}
              </button>
            </div>
          </form>
        </div>

        {members.length === 0 ? (
          <p className={styles.empty}>Belum ada data anggota terdaftar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PAC</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>No. HP</th>
                  <th>Alamat</th>
                  <th>Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td><span className={styles.badge} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>{m.pac.name}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.nik || "-"}</td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.address || "-"}</td>
                    <td>{new Date(m.createdAt).toLocaleDateString("id-ID")}</td>
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
