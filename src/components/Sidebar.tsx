"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./sidebar.module.css";

interface SidebarProps {
  role: string;
  name: string;
}

export default function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname();

  const dpcLinks = [
    { name: "Dashboard", path: "/dpc" },
    { name: "Pengajuan KTA", path: "/dpc/kta" },
    { name: "Usulan Kegiatan", path: "/dpc/kegiatan" },
    { name: "Daftar Anggota", path: "/dpc/anggota" },
  ];

  const pacLinks = [
    { name: "Dashboard", path: "/pac" },
    { name: "Pengajuan KTA", path: "/pac/kta" },
    { name: "Usulan Kegiatan", path: "/pac/kegiatan" },
    { name: "Daftar Anggota", path: "/pac/anggota" },
  ];

  const links = role === "DPC" ? dpcLinks : pacLinks;

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.brand}>
        <h2 className="text-gradient">HANURA</h2>
        <p>{name}</p>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.path || pathname.startsWith(`${link.path}/`);
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`${styles.navLink} ${isActive && pathname === link.path ? styles.active : ""}`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutBtn}>
          Keluar
        </button>
      </div>
    </aside>
  );
}
