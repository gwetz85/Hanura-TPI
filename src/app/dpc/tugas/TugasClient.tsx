"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./tugas.module.css";

interface Tugas {
  id: string;
  dasarKegiatan: string;
  namaKegiatan: string;
  lokasi: string;
  tanggal: string;
  suratTugasUrl: string | null;
  hasilPertemuan: string;
  creatorId: string;
  createdAt: string;
  creator: { name: string; role: string };
}

export default function TugasClient({ userRole, userName }: { userRole: string; userName: string }) {
  const router = useRouter();
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  const [formData, setFormData] = useState({
    dasarKegiatan: "",
    namaKegiatan: "",
    lokasi: "",
    tanggal: "",
    suratTugasUrl: "",
    hasilPertemuan: ""
  });

  const fetchTugas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dpc/tugas");
      if (res.ok) {
        const data = await res.json();
        setTugasList(data);
        if (selectedTugas) {
          const updated = data.find((t: Tugas) => t.id === selectedTugas.id);
          if (updated) setSelectedTugas(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTugas();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", e.target.files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, suratTugasUrl: data.url });
      } else {
        alert("Gagal mengupload file");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!selectedTugas && !detailModalOpen;
      const url = isEdit ? `/api/dpc/tugas/${selectedTugas.id}` : "/api/dpc/tugas";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        tanggal: new Date(formData.tanggal).toISOString()
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedTugas(null);
        setFormData({ dasarKegiatan: "", namaKegiatan: "", lokasi: "", tanggal: "", suratTugasUrl: "", hasilPertemuan: "" });
        fetchTugas();
      } else {
        alert("Gagal menyimpan tugas");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan tugas ini?")) return;
    try {
      const res = await fetch(`/api/dpc/tugas/${id}`, { method: "DELETE" });
      if (res.ok) fetchTugas();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setSelectedTugas(null);
    setFormData({ dasarKegiatan: "", namaKegiatan: "", lokasi: "", tanggal: "", suratTugasUrl: "", hasilPertemuan: "" });
    setDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tugas: Tugas) => {
    setSelectedTugas(tugas);
    
    // Convert UTC Date back to local datetime-local string
    const d = new Date(tugas.tanggal);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);

    setFormData({
      dasarKegiatan: tugas.dasarKegiatan,
      namaKegiatan: tugas.namaKegiatan,
      lokasi: tugas.lokasi,
      tanggal: localISOTime,
      suratTugasUrl: tugas.suratTugasUrl || "",
      hasilPertemuan: tugas.hasilPertemuan
    });
    setDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const openDetailModal = (tugas: Tugas) => {
    setSelectedTugas(tugas);
    setIsEditingNotes(false);
    setTempNotes("");
    setDetailModalOpen(true);
  };

  const saveNotesOnly = async () => {
    if (!selectedTugas) return;
    try {
      const res = await fetch(`/api/dpc/tugas/${selectedTugas.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dasarKegiatan: selectedTugas.dasarKegiatan,
          namaKegiatan: selectedTugas.namaKegiatan,
          lokasi: selectedTugas.lokasi,
          tanggal: selectedTugas.tanggal,
          suratTugasUrl: selectedTugas.suratTugasUrl,
          hasilPertemuan: tempNotes
        })
      });

      if (res.ok) {
        setIsEditingNotes(false);
        fetchTugas();
      } else {
        alert("Gagal menyimpan catatan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    // Window.print() will trigger the browser's PDF / Print dialog.
    // The CSS @media print handles hiding the rest of the UI.
    window.print();
  };

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backLink}>
        ← Kembali ke Dashboard
      </button>
      <div className={styles.header}>
        <h1 className={styles.title}>Catatan Tugas & Pertemuan</h1>
        <button className={styles.addBtn} onClick={openAddModal}>+ Tambah Catatan</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.tugasTable}>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Kegiatan</th>
              <th>Lokasi</th>
              <th>Dicatat Oleh</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>Memuat data...</td></tr>
            ) : tugasList.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>Belum ada catatan tugas.</td></tr>
            ) : (
              tugasList.map(tugas => (
                <tr key={tugas.id}>
                  <td>{new Date(tugas.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  <td style={{ fontWeight: 600 }}>{tugas.namaKegiatan}</td>
                  <td>{tugas.lokasi}</td>
                  <td>{tugas.creator?.name || "Unknown"}</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => openDetailModal(tugas)}>Detail</button>
                    <button className={styles.actionBtn} onClick={() => openEditModal(tugas)}>Edit</button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(tugas.id)}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selectedTugas ? "Edit Catatan" : "Tambah Catatan Tugas"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Dasar Kegiatan</label>
                  <input type="text" className={styles.input} required value={formData.dasarKegiatan} onChange={e => setFormData({ ...formData, dasarKegiatan: e.target.value })} placeholder="Cth: Surat Undangan No. 123..." />
                </div>
                <div className={styles.formGroup}>
                  <label>Nama Kegiatan / Pertemuan</label>
                  <input type="text" className={styles.input} required value={formData.namaKegiatan} onChange={e => setFormData({ ...formData, namaKegiatan: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Lokasi Kegiatan</label>
                  <input type="text" className={styles.input} required value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Waktu & Tanggal Kegiatan</label>
                  <input type="datetime-local" className={styles.input} required value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label>Upload Surat Tugas (Opsional)</label>
                  <input type="file" accept=".pdf,.doc,.docx,image/*" className={styles.input} onChange={handleFileUpload} />
                  {isUploading && <span style={{ color: "#4facfe", fontSize: "0.85rem", marginTop: "0.5rem", display: "block" }}>Sedang mengupload...</span>}
                  {formData.suratTugasUrl && !isUploading && (
                    <span style={{ color: "#4facfe", fontSize: "0.85rem", marginTop: "0.5rem", display: "block" }}>File berhasil diupload.</span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>Catatan / Hasil Pertemuan</label>
                  <textarea className={styles.textarea} value={formData.hasilPertemuan} onChange={e => setFormData({ ...formData, hasilPertemuan: e.target.value })} placeholder="Ketik hasil laporan pertemuan di sini... (opsional saat ini, bisa diisi nanti)"></textarea>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className={styles.submitBtn}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & PRINT MODAL */}
      {detailModalOpen && selectedTugas && (
        <div className={styles.modalOverlay} onClick={() => setDetailModalOpen(false)}>
          <div className={`${styles.modalContent} ${styles.printArea}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Laporan Catatan Tugas</h3>
              <button className={styles.backBtn} onClick={() => setDetailModalOpen(false)} style={{ marginRight: "0.5rem" }}>Kembali</button>
              <button className={styles.closeBtn} onClick={() => setDetailModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailLabel}>Dasar Kegiatan:</div>
                <div className={styles.detailValue}>{selectedTugas.dasarKegiatan}</div>

                <div className={styles.detailLabel}>Nama Kegiatan:</div>
                <div className={styles.detailValue}>{selectedTugas.namaKegiatan}</div>

                <div className={styles.detailLabel}>Lokasi:</div>
                <div className={styles.detailValue}>{selectedTugas.lokasi}</div>

                <div className={styles.detailLabel}>Tanggal:</div>
                <div className={styles.detailValue}>
                  {new Date(selectedTugas.tanggal).toLocaleDateString("id-ID", { weekday: 'long', day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB
                </div>
              </div>

              {selectedTugas.suratTugasUrl && (
                <div className={styles.detailSection} style={{ marginTop: "1rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ color: "#adb5bd", margin: 0 }}>Lampiran Surat Tugas:</h4>
                    <a href={selectedTugas.suratTugasUrl} target="_blank" rel="noreferrer" style={{ color: "#4facfe", fontSize: "0.9rem" }}>Buka di Tab Baru</a>
                  </div>
                  {selectedTugas.suratTugasUrl.startsWith("data:image") ? (
                    <img src={selectedTugas.suratTugasUrl} alt="Surat Tugas" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                  ) : (
                    <iframe src={selectedTugas.suratTugasUrl} style={{ width: "100%", height: "600px", border: "none", borderRadius: "8px", background: "#fff" }} />
                  )}
                </div>
              )}

              <div className={styles.detailSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h4 style={{ color: "#adb5bd", margin: 0 }}>Hasil Pertemuan / Catatan:</h4>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {!isEditingNotes ? (
                      <button className={styles.actionBtn} onClick={() => { setIsEditingNotes(true); setTempNotes(selectedTugas.hasilPertemuan || ""); }}>
                        Edit Catatan
                      </button>
                    ) : (
                      <>
                        <button className={styles.cancelBtn} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setIsEditingNotes(false)}>
                          Batal
                        </button>
                        <button className={styles.submitBtn} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "#f39c12" }} onClick={saveNotesOnly}>
                          SIMPAN DRAFT
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {isEditingNotes ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <textarea 
                      className={styles.textarea} 
                      value={tempNotes} 
                      onChange={(e) => setTempNotes(e.target.value)} 
                      placeholder="Ketik catatan hasil pertemuan..."
                      autoFocus
                    ></textarea>
                  </div>
                ) : (
                  <div className={styles.detailTextarea}>
                    {selectedTugas.hasilPertemuan ? selectedTugas.hasilPertemuan : <span style={{ fontStyle: "italic", opacity: 0.5 }}>Belum ada catatan. Klik Edit untuk menambahkan.</span>}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "3rem", textAlign: "right" }}>
                <p style={{ color: "#adb5bd", fontSize: "0.9rem" }}>Dibuat oleh: <strong>{selectedTugas.creator?.name}</strong> pada {new Date(selectedTugas.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setDetailModalOpen(false)}>Tutup</button>
              <button className={styles.downloadPdfBtn} onClick={handlePrint}>
                <span style={{ fontSize: "1.2rem" }}>📄</span> Download / Cetak PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
