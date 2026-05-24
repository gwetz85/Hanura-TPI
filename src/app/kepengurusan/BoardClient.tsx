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

  const initialForm = { level: "", position: "", name: "", ktaNumber: "", nik: "", photoUrl: "" };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditId(null);
    setFormData(initialForm);
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

  // Group members by level
  const groupedMembers = members.reduce((acc, curr) => {
    if (!acc[curr.level]) acc[curr.level] = [];
    acc[curr.level].push(curr);
    return acc;
  }, {} as Record<string, BoardMember[]>);

  // Function to get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard} style={{ maxWidth: "1200px" }}>
        <a href={isDpc ? "/dpc" : "/pac"} className={styles.backLink}>
          ← Kembali ke Dashboard
        </a>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Struktur Kepengurusan</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Daftar susunan pengurus Partai Hanura Tanjungpinang.
            </p>
          </div>
          {isDpc && (
            <button className={styles.btnSave} onClick={openAddModal}>+ TAMBAH PENGURUS</button>
          )}
        </div>

        {Object.keys(groupedMembers).length === 0 ? (
          <p className={styles.empty}>Belum ada data kepengurusan terdaftar.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1rem" }}>
            {Object.keys(groupedMembers).map(level => (
              <div key={level} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ background: "#D4AF37", padding: "0.75rem 1.25rem", color: "#000", fontWeight: "bold", fontSize: "1.1rem" }}>
                  {level}
                </div>
                <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {groupedMembers[level].map(member => (
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
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontWeight: "bold", color: "#D4AF37", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{member.position}</div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "80px 10px 1fr", gap: "0.25rem", fontSize: "0.8rem", color: "#e0e0e0" }}>
                          <span>Nama</span><span>:</span><span style={{ fontWeight: 600 }}>{member.name}</span>
                          <span>No. Anggota</span><span>:</span><span>{member.ktaNumber || "-"}</span>
                          <span>NIK</span><span>:</span><span>{member.nik || "-"}</span>
                        </div>
                      </div>

                      {isDpc && (
                        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", gap: "0.25rem" }}>
                          <button onClick={() => openEditModal(member)} style={{ background: "rgba(46,213,115,0.2)", border: "none", color: "#2ed573", cursor: "pointer", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>Edit</button>
                          <button onClick={() => handleDelete(member.id)} style={{ background: "rgba(255,71,87,0.2)", border: "none", color: "#ff4757", cursor: "pointer", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>Hapus</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                  <input required className={styles.formInput} value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="Contoh: Pengurus Pusat Partai Hanura, Pengurus DPD, dll" />
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
