"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError("Username atau password salah");
      } else {
        const from = searchParams.get("from");
        if (from) {
          router.push(from);
        } else {
          // The middleware will handle redirection if we go to /
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>
      
      <main className={styles.main}>
        <div className={`glass-card ${styles.loginCard}`}>
          <div className={styles.header}>
            <h1 className="text-gradient">HANURA</h1>
            <p>Portal Komunikasi Internal DPC & PAC</p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-glass"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-glass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>

            <button type="submit" className={`btn-gold ${styles.submitBtn}`} disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
          
          <div className={styles.footer}>
            <p>Jika lupa password, hubungi admin DPC.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
