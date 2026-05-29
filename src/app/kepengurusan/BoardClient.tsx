"use client";
import { useState } from "react";
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

export default function BoardClient({ boardMembers: initialMembers, userRole }: { boardMembers: BoardMember[], userRole: string }) {
  const router = useRouter();
  const isDpc = userRole === "DPC";
  const [members, setMembers] = useState<BoardMember[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [viewState, setViewState] = useState<"SELECT_MAIN" | "SELECT_PAC" | "VIEW_DATA">("SELECT_MAIN");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const [skUrl, setSkUrl] = useState<string | null>(null);
  const [uploadingSk, setUploadingSk] = useState(false);
  const [showSkModal, setShowSkModal] = useState(false);
  const [skPreviewUrl, setSkPreviewUrl] = useState<string | null>(null);

  const initialForm = { level: "", position: "", name: "", ktaNumber: "", nik: "", nomorSk: "", photoUrl: "" };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditId(null);
    setFormData({ ...initialForm, level: selectedLevel || "" });
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedLevel) return;
    if (!confirm(`Yakin ingin HAPUS SEMUA DATA pengurus untuk ${selectedLevel}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/board/all?level=${selectedLevel}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus semua data");
      setMembers(members.filter(m => m.level !== selectedLevel));
      router.refresh();
      alert(`Semua data pengurus ${selectedLevel} berhasil dihapus.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadSk = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedLevel) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSk(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal mengupload file");
      const data = await res.json();
      
      const resSk = await fetch("/api/board/sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: selectedLevel, fileUrl: data.url })
      });
      if (!resSk.ok) throw new Error("Gagal menyimpan data SK");
      
      setSkUrl(data.url);
      alert("SK berhasil diupload!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingSk(false);
      e.target.value = '';
    }
  };

  const fetchSk = async (level: string) => {
    try {
      const res = await fetch(`/api/board/sk?level=${level}`);
      if (res.ok) {
        const data = await res.json();
        setSkUrl(data.fileUrl || null);
      }
    } catch (err) {
      setSkUrl(null);
    }
  };

  const handlePreviewSk = () => {
    if (!skUrl) return;
    try {
      if (skUrl.startsWith("data:")) {
        const arr = skUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        setSkPreviewUrl(url);
        setShowSkModal(true);
      } else {
        setSkPreviewUrl(skUrl);
        setShowSkModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuka file. Pastikan file valid.");
    }
  };

  const closeSkModal = () => {
    setShowSkModal(false);
    if (skPreviewUrl && skPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(skPreviewUrl);
    }
    setSkPreviewUrl(null);
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMainSelect = (level: string) => {
    if (level === "PAC") {
      setViewState("SELECT_PAC");
    } else {
      setSelectedLevel(level);
      setViewState("VIEW_DATA");
      fetchSk(level);
    }
  };

  const handlePacSelect = (pacName: string) => {
    setSelectedLevel(pacName);
    setViewState("VIEW_DATA");
    fetchSk(pacName);
  };

  const displayedMembers = selectedLevel 
    ? members.filter(m => m.level === selectedLevel) 
    : [];

  const showActions = isDpc && !selectedLevel?.startsWith("PAC");

  return (
    <div className={styles.container}>
      <div className={styles.glassCard} style={{ maxWidth: "1200px" }}>
        
        {viewState === "SELECT_MAIN" ? (
          <a href={isDpc ? "/dpc" : "/pac"} className={styles.backLink}>
            ← Kembali ke Dashboard
          </a>
        ) : viewState === "SELECT_PAC" ? (
          <button onClick={() => setViewState("SELECT_MAIN")} className={styles.backLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← Kembali ke Pilihan Utama
          </button>
        ) : (
          <button 
            onClick={() => {
              if (selectedLevel?.startsWith("PAC ")) setViewState("SELECT_PAC");
              else setViewState("SELECT_MAIN");
            }} 
            className={styles.backLink} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ← Kembali ke Pilihan Tingkatan
          </button>
        )}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Struktur Kepengurusan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {viewState === "SELECT_MAIN" && "Pilih tingkatan kepengurusan untuk melihat daftar pengurus."}
              {viewState === "SELECT_PAC" && "Pilih PAC untuk melihat pengurus."}
              {viewState === "VIEW_DATA" && `Daftar susunan pengurus ${selectedLevel}.`}
            </p>
          </div>
          {isDpc && viewState === "SELECT_MAIN" && (
            <button className={styles.btnSave} onClick={openAddModal}>+ TAMBAH PENGURUS</button>
          )}
          {viewState === "VIEW_DATA" && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              {skUrl && (
                <button onClick={handlePreviewSk} className={styles.btnApprove} style={{ textDecoration: "none", display: "inline-block", border: "none", cursor: "pointer", fontSize: "1rem" }}>
                  📄 Lihat / Download SK
                </button>
              )}
              {isDpc && (
                <>
                  <label className={styles.btnSave} style={{ cursor: "pointer", display: "inline-block" }}>
                    {uploadingSk ? "Mengupload..." : "📤 Upload SK"}
                    <input type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={handleUploadSk} disabled={uploadingSk} />
                  </label>
                  <button className={styles.btnReject} onClick={handleDeleteAll}>
                    🗑️ Hapus Semua Data
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {viewState === "SELECT_MAIN" && (
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "2rem" }}>
            {["DPD", "DPC", "PAC"].map((level) => (
              <div
                key={level}
                onClick={() => handleMainSelect(level)}
                style={{
                  flex: "1 1 300px",
                  background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "16px",
                  padding: "2rem",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,175,55,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏛️</div>
                <h3 style={{ color: "#D4AF37", margin: 0, fontSize: "1.5rem" }}>{level}</h3>
              </div>
            ))}
          </div>
        )}

        {viewState === "SELECT_PAC" && (
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "2rem" }}>
            {["PAC BARAT", "PAC KOTA", "PAC TIMUR", "PAC BUKIT BESTARI"].map((pac) => (
              <div
                key={pac}
                onClick={() => handlePacSelect(pac)}
                style={{
                  flex: "1 1 200px",
                  background: "linear-gradient(135deg, rgba(46,213,115,0.1), rgba(46,213,115,0.05))",
                  border: "1px solid rgba(46,213,115,0.3)",
                  borderRadius: "16px",
                  padding: "2rem",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(46,213,115,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👥</div>
                <h3 style={{ color: "#2ed573", margin: 0, fontSize: "1.2rem" }}>{pac}</h3>
              </div>
            ))}
          </div>
        )}

        {viewState === "VIEW_DATA" && (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            {displayedMembers.length === 0 ? (
              <p className={styles.empty}>Belum ada data kepengurusan terdaftar untuk {selectedLevel}.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th>Nomor SK</th>
                    {showActions && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedMembers.map(member => (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600 }}>{member.name}</td>
                      <td style={{ color: "#D4AF37" }}>{member.position}</td>
                      <td>{member.nomorSk || "-"}</td>
                      {showActions && (
                        <td>
                          <button onClick={() => openEditModal(member)} className={styles.btnApprove} style={{ marginRight: "0.5rem" }}>Edit</button>
                          <button onClick={() => handleDelete(member.id)} className={styles.btnReject}>Hapus</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal for CRUD */}
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
                      <option value="PAC BARAT">PAC BARAT</option>
                      <option value="PAC KOTA">PAC KOTA</option>
                      <option value="PAC TIMUR">PAC TIMUR</option>
                      <option value="PAC BUKIT BESTARI">PAC BUKIT BESTARI</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Jabatan *</label>
                  <input required className={styles.formInput} value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="Contoh: Ketua Umum, Sekretaris DPD" />
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, color: "#D4AF37" }}>Preview SK - {selectedLevel}</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <a href={skPreviewUrl} download={`SK_${selectedLevel}`} className={styles.btnApprove} style={{ textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: "bold" }}>⬇️ Download File</a>
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
