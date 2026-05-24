"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./members.module.css";

interface Member { id: string; name: string; nik?: string; address?: string; phone?: string; }

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

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/pac" className={styles.backLink}>← Kembali ke Dashboard</a>
        <h1 className={styles.title}>Daftar Anggota PAC</h1>
        {loading ? <p>Memuat data...</p> : members.length === 0 ? (
          <p className={styles.empty}>Belum ada data anggota. DPC akan mengupload daftar anggota Anda.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Nama</th><th>NIK</th><th>Alamat</th><th>Telepon</th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.nik ?? "-"}</td>
                  <td>{m.address ?? "-"}</td>
                  <td>{m.phone ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
