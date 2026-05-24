"use client";
import { signOut } from "next-auth/react";
import styles from "./dpc.module.css";

interface PacUser { id: string; name: string; role: string; }
interface Props {
  userName: string;
  pendingKta: number;
  pendingActivity: number;
  pacUsers: PacUser[];
  memberCountMap: Record<string, number>;
  totalMembers: number;
}

export default function DpcDashboardClient({ userName, pendingKta, pendingActivity, pacUsers, memberCountMap, totalMembers }: Props) {
  const menus = [
    { icon: "🪪", title: "Kelola Pengajuan KTA", desc: "Setujui atau tolak pengajuan KTA dari semua PAC.", href: "/dpc/kta" },
    { icon: "📋", title: "Kelola Usulan Kegiatan", desc: "Balas usulan kegiatan dari semua PAC.", href: "/dpc/activity" },
    { icon: "👥", title: "Upload Daftar Anggota", desc: "Upload daftar anggota resmi untuk masing-masing PAC.", href: "/dpc/members" },
    { icon: "⚙️", title: "Kelola Akun PAC", desc: "Tambah, ubah, atau hapus akun PAC.", href: "/dpc/accounts" },
  ];

  // Color palette for PAC cards
  const pacColors = [
    { gradient: "linear-gradient(135deg, #667eea, #764ba2)", glow: "rgba(102,126,234,0.25)", accent: "#667eea" },
    { gradient: "linear-gradient(135deg, #f093fb, #f5576c)", glow: "rgba(240,147,251,0.25)", accent: "#f093fb" },
    { gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", glow: "rgba(79,172,254,0.25)", accent: "#4facfe" },
    { gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", glow: "rgba(67,233,123,0.25)", accent: "#43e97b" },
    { gradient: "linear-gradient(135deg, #fa709a, #fee140)", glow: "rgba(250,112,154,0.25)", accent: "#fa709a" },
    { gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", glow: "rgba(161,140,209,0.25)", accent: "#a18cd1" },
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
        <div className={styles.statCard}>
          <div className={styles.statNum}>{totalMembers}</div>
          <div className={styles.statLabel}>Total Anggota</div>
        </div>
      </div>

      {/* Anggota per PAC Section */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📊 Anggota per PAC</h2>
        <span className={styles.sectionSub}>{pacUsers.length} PAC terdaftar</span>
      </div>
      <div className={styles.pacGrid}>
        {pacUsers.map((pac, idx) => {
          const color = pacColors[idx % pacColors.length];
          const count = memberCountMap[pac.id] || 0;
          return (
            <div key={pac.id} className={styles.pacCard} style={{ boxShadow: `0 8px 30px ${color.glow}` }}>
              <div className={styles.pacCardAccent} style={{ background: color.gradient }} />
              <div className={styles.pacCardBody}>
                <div className={styles.pacCardIcon} style={{ background: color.gradient }}>
                  👥
                </div>
                <div className={styles.pacCardInfo}>
                  <div className={styles.pacCardName}>{pac.name}</div>
                  <div className={styles.pacCardRole}>{pac.role}</div>
                </div>
                <div className={styles.pacCardCount} style={{ color: color.accent }}>
                  {count}
                </div>
                <div className={styles.pacCardCountLabel}>anggota</div>
              </div>
            </div>
          );
        })}
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
