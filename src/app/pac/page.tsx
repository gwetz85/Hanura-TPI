"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./pac.module.css";

export default function PacDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <div className={styles.container}><p>Loading...</p></div>;
  if (!session) { router.push("/login"); return null; }

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
      <div className={styles.header}>
        <p className={styles.greeting}>Selamat datang,</p>
        <h1 className={styles.title}>{session.user?.name ?? "PAC"}</h1>
      </div>

      <div className={styles.infoBar}>
        🗓 DPC HANURA Tanjungpinang &nbsp;|&nbsp; {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>

      <div className={styles.grid} style={{ marginTop: "2rem" }}>
        {menus.map(m => (
          <a key={m.href} href={m.href} className={styles.card}>
            <div className={styles.cardIcon}>{m.icon}</div>
            <div className={styles.cardTitle}>{m.title}</div>
            <div className={styles.cardDesc}>{m.desc}</div>
            <div className={styles.cardArrow}>Buka →</div>
          </a>
        ))}
      </div>

      <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
        Keluar
      </button>
    </div>
  );
}
