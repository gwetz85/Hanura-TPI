"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "../dpc/crud.module.css";
import { useRouter } from "next/navigation";

interface BoardMember {
  id: string;
  level: string;
  position: string;
  name: string;
  ktaNumber: string | null;
  nik: string | null;
  nomorSk: string | null;
  photoUrl: string | null;
}

const LEVELS = [
  { key: "DPD", label: "DPD", icon: "🏛️", color: "#D4AF37" },
  { key: "DPC", label: "DPC", icon: "🏢", color: "#D4AF37" },
  { key: "PAC BARAT", label: "PAC Tanjungpinang Barat", icon: "👥", color: "#2ed573" },
  { key: "PAC KOTA", label: "PAC Tanjungpinang Kota", icon: "👥", color: "#6c5ce7" },
  { key: "PAC TIMUR", label: "PAC Tanjungpinang Timur", icon: "👥", color: "#00cec9" },
  { key: "PAC BUKIT BESTARI", label: "PAC Bukit Bestari", icon: "👥", color: "#e17055" },
];

export default function BoardClient({ boardMembers: initialMembers, userRole }: { boardMembers: BoardMember[], userRole: string }) {
  const router = useRouter();
  const isDpc = userRole === "DPC";
  const [members, setMembers] = useState<BoardMember[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // SK states per level
  const [skUrls, setSkUrls] = useState<Record<string, string | null>>({});
  const [uploadingSk, setUploadingSk] = useState<string | null>(null);

  // SK Preview modal
  const [showSkModal, setShowSkModal] = useState(false);
  const [skPreviewUrl, setSkPreviewUrl] = useState<string | null>(null);
  const [skPreviewLevel, setSkPreviewLevel] = useState<string>("");

  const initialForm = { level: "", position: "", name: "", ktaNumber: "", nik: "", nomorSk: "", photoUrl: "" };
  const [formData, setFormData] = useState(initialForm);

  // Fetch all SK on mount
  const fetchAllSk = useCallback(async () => {
    const results: Record<string, string | null> = {};
    await Promise.all(
      LEVELS.map(async (l) => {
        try {
          const res = await fetch(`/api/board/sk?level=${encodeURIComponent(l.key)}`);
          if (res.ok) {
            const data = await res.json();
            results[l.key] = data.fileUrl || null;
          }
        } catch { results[l.key] = null; }
      })
    );
    setSkUrls(results);
  }, []);

  useEffect(() => { fetchAllSk(); }, [fetchAllSk]);

  const openAddModal = (level: string) => {
    setEditId(null);
    setFormData({ ...initialForm, level });
    setShowModal(true);
  };

  const openEditModal = (member: BoardMember) => {
    setEditId(member.id);
    setFormData({
      level: member.level,
      position: member.position,
      name: member.name,
      ktaNumber: member.ktaNumber || "",
      nik: member.nik || "",
      nomorSk: member.nomorSk || "",
      photoUrl: member.photoUrl || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data pengurus ini?")) return;
    try {
      const res = await fetch(`/api/board/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      setMembers(members.filter(m => m.id !== id));
      router.refresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAll = async (level: string) => {
    if (!confirm(`Yakin ingin HAPUS SEMUA DATA pengurus ${level}?\nTindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/board/all?level=${encodeURIComponent(level)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus semua data");
      setMembers(members.filter(m => m.level !== level));
      router.refresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        const res = await fetch(`/api/board/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("Gagal mengupdate data");
        const updated = await res.json();
        setMembers(members.map(m => m.id === editId ? updated : m));
      } else {
        const res = await fetch("/api/board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error("Gagal menambah data");
        const created = await res.json();
        setMembers([...members, created]);
      }
      setShowModal(false);
      router.refresh();
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleUploadSk = async (level: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSk(level);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Gagal mengupload file");
      const data = await res.json();

      const resSk = await fetch("/api/board/sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, fileUrl: data.url })
      });
      if (!resSk.ok) throw new Error("Gagal menyimpan data SK");

      setSkUrls(prev => ({ ...prev, [level]: data.url }));
    } catch (err: any) { alert(err.message); }
    finally {
      setUploadingSk(null);
      e.target.value = '';
    }
  };

  const handlePreviewSk = (level: string) => {
    const url = skUrls[level];
    if (!url) return;
    try {
      if (url.startsWith("data:")) {
        const arr = url.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        setSkPreviewUrl(blobUrl);
      } else {
        setSkPreviewUrl(url);
      }
      setSkPreviewLevel(level);
      setShowSkModal(true);
    } catch (err) { alert("Gagal membuka file SK."); }
  };

  const closeSkModal = () => {
    setShowSkModal(false);
    if (skPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(skPreviewUrl);
    setSkPreviewUrl(null);
    setSkPreviewLevel("");
  };

  const showActions = (level: string) => isDpc && !level.startsWith("PAC");

  return (
    <div className={styles.container} style={{ alignItems: "flex-start" }}>
      <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <a href={isDpc ? "/dpc" : "/pac"} className={styles.backLink}>← Kembali ke Dashboard</a>

        <div className={styles.header} style={{ marginBottom: "2rem" }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: "2rem" }}>Struktur Kepengurusan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Daftar lengkap susunan pengurus DPD, DPC, dan PAC.
            </p>
          </div>
        </div>

        {/* All sections */}
        {LEVELS.map((lvl) => {
          const levelMembers = members.filter(m => m.level === lvl.key);
          const hasSk = !!skUrls[lvl.key];
          const isUploading = uploadingSk === lvl.key;

          return (
            <div
              key={lvl.key}
              className={styles.glassCard}
              style={{
                maxWidth: "100%",
                marginBottom: "1.5rem",
                borderLeft: `3px solid ${lvl.color}`,
              }}
            >
              {/* Section header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{lvl.icon}</span>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: lvl.color }}>{lvl.label}</h2>
                  <span style={{
                    background: `${lvl.color}20`,
                    color: lvl.color,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.6rem",
                    borderRadius: "12px",
                    border: `1px solid ${lvl.color}40`,
                  }}>{levelMembers.length} Pengurus</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {hasSk && (
                    <button onClick={() => handlePreviewSk(lvl.key)} className={styles.btnApprove} style={{ border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                      📄 Lihat SK
                    </button>
                  )}
                  {isDpc && (
                    <>
                      <label className={styles.btnSave} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", fontSize: "0.8rem" }}>
                        {isUploading ? "⏳..." : "📤 Upload SK"}
                        <input type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => handleUploadSk(lvl.key, e)} disabled={isUploading} />
                      </label>
                      <button className={styles.btnSave} onClick={() => openAddModal(lvl.key)} style={{ fontSize: "0.8rem" }}>+ Tambah</button>
                      {levelMembers.length > 0 && (
                        <button className={styles.btnReject} onClick={() => handleDeleteAll(lvl.key)} style={{ fontSize: "0.8rem" }}>
                          🗑️ Hapus Semua
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Table */}
              {levelMembers.length === 0 ? (
                <p style={{ textAlign: "center", padding: "1.5rem", color: "#606060", fontSize: "0.875rem" }}>
                  Belum ada data kepengurusan terdaftar.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>No</th>
                        <th>Nama</th>
                        <th>Jabatan</th>
                        <th>Nomor SK</th>
                        {showActions(lvl.key) && <th style={{ width: "140px" }}>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {levelMembers.map((member, idx) => (
                        <tr key={member.id}>
                          <td style={{ color: "#808080" }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{member.name}</td>
                          <td style={{ color: lvl.color }}>{member.position}</td>
                          <td>{member.nomorSk || "-"}</td>
                          {showActions(lvl.key) && (
                            <td>
                              <button onClick={() => openEditModal(member)} className={styles.btnApprove} style={{ marginRight: "0.4rem" }}>Edit</button>
                              <button onClick={() => handleDelete(member.id)} className={styles.btnReject}>Hapus</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* Modal for Add/Edit */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2>{editId ? "Edit Data Pengurus" : "Tambah Pengurus Baru"}</h2>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <label className={styles.formLabel}>Tingkatan Kepengurusan *</label>
                  <select required className={`${styles.formInput} ${styles.formSelect}`} value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                    <option value="" disabled>Pilih Tingkatan</option>
                    <option value="DPD">DPD</option>
                    <option value="DPC">DPC</option>
                    <optgroup label="PAC">
                      <option value="PAC BARAT">PAC Tanjungpinang Barat</option>
                      <option value="PAC KOTA">PAC Tanjungpinang Kota</option>
                      <option value="PAC TIMUR">PAC Tanjungpinang Timur</option>
                      <option value="PAC BUKIT BESTARI">PAC Bukit Bestari</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Jabatan *</label>
                  <input required className={styles.formInput} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Contoh: Ketua Umum, Sekretaris" />
                </div>
                <div>
                  <label className={styles.formLabel}>Nama Lengkap *</label>
                  <input required className={styles.formInput} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Masukkan nama lengkap" />
                </div>
                <div>
                  <label className={styles.formLabel}>Nomor SK</label>
                  <input className={styles.formInput} value={formData.nomorSk} onChange={e => setFormData({...formData, nomorSk: e.target.value})} placeholder="Opsional" />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" className={styles.btnReject} onClick={() => setShowModal(false)} style={{ flex: 1 }}>Batal</button>
                  <button type="submit" className={styles.btnSave} disabled={loading} style={{ flex: 1 }}>{loading ? "Menyimpan..." : "Simpan"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for SK Preview */}
        {showSkModal && skPreviewUrl && (
          <div className={styles.modalOverlay} onClick={closeSkModal} style={{ zIndex: 1000, padding: "2rem" }}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: "1000px", height: "85vh", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, color: "#D4AF37" }}>Preview SK — {LEVELS.find(l => l.key === skPreviewLevel)?.label || skPreviewLevel}</h2>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <a href={skPreviewUrl} download={`SK_${skPreviewLevel}`} className={styles.btnApprove} style={{ textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "bold" }}>⬇️ Download</a>
                  <button onClick={closeSkModal} className={styles.btnReject} style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "bold" }}>✖ Tutup</button>
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden" }}>
                <iframe src={skPreviewUrl} width="100%" height="100%" style={{ border: "none" }} title="Preview SK" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
