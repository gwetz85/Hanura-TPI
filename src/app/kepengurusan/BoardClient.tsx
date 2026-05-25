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
  photoUrl: string | null;
}

export default function BoardClient({ boardMembers: initialMembers, userRole }: { boardMembers: BoardMember[], userRole: string }) {
  const router = useRouter();
  const isDpc = userRole === "DPC";
  const [members, setMembers] = useState<BoardMember[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // New state for navigation
  const [viewState, setViewState] = useState<"SELECT_MAIN" | "SELECT_PAC" | "VIEW_DATA">("SELECT_MAIN");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const initialForm = { level: "", position: "", name: "", ktaNumber: "", nik: "", photoUrl: "" };
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

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleMainSelect = (level: string) => {
    if (level === "PAC") {
      setViewState("SELECT_PAC");
    } else {
      setSelectedLevel(level);
      setViewState("VIEW_DATA");
    }
  };

  const handlePacSelect = (pacName: string) => {
    setSelectedLevel(pacName);
    setViewState("VIEW_DATA");
  };

  // Filter members by selected level
  const displayedMembers = selectedLevel 
    ? members.filter(m => m.level === selectedLevel) 
    : [];

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
          {isDpc && viewState === "VIEW_DATA" && (
            <button className={styles.btnSave} onClick={openAddModal}>+ TAMBAH PENGURUS</button>
          )}
        </div>

        {/* Level Selectors */}
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

        {/* Data View */}
        {viewState === "VIEW_DATA" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1rem" }}>
            {displayedMembers.length === 0 ? (
              <p className={styles.empty}>Belum ada data kepengurusan terdaftar untuk {selectedLevel}.</p>
            ) : (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ background: "#D4AF37", padding: "0.75rem 1.25rem", color: "#000", fontWeight: "bold", fontSize: "1.1rem" }}>
                  {selectedLevel}
                </div>
                <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                  {displayedMembers.map(member => (
                    <div key={member.id} style={{ 
                      display: "flex", gap: "1rem", background: "rgba(255,255,255,0.03)", 
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "1rem",
                      position: "relative"
                    }}>
                      <div style={{ 
                        width: "80px", height: "80px", borderRadius: "10px", backgroundColor: "#333", 
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 
                      }}>
                        {member.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.photoUrl} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#D4AF37" }}>{getInitials(member.name)}</span>
                        )}
                      </div>
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: "4.5rem", minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: "bold", 
                          color: "#D4AF37", 
                          fontSize: "0.9rem", 
                          marginBottom: "0.4rem",
                          lineHeight: "1.3"
                        }}>
                          {member.position}
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "80px 10px 1fr", gap: "0.25rem", fontSize: "0.8rem", color: "#e0e0e0" }}>
                          <span>Nama</span><span>:</span><span style={{ fontWeight: 600, wordBreak: "break-word" }}>{member.name}</span>
                          <span>No. Anggota</span><span>:</span><span style={{ wordBreak: "break-all" }}>{member.ktaNumber || "-"}</span>
                          <span>NIK</span><span>:</span><span>{member.nik || "-"}</span>
                        </div>
                      </div>

                      {isDpc && (
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.3rem", flexDirection: "column" }}>
                          <button onClick={() => openEditModal(member)} style={{ background: "rgba(46,213,115,0.15)", border: "1px solid rgba(46,213,115,0.3)", color: "#2ed573", cursor: "pointer", borderRadius: "4px", padding: "0.25rem 0.6rem", fontSize: "0.75rem", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background="rgba(46,213,115,0.3)"} onMouseLeave={(e) => e.currentTarget.style.background="rgba(46,213,115,0.15)"}>Edit</button>
                          <button onClick={() => handleDelete(member.id)} style={{ background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.3)", color: "#ff4757", cursor: "pointer", borderRadius: "4px", padding: "0.25rem 0.6rem", fontSize: "0.75rem", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background="rgba(255,71,87,0.3)"} onMouseLeave={(e) => e.currentTarget.style.background="rgba(255,71,87,0.15)"}>Hapus</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
                    <option value="PAC BARAT">PAC BARAT</option>
                    <option value="PAC KOTA">PAC KOTA</option>
                    <option value="PAC TIMUR">PAC TIMUR</option>
                    <option value="PAC BUKIT BESTARI">PAC BUKIT BESTARI</option>
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
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabel}>No. Anggota / KTA</label>
                    <input className={styles.formInput} value={formData.ktaNumber} onChange={e => setFormData({...formData, ktaNumber: e.target.value})} placeholder="Opsional" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabel}>NIK</label>
                    <input className={styles.formInput} value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} placeholder="Opsional" />
                  </div>
                </div>
                <div>
                  <label className={styles.formLabel}>URL Foto (Opsional)</label>
                  <input className={styles.formInput} value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} placeholder="https://..." />
                  <span style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem", display: "block" }}>Jika dikosongkan, akan otomatis menampilkan inisial nama.</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" className={styles.btnReject} onClick={() => setShowModal(false)} style={{ flex: 1 }}>Batal</button>
                  <button type="submit" className={styles.btnSave} disabled={loading} style={{ flex: 1 }}>{loading ? "Menyimpan..." : "Simpan"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
