"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./pac.module.css";

export default function PacDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/members")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMembers(data);
          }
        })
        .catch(err => console.error("Error fetching members:", err))
        .finally(() => setLoadingMembers(false));
    }
  }, [status]);

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

  const totalMembers = members.length;
  const maleMembers = members.filter(m => m.gender === "L" || m.gender === "l").length;
  const femaleMembers = members.filter(m => m.gender === "P" || m.gender === "p").length;

  const menus = [
    {
      icon: "🪪",
      title: "Pengajuan KTA",
      desc: "Ajukan kartu tanda anggota untuk calon anggota baru. Upload data diri dan foto KTP.",
      href: "/pac/kta",
    },
    {
      icon: "📋",
      title: "Usulan Kegiatan",
      desc: "Kirimkan usulan rencana kegiatan kepada DPC untuk mendapatkan persetujuan.",
      href: "/pac/activity",
    },
    {
      icon: "👥",
      title: "Daftar Anggota",
      desc: "Lihat daftar anggota resmi PAC Anda yang telah diupload oleh DPC.",
      href: "/pac/members",
    },
    {
      icon: "🏛️",
      title: "Kepengurusan",
      desc: "Struktur organisasi dan kepengurusan Partai Hanura.",
      href: "/kepengurusan",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <div className={styles.header}>
          <p className={styles.greeting}>Selamat datang,</p>
          <h1 className={styles.title}>{session.user?.name ?? "PAC"}</h1>
        </div>

        <div className={styles.actionRow}>
          <div className={styles.infoBar}>
            🗓 DPC HANURA &nbsp;|&nbsp; {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
            Keluar
          </button>
        </div>

        <div className={styles.statsCard}>
          <h3 className={styles.statsCardTitle}>📊 Data Lengkap PAC</h3>
          <div className={styles.statsMain}>
            <span className={styles.statsMainLabel}>Total Anggota</span>
            <span className={styles.statsMainValue}>
              {loadingMembers ? "..." : totalMembers}
            </span>
          </div>
          <div className={styles.statsDivider} />
          <div className={styles.statsGrid}>
            <div className={styles.statsItem}>
              <span className={styles.statsItemLabel}>Laki-Laki</span>
              <span className={`${styles.statsItemValue} ${styles.maleColor}`}>
                {loadingMembers ? "..." : maleMembers}
              </span>
            </div>
            <div className={styles.statsItem}>
              <span className={styles.statsItemLabel}>Perempuan</span>
              <span className={`${styles.statsItemValue} ${styles.femaleColor}`}>
                {loadingMembers ? "..." : femaleMembers}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.navGrid}>
          {menus.map(m => (
            <Link key={m.href} href={m.href} className={styles.card}>
              <div className={styles.cardIcon}>{m.icon}</div>
              <div className={styles.cardTitle}>{m.title}</div>
              <div className={styles.cardDesc}>{m.desc}</div>
              <div className={styles.cardArrow}>Buka →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

