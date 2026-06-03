"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import crudStyles from "../crud.module.css";
import styles from "../surat/surat.module.css";

interface Documentation {
  id: string;
  title: string;
  description: string | null;
  photoUrls: string[];
  uploader: { name: string; role: string };
  createdAt: string;
}

export default function DokumentasiClient({ userRole }: { userRole: string }) {
  const [documentations, setDocumentations] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");

  // Gallery Preview Modal State
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");

  // Edit / Delete State
  const [editMode, setEditMode] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchDocumentations();
  }, []);

  const fetchDocumentations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dokumentasi");
      if (res.ok) {
        setDocumentations(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch documentations", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setTitle("");
    setDescription("");
    setExistingPhotoUrls([]);
    setSelectedFiles([]);
    setUploadProgress("");
    setEditMode(false);
    setEditingDocId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Documentation) => {
    setTitle(d.title);
    setDescription(d.description || "");
    setExistingPhotoUrls(d.photoUrls || []);
    setSelectedFiles([]);
    setUploadProgress("");
    setEditMode(true);
    setEditingDocId(d.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumentasi ini?")) return;
    try {
      const res = await fetch(`/api/dokumentasi/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus dokumentasi");
      setDocumentations(documentations.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePreviewGallery = (urls: string[], titleName: string) => {
    setGalleryUrls(urls);
    setGalleryTitle(titleName);
    setShowGalleryModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + existingPhotoUrls.length > 50) {
        alert("Maksimal 50 foto per kegiatan.");
        return;
      }
      setSelectedFiles(files);
    }
  };

  const handleRemoveExistingPhoto = (index: number) => {
    const newUrls = [...existingPhotoUrls];
    newUrls.splice(index, 1);
    setExistingPhotoUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadProgress("");

    try {
      let finalPhotoUrls = [...existingPhotoUrls];
      
      if (selectedFiles.length > 0) {
        setUploadProgress(`Mengupload 0 / ${selectedFiles.length} foto...`);
        const { supabase } = await import("@/lib/supabase");
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `dokumentasi_${Date.now()}_${Math.random().toString(36).substring(2,9)}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('arsip') // Using the same bucket as arsip
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error("Gagal mengupload:", error.message);
            // Lanjut ke file berikutnya, tapi bisa dilemparkan error juga.
          } else {
            const { data: { publicUrl } } = supabase.storage.from('arsip').getPublicUrl(fileName);
            finalPhotoUrls.push(publicUrl);
          }
          setUploadProgress(`Mengupload ${i + 1} / ${selectedFiles.length} foto...`);
        }
        setUploadProgress("Upload foto selesai!");
      }

      if (editMode && editingDocId) {
        const res = await fetch(`/api/dokumentasi/${editingDocId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, photoUrls: finalPhotoUrls }),
        });

        if (!res.ok) throw new Error("Gagal mengupdate dokumentasi");
        await fetchDocumentations();
      } else {
        const res = await fetch("/api/dokumentasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, photoUrls: finalPhotoUrls }),
        });

        if (!res.ok) throw new Error("Gagal menyimpan dokumentasi");
        await fetchDocumentations();
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
            <h1 className={crudStyles.title}>Kelola Dokumentasi</h1>
            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>
              Simpan foto-foto kegiatan Partai (maks 50 foto per kegiatan).
            </span>
          </div>

          <button className={styles.btnAdd} onClick={openModal}>
            <span>+</span> Tambah Kegiatan
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <p className={crudStyles.empty}>Memuat daftar dokumentasi...</p>
          ) : documentations.length === 0 ? (
            <p className={crudStyles.empty}>Belum ada data dokumentasi kegiatan tersimpan.</p>
          ) : (
            <table className={crudStyles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Kegiatan</th>
                  <th>Deskripsi</th>
                  <th>Total Foto</th>
                  <th>Pengunggah</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {documentations.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(d.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td>{d.description || "-"}</td>
                    <td>
                      <span style={{ background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
                        {d.photoUrls.length} Foto
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{d.uploader.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>{d.uploader.role}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                        <button 
                          onClick={() => handlePreviewGallery(d.photoUrls, d.title)}
                          className={crudStyles.btnApprove}
                          style={{ fontSize: "0.85rem", border: "none", cursor: "pointer", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600 }}
                          disabled={d.photoUrls.length === 0}
                        >
                          🖼️ Lihat Foto
                        </button>
                        <button 
                          onClick={() => openEditModal(d)}
                          className={crudStyles.btnSave}
                          style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600, border: "none" }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)}
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
        <div className={styles.modalOverlay} onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editMode ? "Edit" : "Tambah"} Kegiatan Dokumentasi</h3>
              <button className={styles.closeBtn} onClick={() => !isSaving && setIsModalOpen(false)} disabled={isSaving}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Judul / Nama Kegiatan</label>
                <input 
                  type="text" 
                  className={crudStyles.formInput} 
                  placeholder="Contoh: Rapat Koordinasi DPC"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Deskripsi (Opsional)</label>
                <textarea 
                  className={crudStyles.formInput} 
                  placeholder="Keterangan singkat mengenai kegiatan ini..."
                  value={description}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Upload Foto Kegiatan (Maks 50)</label>
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  className={crudStyles.formInput} 
                  onChange={handleFileChange}
                  disabled={isSaving || (existingPhotoUrls.length >= 50)}
                />
                
                {/* Preview Existing Photos if editing */}
                {existingPhotoUrls.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Foto Tersimpan ({existingPhotoUrls.length}):</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", maxHeight: "150px", overflowY: "auto" }}>
                      {existingPhotoUrls.map((url, idx) => (
                        <div key={idx} style={{ position: "relative", width: "60px", height: "60px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Saved ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingPhoto(idx)}
                            style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "10px" }}
                            disabled={isSaving}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview New Selected Photos */}
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Foto Baru Dipilih ({selectedFiles.length}):</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", maxHeight: "150px", overflowY: "auto" }}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} style={{ position: "relative", width: "60px", height: "60px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt={`New ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadProgress && (
                  <span style={{ fontSize: "0.85rem", color: "#D4AF37", marginTop: "0.5rem", display: "block" }}>
                    {uploadProgress}
                  </span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                  Batal
                </button>
                <button type="submit" className={crudStyles.btnSave} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan Kegiatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Preview Modal */}
      {showGalleryModal && (
        <div className={crudStyles.modalOverlay} onClick={() => setShowGalleryModal(false)} style={{ zIndex: 999999, padding: "1.5rem" }}>
          <div className={crudStyles.modalContent} onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: "1200px", height: "90vh", display: "flex", flexDirection: "column", padding: "1.5rem 2rem", maxHeight: "calc(100vh - 3rem)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem", flexShrink: 0 }}>
              <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "1.4rem" }}>Galeri: {galleryTitle}</h2>
              <button onClick={() => setShowGalleryModal(false)} className={crudStyles.btnReject} style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}>✖ Tutup</button>
            </div>
            <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", overflowY: "auto", padding: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {galleryUrls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ width: "100%", paddingTop: "100%", position: "relative", borderRadius: "10px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", transition: "transform 0.2s" }} className="hover-zoom">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${idx}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </a>
                ))}
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                .hover-zoom:hover { transform: scale(1.05); border-color: #D4AF37; }
              `}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
