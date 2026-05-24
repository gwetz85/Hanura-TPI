"use client";
import { signOut } from "next-auth/react";
import styles from "./dpc.module.css";

interface PacUser { id: string; name: string; role: string; }
interface Props {
  userName: string;
  pendingKta: number;
  pendingActivity: number;
  pacUsers: PacUser[];
}

export default function DpcDashboardClient({ userName, pendingKta, pendingActivity, pacUsers }: Props) {
  const menus = [
    { icon: "🪪", title: "Kelola Pengajuan KTA", desc: "Setujui atau tolak pengajuan KTA dari semua PAC.", href: "/dpc/kta" },
    { icon: "📋", title: "Kelola Usulan Kegiatan", desc: "Balas usulan kegiatan dari semua PAC.", href: "/dpc/activity" },
    { icon: "👥", title: "Upload Daftar Anggota", desc: "Upload daftar anggota resmi untuk masing-masing PAC.", href: "/dpc/members" },
    { icon: "⚙️", title: "Kelola Akun PAC", desc: "Tambah, ubah, atau hapus akun PAC.", href: "/dpc/accounts" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.greeting}>Selamat datang,</p>
        <h1 className={styles.title}>{userName}</h1>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pendingKta}</div>
          <div className={styles.statLabel}>KTA Menunggu</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pendingActivity}</div>
          <div className={styles.statLabel}>Usulan Kegiatan</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pacUsers.length}</div>
          <div className={styles.statLabel}>Total PAC</div>
        </div>
      </div>

      <div className={styles.navGrid}>
        {menus.map(m => (
          <a key={m.href} href={m.href} className={styles.navCard}>
            <div className={styles.navIcon}>{m.icon}</div>
            <div className={styles.navTitle}>{m.title}</div>
            <div className={styles.navDesc}>{m.desc}</div>
            <div className={styles.navArrow}>Buka →</div>
          </a>
        ))}
      </div>

      <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
        Keluar
      </button>
    </div>
  );
}
