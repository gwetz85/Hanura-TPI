"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import sharedStyles from "../crud.module.css";
import localStyles from "./accounts.module.css";

interface PacUser {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string | Date;
}

const ROLE_LABELS: Record<string, string> = {
  DPC: "DPC Hanura TPI",
  PAC_BARAT: "PAC Tanjungpinang Barat",
  PAC_KOTA: "PAC Tanjungpinang Kota",
  PAC_TIMUR: "PAC Tanjungpinang Timur",
  PAC_BUKIT_BESTARI: "PAC Bukit Bestari",
};

export default function AccountsManagerClient({ pacUsers: initial }: { pacUsers: PacUser[] }) {
  const [accounts, setAccounts] = useState<PacUser[]>(initial);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PacUser | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PAC_BARAT");

  // Status states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const handleOpenAddForm = () => {
    setEditingAccount(null);
    setName("");
    setUsername("");
    setPassword("");
    setRole("PAC_BARAT");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (account: PacUser) => {
    setEditingAccount(account);
    setName(account.name);
    setUsername(account.username);
    setPassword(""); // Leave blank unless changing
    setRole(account.role);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
    setName("");
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim()) {
      showToast("Nama dan Username wajib diisi", "error");
      return;
    }

    if (!editingAccount && !password) {
      showToast("Password wajib diisi untuk akun baru", "error");
      return;
    }

    setLoading(true);

    try {
      if (editingAccount) {
        // Edit flow
        const res = await fetch(`/api/dpc/accounts/${editingAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, password, role }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui akun");

        setAccounts(prev => prev.map(acc => (acc.id === editingAccount.id ? data : acc)));
        showToast("Akun PAC berhasil diperbarui");
        handleCloseForm();
      } else {
        // Create flow
        const res = await fetch("/api/dpc/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, password, role }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat akun");

        setAccounts(prev => [...prev, data]);
        showToast("Akun PAC baru berhasil dibuat");
        handleCloseForm();
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, accountName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun PAC "${accountName}"?\n\nPERINGATAN: Semua data KTA, usulan kegiatan, dan anggota yang di-upload oleh PAC ini akan terhapus secara permanen!`
    );

    if (!confirmed) return;

    setActionLoading(id);

    try {
      const res = await fetch(`/api/dpc/accounts/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus akun");

      setAccounts(prev => prev.filter(acc => acc.id !== id));
      showToast("Akun PAC berhasil dihapus");
      if (editingAccount?.id === id) {
        handleCloseForm();
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.glassCard}>
        <a href="/dpc" className={sharedStyles.backLink}>
          ← Kembali ke Dashboard DPC
        </a>
        <div className={sharedStyles.header}>
          <div>
            <h1 className={sharedStyles.title}>Kelola Akun</h1>
            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>
              {accounts.length} Akun Terdaftar
            </span>
          </div>
          {!isFormOpen && (
            <button className={localStyles.btnAddAccount} onClick={handleOpenAddForm}>
              <span>➕</span> Tambah Akun
            </button>
          )}
        </div>

        <div className={`${localStyles.layoutGrid} ${isFormOpen ? localStyles.withSidebar : ""}`}>
          {/* Left Table Section */}
          <div className={localStyles.tableSection}>
            {accounts.length === 0 ? (
              <p className={sharedStyles.empty}>Belum ada akun PAC yang terdaftar.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className={sharedStyles.table}>
                  <thead>
                    <tr>
                      <th>Nama Akun</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Dibuat Pada</th>
                      <th style={{ width: "160px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td style={{ fontWeight: 600 }}>{acc.name}</td>
                        <td>
                          <code style={{ background: "rgba(255,255,255,0.08)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>
                            {acc.username}
                          </code>
                        </td>
                        <td>
                          <span style={{ color: "#D4AF37", fontSize: "0.825rem", fontWeight: 500 }}>
                            {ROLE_LABELS[acc.role] || acc.role}
                          </span>
                        </td>
                        <td style={{ color: "#a0a0a0" }}>
                          {new Date(acc.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className={localStyles.actionCell}>
                            <button
                              className={localStyles.btnEdit}
                              onClick={() => handleOpenEditForm(acc)}
                              disabled={actionLoading !== null}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className={localStyles.btnDelete}
                              onClick={() => handleDelete(acc.id, acc.name)}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === acc.id ? "Menghapus..." : "🗑️ Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar Form Section */}
          {isFormOpen && (
            <div className={localStyles.formCard}>
              <div className={localStyles.formHeader}>
                <h3 className={localStyles.formTitle}>
                  {editingAccount ? "Edit Akun" : "Tambah Akun"}
                </h3>
                <button className={localStyles.btnClose} onClick={handleCloseForm} title="Tutup Form">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={localStyles.formGroup}>
                  <label className={localStyles.label}>Nama Akun</label>
                  <input
                    type="text"
                    className={localStyles.input}
                    placeholder="Contoh: PAC Tanjungpinang Barat"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={localStyles.formGroup}>
                  <label className={localStyles.label}>Username</label>
                  <input
                    type="text"
                    className={localStyles.input}
                    placeholder="Contoh: pac_barat"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    title="Username hanya boleh berisi huruf, angka, dan underscore (_)"
                  />
                  <span className={localStyles.helpText}>
                    Hanya huruf, angka, dan underscore (_). Digunakan untuk login.
                  </span>
                </div>

                <div className={localStyles.formGroup}>
                  <label className={localStyles.label}>Role Wilayah / Posisi</label>
                  <select
                    className={localStyles.select}
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="DPC">DPC (Pengurus Cabang)</option>
                    <option value="PAC_BARAT">PAC Tanjungpinang Barat</option>
                    <option value="PAC_KOTA">PAC Tanjungpinang Kota</option>
                    <option value="PAC_TIMUR">PAC Tanjungpinang Timur</option>
                    <option value="PAC_BUKIT_BESTARI">PAC Bukit Bestari</option>
                  </select>
                </div>

                <div className={localStyles.formGroup}>
                  <label className={localStyles.label}>
                    {editingAccount ? "Password Baru (Opsional)" : "Password"}
                  </label>
                  <input
                    type="password"
                    className={localStyles.input}
                    placeholder={editingAccount ? "Biarkan kosong jika tidak diubah" : "Masukkan password login"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!editingAccount}
                    minLength={6}
                  />
                  {editingAccount && (
                    <span className={localStyles.helpText}>
                      Biarkan kosong jika Anda tidak ingin mengubah password akun ini.
                    </span>
                  )}
                </div>

                <div className={localStyles.btnActions}>
                  <button type="button" className={localStyles.btnCancel} onClick={handleCloseForm}>
                    Batal
                  </button>
                  <button type="submit" className={localStyles.btnSubmit} disabled={loading}>
                    {loading ? "Menyimpan..." : editingAccount ? "💾 Simpan Perubahan" : "➕ SIMPAN"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`${localStyles.toast} ${
            toast.type === "success" ? localStyles.toastSuccess : localStyles.toastError
          }`}
        >
          <span style={{ fontSize: "1.2rem" }}>{toast.type === "success" ? "✅" : "❌"}</span>
          <span className={localStyles.toastText}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
