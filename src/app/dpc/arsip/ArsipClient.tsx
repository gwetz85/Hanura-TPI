"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import crudStyles from "../crud.module.css";
import styles from "../surat/surat.module.css"; // Reuse surat styles for layout

interface Archive {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  uploader: { name: string; role: string };
  createdAt: string;
}

export default function ArsipClient({ userRole }: { userRole: string }) {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Edit / Delete State
  const [editMode, setEditMode] = useState(false);
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/arsip");
      if (res.ok) {
        setArchives(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch archives", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setTitle("");
    setDescription("");
    setExistingFileUrl(null);
    setSelectedFile(null);
    setUploadProgress("");
    setEditMode(false);
    setEditingArchiveId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (a: Archive) => {
    setTitle(a.title);
    setDescription(a.description || "");
    setExistingFileUrl(a.fileUrl || null);
    setSelectedFile(null);
    setUploadProgress("");
    setEditMode(true);
    setEditingArchiveId(a.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus arsip ini?")) return;
    try {
      const res = await fetch(`/api/arsip/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus arsip");
      setArchives(archives.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePreviewSurat = (url: string, titleName: string) => {
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
        setPreviewUrl(URL.createObjectURL(blob));
      } else {
        setPreviewUrl(url);
      }
      setPreviewTitle(titleName);
      setShowPreviewModal(true);
    } catch { alert("Gagal membuka berkas."); }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let fileUrl = existingFileUrl || "";
      if (selectedFile) {
        setUploadProgress("Mengupload berkas arsip ke Cloud Storage...");
        const { supabase } = await import("@/lib/supabase");
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2,9)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('arsip')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error("Gagal mengupload berkas ke cloud: " + error.message);
        }
        
        const { data: { publicUrl } } = supabase.storage.from('arsip').getPublicUrl(fileName);
        fileUrl = publicUrl;
        setUploadProgress("Upload sukses!");
      }

      if (editMode && editingArchiveId) {
        const res = await fetch(`/api/arsip/${editingArchiveId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, fileUrl }),
        });

        if (!res.ok) throw new Error("Gagal mengupdate arsip");
        await fetchArchives(); // Refresh for relation data (uploader)
      } else {
        const res = await fetch("/api/arsip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, fileUrl }),
        });

        if (!res.ok) throw new Error("Gagal menyimpan arsip");
        await fetchArchives(); // Refresh
      }

      setIsModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={crudStyles.container}>
      <div className={crudStyles.glassCard}>
        <Link href="/dpc" className={crudStyles.backLink}>← Kembali ke Dashboard</Link>
        
        <div className={crudStyles.header} style={{ marginBottom: "1rem" }}>
          <div>
            <h1 className={crudStyles.title}>Kelola Arsip</h1>
            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>
              Penyimpanan berkas terkait kepengurusan Partai.
            </span>
          </div>

          <button className={styles.btnAdd} onClick={openModal}>
            <span>+</span> Tambah Arsip Baru
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <p className={crudStyles.empty}>Memuat daftar arsip...</p>
          ) : archives.length === 0 ? (
            <p className={crudStyles.empty}>Belum ada data arsip yang tersimpan.</p>
          ) : (
            <table className={crudStyles.table}>
              <thead>
                <tr>
                  <th>Tanggal Upload</th>
                  <th>Judul Arsip</th>
                  <th>Deskripsi</th>
                  <th>Pengunggah</th>
                  <th style={{ textAlign: "center" }}>Aksi / Lampiran</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((a) => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(a.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td>{a.description || "-"}</td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{a.uploader.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>{a.uploader.role}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                        {a.fileUrl ? (
                          <button 
                            onClick={() => handlePreviewSurat(a.fileUrl!, a.title)}
                            className={crudStyles.btnApprove}
                            style={{ fontSize: "0.85rem", border: "none", cursor: "pointer", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600 }}
                          >
                            📄 Lihat / Unduh
                          </button>
                        ) : (
                          <span style={{ color: "#555", fontSize: "0.85rem", marginRight: "0.2rem" }}>Tidak ada file</span>
                        )}
                        <button 
                          onClick={() => openEditModal(a)}
                          className={crudStyles.btnSave}
                          style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600, border: "none" }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(a.id)}
                          className={crudStyles.btnReject}
                          style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600, border: "none" }}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editMode ? "Edit" : "Tambah"} Arsip Baru</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Judul Arsip</label>
                <input 
                  type="text" 
                  className={crudStyles.formInput} 
                  placeholder="Contoh: SK Kepengurusan 2023"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Deskripsi (Opsional)</label>
                <textarea 
                  className={crudStyles.formInput} 
                  placeholder="Keterangan singkat mengenai arsip ini..."
                  value={description}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Upload File (PDF / Gambar / dll)</label>
                <input 
                  type="file" 
                  className={crudStyles.formInput} 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {existingFileUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.45rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#2ed573", fontWeight: 600 }}>✓ Sudah ada lampiran tersimpan</span>
                    <button 
                      type="button" 
                      onClick={() => setExistingFileUrl(null)}
                      className={crudStyles.btnReject}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "none", cursor: "pointer" }}
                    >
                      Hapus File
                    </button>
                  </div>
                )}
                {uploadProgress && (
                  <span style={{ fontSize: "0.85rem", color: "#D4AF37", marginTop: "0.35rem", display: "block" }}>
                    {uploadProgress}
                  </span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className={crudStyles.btnSave} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan Arsip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Arsip */}
      {showPreviewModal && previewUrl && (
        <div className={crudStyles.modalOverlay} onClick={closePreviewModal} style={{ zIndex: 999999, padding: "1.5rem" }}>
          <div className={crudStyles.modalContent} onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: "1100px", height: "90vh", display: "flex", flexDirection: "column", padding: "1.5rem 2rem", maxHeight: "calc(100vh - 3rem)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem", flexShrink: 0 }}>
              <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "1.4rem" }}>Pratinjau File — {previewTitle}</h2>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <a href={previewUrl} download={`Arsip_${previewTitle.replace(/\//g, "_")}`} className={crudStyles.btnApprove} style={{ textDecoration: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>⬇️ Download</a>
                <button onClick={closePreviewModal} className={crudStyles.btnReject} style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>✖ Tutup</button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "10px", overflow: "hidden", minHeight: 0, position: "relative" }}>
              <iframe src={previewUrl} width="100%" height="100%" style={{ border: "none" }} title="Preview Arsip" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
