"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./members.module.css";

interface Member {
  id: string;
  noUrut: number | null;
  nomorKta: string | null;
  name: string;
  nik: string | null;
  phone: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  jobStatus: string | null;
  address: string | null;
  village: string | null;
  subDistrict: string | null;
  isVerified: boolean;
}

export default function MembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMember, setViewMember] = useState<Member | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/members")
        .then(r => r.json())
        .then(data => setMembers(data))
        .finally(() => setLoading(false));
    }
  }, [status]);

  const toggleVerification = async (mId: string, currentStatus: boolean) => {
    try {
      setMembers(prev => prev.map(m => m.id === mId ? { ...m, isVerified: !currentStatus } : m));
      
      const res = await fetch("/api/pac/members/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: mId, isVerified: !currentStatus })
      });
      
      if (!res.ok) throw new Error("Gagal menyimpan status verifikasi");
    } catch (err: any) {
      alert(err.message);
      // Revert on error
      setMembers(prev => prev.map(m => m.id === mId ? { ...m, isVerified: currentStatus } : m));
    }
  };

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/pac" className={styles.backLink}>← Kembali ke Dashboard</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 className={styles.title}>Daftar Anggota PAC</h1>
          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>Total: {members.length} anggota</span>
        </div>
        
        {loading ? <p>Memuat data...</p> : members.length === 0 ? (
          <p className={styles.empty}>Belum ada data anggota. DPC akan mengupload daftar anggota Anda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table} style={{ whiteSpace: "nowrap" }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>No KTA</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>No HP</th>
                  <th>JK</th>
                  <th style={{ textAlign: "center" }}>Verifikasi</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{m.noUrut || idx + 1}</td>
                    <td>{m.nomorKta || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.nik || "-"}</td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.gender || "-"}</td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <input 
                        type="checkbox" 
                        checked={m.isVerified}
                        onChange={() => toggleVerification(m.id, m.isVerified)}
                        style={{ cursor: "pointer", width: "1.2rem", height: "1.2rem", accentColor: "#D4AF37" }}
                        title="Verifikasi kebenaran data ini"
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button 
                        onClick={() => setViewMember(m)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(100,149,237,0.3)",
                          background: "rgba(100,149,237,0.15)",
                          color: "#6495ed",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          transition: "all 0.2s ease"
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View Detail */}
      {viewMember && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)",
            padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "600px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#f0f0f0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
              Detail Anggota: {viewMember.name}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", fontSize: "0.95rem", color: "#ddd" }}>
              <div style={{ color: "#aaa" }}>Nomor Urut</div><div>: {viewMember.noUrut || "-"}</div>
              <div style={{ color: "#aaa" }}>Nomor KTA</div><div>: {viewMember.nomorKta || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Lengkap</div><div style={{ fontWeight: 600, color: "#fff" }}>: {viewMember.name}</div>
              <div style={{ color: "#aaa" }}>NIK</div><div>: {viewMember.nik || "-"}</div>
              <div style={{ color: "#aaa" }}>Kontak / No HP</div><div>: {viewMember.phone || "-"}</div>
              <div style={{ color: "#aaa" }}>Jenis Kelamin</div><div>: {viewMember.gender || "-"}</div>
              <div style={{ color: "#aaa" }}>Tempat, Tgl Lahir</div><div>: {viewMember.birthPlace ? viewMember.birthPlace + ", " : ""}{viewMember.birthDate || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Perkawinan</div><div>: {viewMember.maritalStatus || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Pekerjaan</div><div>: {viewMember.jobStatus || "-"}</div>
              <div style={{ color: "#aaa" }}>Alamat Lengkap</div><div>: {viewMember.address || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Kelurahan</div><div>: {viewMember.village || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Kecamatan</div><div>: {viewMember.subDistrict || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Verifikasi</div>
              <div>: 
                <span style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, background: viewMember.isVerified ? "rgba(46,213,115,0.15)" : "rgba(255,71,87,0.15)", color: viewMember.isVerified ? "#2ed573" : "#ff4757" }}>
                  {viewMember.isVerified ? "Terverifikasi" : "Belum"}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "2rem", textAlign: "right" }}>
              <button 
                onClick={() => setViewMember(null)} 
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #D4AF37, #b8962e)",
                  color: "#1a1a1a",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s ease"
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
