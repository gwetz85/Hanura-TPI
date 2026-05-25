"use client";
import { useState } from "react";
import crudStyles from "../crud.module.css";
import styles from "./surat.module.css";

interface SuratMasuk {
  id: string;
  tanggalSurat: string;
  nomorSurat: string;
  instansiPengirim: string;
  perihal: string;
}

interface SuratKeluar {
  id: string;
  tanggalSurat: string;
  nomorSurat: string;
  penerima: string;
  perihal: string;
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === "masuk") {
        const res = await fetch("/api/surat/masuk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tanggalSurat,
            nomorSurat,
            instansiPengirim: pihakLain,
            perihal,
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
          }),
        });

        if (!res.ok) throw new Error("Gagal menyimpan surat keluar");
        const newSurat = await res.json();
        setSuratKeluar([newSurat, ...suratKeluar]);
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
        <a href="/dpc" className={crudStyles.backLink}>← Kembali ke Dashboard DPC</a>
        
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
                  </tr>
                </thead>
                <tbody>
                  {suratMasuk.map((s) => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{s.tanggalSurat}</td>
                      <td style={{ fontWeight: 600 }}>{s.nomorSurat}</td>
                      <td>{s.instansiPengirim}</td>
                      <td>{s.perihal}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {suratKeluar.map((s) => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{s.tanggalSurat}</td>
                      <td style={{ fontWeight: 600 }}>{s.nomorSurat}</td>
                      <td>{s.penerima}</td>
                      <td>{s.perihal}</td>
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
              <h3 className={styles.modalTitle}>Tambah Surat {activeTab === "masuk" ? "Masuk" : "Keluar"}</h3>
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
    </div>
  );
}
