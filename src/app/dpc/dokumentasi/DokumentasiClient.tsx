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

  // Download State
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState("");

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

  const downloadPhoto = async (url: string, defaultName: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil file foto");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      console.warn("Direct blob download failed, trying fallback:", err);
      const downloadUrl = url.includes("supabase.co")
        ? (url.includes("?") ? `${url}&download=${encodeURIComponent(defaultName)}` : `${url}?download=${encodeURIComponent(defaultName)}`)
        : url;

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = defaultName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadAllPhotos = async (urls: string[], activityTitle: string) => {
    if (!urls || urls.length === 0) return;
    setDownloadingAll(true);
    try {
      const cleanTitle = activityTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const ext = url.split(".").pop()?.split("?")[0] || "jpg";
        const fileName = `${cleanTitle}_foto_${i + 1}.${ext}`;
        setDownloadProgressText(`Mengunduh foto ${i + 1} dari ${urls.length}...`);
        await downloadPhoto(url, fileName);
        if (i < urls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
      setDownloadProgressText(`Berhasil mengunduh ${urls.length} foto!`);
      setTimeout(() => setDownloadProgressText(""), 3500);
    } catch (error) {
      alert("Gagal mengunduh beberapa foto.");
    } finally {
      setDownloadingAll(false);
    }
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

        {downloadProgressText && !showGalleryModal && (
          <div style={{
            background: "rgba(212, 175, 55, 0.15)",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            color: "#D4AF37",
            padding: "0.75rem 1.2rem",
            borderRadius: "10px",
            marginBottom: "1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}>
            <span>📥</span> {downloadProgressText}
          </div>
        )}

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
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handlePreviewGallery(d.photoUrls, d.title)}
                          className={crudStyles.btnApprove}
                          style={{ fontSize: "0.85rem", border: "none", cursor: "pointer", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600 }}
                          disabled={d.photoUrls.length === 0}
                        >
                          🖼️ Lihat Foto
                        </button>
                        <button 
                          onClick={() => {
                            if (d.photoUrls.length === 1) {
                              const cleanTitle = d.title.replace(/[^a-zA-Z0-9_-]/g, "_");
                              const ext = d.photoUrls[0].split(".").pop()?.split("?")[0] || "jpg";
                              downloadPhoto(d.photoUrls[0], `${cleanTitle}_foto_1.${ext}`);
                            } else {
                              downloadAllPhotos(d.photoUrls, d.title);
                            }
                          }}
                          style={{ 
                            fontSize: "0.85rem", 
                            border: "1px solid rgba(212, 175, 55, 0.4)", 
                            background: "rgba(212, 175, 55, 0.15)", 
                            color: "#D4AF37", 
                            cursor: (d.photoUrls.length === 0 || downloadingAll) ? "not-allowed" : "pointer", 
                            padding: "0.4rem 0.9rem", 
                            borderRadius: "8px", 
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                          disabled={d.photoUrls.length === 0 || downloadingAll}
                          title={d.photoUrls.length > 1 ? `Download semua (${d.photoUrls.length}) foto` : "Download foto"}
                        >
                          ⬇️ Unduh
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
              <div>
                <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "1.4rem" }}>Galeri: {galleryTitle}</h2>
                <span style={{ fontSize: "0.85rem", color: "#a0a0a0" }}>Total {galleryUrls.length} Foto Kegiatan</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => downloadAllPhotos(galleryUrls, galleryTitle)}
                  disabled={downloadingAll || galleryUrls.length === 0}
                  style={{
                    padding: "0.6rem 1.3rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    border: "none",
                    cursor: (downloadingAll || galleryUrls.length === 0) ? "not-allowed" : "pointer",
                    background: "linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)",
                    color: "#000",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 12px rgba(212,175,55,0.25)"
                  }}
                  title="Download semua foto dalam kegiatan ini"
                >
                  {downloadingAll ? "⏳ Mengunduh..." : `⬇️ Download Semua Foto (${galleryUrls.length})`}
                </button>
                <button onClick={() => setShowGalleryModal(false)} className={crudStyles.btnReject} style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer" }}>✖ Tutup</button>
              </div>
            </div>

            {downloadProgressText && (
              <div style={{
                background: "rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "#D4AF37",
                padding: "0.65rem 1.2rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexShrink: 0
              }}>
                <span>📥</span> {downloadProgressText}
              </div>
            )}

            <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "10px", overflowY: "auto", padding: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {galleryUrls.map((url, idx) => {
                  const cleanTitle = galleryTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
                  const ext = url.split(".").pop()?.split("?")[0] || "jpg";
                  const fileName = `${cleanTitle}_foto_${idx + 1}.${ext}`;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        background: "rgba(20, 20, 25, 0.75)", 
                        border: "1px solid rgba(255,255,255,0.1)", 
                        borderRadius: "10px", 
                        overflow: "hidden", 
                        display: "flex", 
                        flexDirection: "column",
                        transition: "all 0.2s"
                      }}
                      className="photo-card"
                    >
                      <a href={url} target="_blank" rel="noreferrer" title="Klik untuk melihat resolusi penuh" style={{ textDecoration: "none", cursor: "zoom-in" }}>
                        <div style={{ width: "100%", paddingTop: "75%", position: "relative", backgroundColor: "rgba(0,0,0,0.3)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Gallery ${idx + 1}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      </a>
                      <div style={{ padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", background: "rgba(0,0,0,0.25)" }}>
                        <span style={{ fontSize: "0.8rem", color: "#c0c0c0", fontWeight: 500 }}>Foto #{idx + 1}</span>
                        <button
                          onClick={() => downloadPhoto(url, fileName)}
                          style={{
                            background: "rgba(212, 175, 55, 0.2)",
                            color: "#D4AF37",
                            border: "1px solid rgba(212, 175, 55, 0.4)",
                            borderRadius: "6px",
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#D4AF37"; e.currentTarget.style.color = "#000"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(212, 175, 55, 0.2)"; e.currentTarget.style.color = "#D4AF37"; }}
                          title={`Unduh Foto #${idx + 1}`}
                        >
                          ⬇️ Unduh
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                .photo-card:hover { transform: translateY(-3px); border-color: #D4AF37; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
              `}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
