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
                  <th>TTL</th>
                  <th>Status Kawin</th>
                  <th>Pekerjaan</th>
                  <th>Alamat</th>
                  <th>Kelurahan</th>
                  <th>Kecamatan</th>
                  <th style={{ textAlign: "center" }}>Verifikasi</th>
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
                    <td>{m.birthPlace ? m.birthPlace + ", " : ""}{m.birthDate || "-"}</td>
                    <td>{m.maritalStatus || "-"}</td>
                    <td>{m.jobStatus || "-"}</td>
                    <td>{m.address || "-"}</td>
                    <td>{m.village || "-"}</td>
                    <td>{m.subDistrict || "-"}</td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <input 
                        type="checkbox" 
                        checked={m.isVerified}
                        onChange={() => toggleVerification(m.id, m.isVerified)}
                        style={{ cursor: "pointer", width: "1.2rem", height: "1.2rem", accentColor: "#D4AF37" }}
                        title="Verifikasi kebenaran data ini"
                      />
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
