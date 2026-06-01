"use client";
import { useState } from "react";
import Link from "next/link";
import crudStyles from "../crud.module.css";
import styles from "./surat.module.css";

interface SuratMasuk {
  id: string;
  tanggalSurat: string;
  nomorSurat: string;
  instansiPengirim: string;
  perihal: string;
  fileUrl?: string | null;
}

interface SuratKeluar {
  id: string;
  tanggalSurat: string;
  nomorSurat: string;
  penerima: string;
  perihal: string;
  fileUrl?: string | null;
}

interface Props {
  initialSuratMasuk: SuratMasuk[];
  initialSuratKeluar: SuratKeluar[];
}

export default function SuratClient({ initialSuratMasuk, initialSuratKeluar }: Props) {
  const [activeTab, setActiveTab] = useState<"masuk" | "keluar">("masuk");
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>(initialSuratMasuk);
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>(initialSuratKeluar);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Edit / Delete State
  const [editMode, setEditMode] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  // Form state
  const [tanggalSurat, setTanggalSurat] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [pihakLain, setPihakLain] = useState(""); // Reused for instansiPengirim / penerima
  const [perihal, setPerihal] = useState("");

  const openModal = () => {
    setTanggalSurat("");
    setNomorSurat("");
    setPihakLain("");
    setPerihal("");
    setExistingFileUrl(null);
    setSelectedFile(null);
    setUploadProgress("");
    setEditMode(false);
    setEditingLetterId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: SuratMasuk | SuratKeluar) => {
    setTanggalSurat(s.tanggalSurat);
    setNomorSurat(s.nomorSurat);
    setPihakLain("instansiPengirim" in s ? s.instansiPengirim : s.penerima);
    setPerihal(s.perihal);
    setExistingFileUrl(s.fileUrl || null);
    setSelectedFile(null);
    setUploadProgress("");
    setEditMode(true);
    setEditingLetterId(s.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus surat ini?")) return;
    try {
      const res = await fetch(`/api/surat/${activeTab}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus surat");
      if (activeTab === "masuk") {
        setSuratMasuk(suratMasuk.filter(item => item.id !== id));
      } else {
        setSuratKeluar(suratKeluar.filter(item => item.id !== id));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePreviewSurat = (url: string, title: string) => {
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
      setPreviewTitle(title);
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
    setIsLoading(true);

    try {
      let fileUrl = existingFileUrl || "";
      if (selectedFile) {
        setUploadProgress("Mengupload file surat...");
        const fd = new FormData();
        fd.append("file", selectedFile);
        const resUpload = await fetch("/api/upload", { method: "POST", body: fd });
        if (!resUpload.ok) throw new Error("Gagal mengupload berkas surat");
        const dataUpload = await resUpload.json();
        fileUrl = dataUpload.url;
        setUploadProgress("Upload sukses!");
      }

      if (editMode && editingLetterId) {
        if (activeTab === "masuk") {
          const res = await fetch(`/api/surat/masuk/${editingLetterId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggalSurat,
              nomorSurat,
              instansiPengirim: pihakLain,
              perihal,
              fileUrl,
            }),
          });

          if (!res.ok) throw new Error("Gagal mengupdate surat masuk");
          const updatedSurat = await res.json();
          setSuratMasuk(suratMasuk.map(item => item.id === editingLetterId ? updatedSurat : item));
        } else {
          const res = await fetch(`/api/surat/keluar/${editingLetterId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggalSurat,
              nomorSurat,
              penerima: pihakLain,
              perihal,
              fileUrl,
            }),
          });

          if (!res.ok) throw new Error("Gagal mengupdate surat keluar");
          const updatedSurat = await res.json();
          setSuratKeluar(suratKeluar.map(item => item.id === editingLetterId ? updatedSurat : item));
        }
      } else {
        if (activeTab === "masuk") {
          const res = await fetch("/api/surat/masuk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggalSurat,
              nomorSurat,
              instansiPengirim: pihakLain,
              perihal,
              fileUrl,
            }),
          });

          if (!res.ok) throw new Error("Gagal menyimpan surat masuk");
          const newSurat = await res.json();
          setSuratMasuk([newSurat, ...suratMasuk]);
        } else {
          const res = await fetch("/api/surat/keluar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tanggalSurat,
              nomorSurat,
              penerima: pihakLain,
              perihal,
              fileUrl,
            }),
          });

          if (!res.ok) throw new Error("Gagal menyimpan surat keluar");
          const newSurat = await res.json();
          setSuratKeluar([newSurat, ...suratKeluar]);
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={crudStyles.container}>
      <div className={crudStyles.glassCard}>
        <Link href="/dpc" className={crudStyles.backLink}>← Kembali ke Dashboard DPC</Link>
        
        <div className={crudStyles.header} style={{ marginBottom: "1rem" }}>
          <div>
            <h1 className={crudStyles.title}>Kelola Surat DPC</h1>
            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>
              Pencatatan Surat Masuk dan Surat Keluar DPC.
            </span>
          </div>

          <button className={styles.btnAdd} onClick={openModal}>
            <span>+</span> Tambah Surat {activeTab === "masuk" ? "Masuk" : "Keluar"}
          </button>
        </div>

        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tab} ${activeTab === "masuk" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("masuk")}
          >
            📥 Surat Masuk
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "keluar" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("keluar")}
          >
            📤 Surat Keluar
          </button>
        </div>

        {activeTab === "masuk" && (
          <div style={{ overflowX: "auto" }}>
            {suratMasuk.length === 0 ? (
              <p className={crudStyles.empty}>Belum ada data Surat Masuk.</p>
            ) : (
              <table className={crudStyles.table}>
                <thead>
                  <tr>
                    <th>Tanggal Surat</th>
                    <th>Nomor Surat</th>
                    <th>Instansi Pengirim</th>
                    <th>Perihal</th>
                    <th style={{ textAlign: "center" }}>Aksi / Lampiran</th>
                  </tr>
                </thead>
                <tbody>
                  {suratMasuk.map((s) => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{s.tanggalSurat}</td>
                      <td style={{ fontWeight: 600 }}>{s.nomorSurat}</td>
                      <td>{s.instansiPengirim}</td>
                      <td>{s.perihal}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                          {s.fileUrl ? (
                            <button 
                              onClick={() => handlePreviewSurat(s.fileUrl!, s.nomorSurat)}
                              className={crudStyles.btnApprove}
                              style={{ fontSize: "0.85rem", border: "none", cursor: "pointer", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600 }}
                            >
                              📄 Lihat
                            </button>
                          ) : (
                            <span style={{ color: "#555", fontSize: "0.85rem", marginRight: "0.2rem" }}>Tidak ada file</span>
                          )}
                          <button 
                            onClick={() => openEditModal(s)}
                            className={crudStyles.btnSave}
                            style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600, border: "none" }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
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
        )}

        {activeTab === "keluar" && (
          <div style={{ overflowX: "auto" }}>
            {suratKeluar.length === 0 ? (
              <p className={crudStyles.empty}>Belum ada data Surat Keluar.</p>
            ) : (
              <table className={crudStyles.table}>
                <thead>
                  <tr>
                    <th>Tanggal Surat</th>
                    <th>Nomor Surat</th>
                    <th>Penerima</th>
                    <th>Perihal</th>
                    <th style={{ textAlign: "center" }}>Aksi / Lampiran</th>
                  </tr>
                </thead>
                <tbody>
                  {suratKeluar.map((s) => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{s.tanggalSurat}</td>
                      <td style={{ fontWeight: 600 }}>{s.nomorSurat}</td>
                      <td>{s.penerima}</td>
                      <td>{s.perihal}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", alignItems: "center" }}>
                          {s.fileUrl ? (
                            <button 
                              onClick={() => handlePreviewSurat(s.fileUrl!, s.nomorSurat)}
                              className={crudStyles.btnApprove}
                              style={{ fontSize: "0.85rem", border: "none", cursor: "pointer", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600 }}
                            >
                              📄 Lihat
                            </button>
                          ) : (
                            <span style={{ color: "#555", fontSize: "0.85rem", marginRight: "0.2rem" }}>Tidak ada file</span>
                          )}
                          <button 
                            onClick={() => openEditModal(s)}
                            className={crudStyles.btnSave}
                            style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem", borderRadius: "8px", fontWeight: 600, border: "none" }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
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
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editMode ? "Edit" : "Tambah"} Surat {activeTab === "masuk" ? "Masuk" : "Keluar"}</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Tanggal Surat</label>
                <input 
                  type="date" 
                  className={crudStyles.formInput} 
                  required
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Nomor Surat</label>
                <input 
                  type="text" 
                  className={crudStyles.formInput} 
                  placeholder="Contoh: 001/DPC/HANURA/V/2023"
                  required
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>
                  {activeTab === "masuk" ? "Instansi Pengirim" : "Penerima"}
                </label>
                <input 
                  type="text" 
                  className={crudStyles.formInput} 
                  placeholder={activeTab === "masuk" ? "Nama Instansi / Pengirim" : "Nama Penerima / Instansi"}
                  required
                  value={pihakLain}
                  onChange={(e) => setPihakLain(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>Perihal</label>
                <input 
                  type="text" 
                  className={crudStyles.formInput} 
                  placeholder="Contoh: Undangan Rapat Kerja"
                  required
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={crudStyles.formLabel}>File PDF Surat (Opsional)</label>
                <input 
                  type="file" 
                  accept="application/pdf,image/*"
                  className={crudStyles.formInput} 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {existingFileUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.45rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#2ed573", fontWeight: 600 }}>✓ Sudah ada lampiran</span>
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
                <button type="submit" className={crudStyles.btnSave} disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Surat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Surat */}
      {showPreviewModal && previewUrl && (
        <div className={crudStyles.modalOverlay} onClick={closePreviewModal} style={{ zIndex: 999999, padding: "1.5rem" }}>
          <div className={crudStyles.modalContent} onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: "1100px", height: "90vh", display: "flex", flexDirection: "column", padding: "1.5rem 2rem", maxHeight: "calc(100vh - 3rem)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem", flexShrink: 0 }}>
              <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "1.4rem" }}>Pratinjau Surat — {previewTitle}</h2>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <a href={previewUrl} download={`Surat_${previewTitle.replace(/\//g, "_")}`} className={crudStyles.btnApprove} style={{ textDecoration: "none", padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>⬇️ Download</a>
                <button onClick={closePreviewModal} className={crudStyles.btnReject} style={{ padding: "0.6rem 1.4rem", borderRadius: "10px", fontWeight: 700, fontSize: "1rem" }}>✖ Tutup</button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: "10px", overflow: "hidden", minHeight: 0 }}>
              <iframe src={previewUrl} width="100%" height="100%" style={{ border: "none" }} title="Preview Surat" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
