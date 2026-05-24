"use client";
import { useState, useRef } from "react";
import styles from "../crud.module.css";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Pac { id: string; name: string; role: string; }
interface Member {
  id: string;
  pacId: string;
  noUrut: number | null;
  nomorKta: string | null;
  name: string;
  nik: string | null;
  phone: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  jobStatus: string | null;
  address: string | null;
  village: string | null;
  subDistrict: string | null;
  isVerified: boolean;
  pac: { name: string; role: string };
  createdAt: Date | string;
}

export default function MembersManagerClient({ members, pacs }: { members: Member[], pacs: Pac[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterPac, setFilterPac] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialForm = {
    pacId: "", noUrut: "", nomorKta: "", name: "", nik: "", phone: "", gender: "",
    birthPlace: "", birthDate: "", maritalStatus: "", jobStatus: "", address: "", village: "", subDistrict: ""
  };
  const [formData, setFormData] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const filteredMembers = filterPac ? members.filter(m => m.pacId === filterPac) : members;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pacId || !formData.name) return;
    setLoading(true);

    try {
      const url = editId ? `/api/dpc/members/${editId}` : "/api/dpc/members";
      const method = editId ? "PUT" : "POST";
      
      const payload = { ...formData, isVerified: true };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");
      setFormData(initialForm);
      setEditId(null);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m: Member) => {
    setEditId(m.id);
    setFormData({
      pacId: m.pacId,
      noUrut: m.noUrut?.toString() || "",
      nomorKta: m.nomorKta || "",
      name: m.name || "",
      nik: m.nik || "",
      phone: m.phone || "",
      gender: m.gender || "",
      birthPlace: m.birthPlace || "",
      birthDate: m.birthDate || "",
      maritalStatus: m.maritalStatus || "",
      jobStatus: m.jobStatus || "",
      address: m.address || "",
      village: m.village || "",
      subDistrict: m.subDistrict || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus anggota ini?")) return;
    try {
      const res = await fetch(`/api/dpc/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!filterPac) return;
    const pacName = pacs.find(p => p.id === filterPac)?.name;
    if (!confirm(`PERINGATAN! Anda yakin ingin menghapus SELURUH data anggota untuk ${pacName}? Aksi ini tidak dapat dibatalkan.`)) return;
    
    try {
      const res = await fetch(`/api/dpc/members?pacId=${filterPac}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus semua data");
      alert("Seluruh data anggota PAC tersebut telah dihapus.");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!filterPac) {
      alert("Pilih PAC terlebih dahulu pada filter sebelum mengupload Excel!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const payload = data.map((row: any) => ({
          pacId: filterPac,
          noUrut: row["Nomor urut"] || row["No"] || null,
          nomorKta: row["Nomor KTA"]?.toString() || null,
          name: row["Nama"] || row["Name"] || "Tanpa Nama",
          nik: row["NIK"]?.toString() || null,
          phone: row["Kontak"]?.toString() || null,
          gender: row["JK"]?.toString() || null,
          birthPlace: row["Tempat Lahir"]?.toString() || null,
          birthDate: row["Tanggal Lahir"]?.toString() || null,
          maritalStatus: row["Status Perkawinan"]?.toString() || null,
          jobStatus: row["Status Pekerjaan"]?.toString() || null,
          address: row["Alamat"]?.toString() || null,
          village: row["Nama Kelurahan"]?.toString() || null,
          subDistrict: row["Nama Kecamatan"]?.toString() || null,
          isVerified: row["Verifikasi"] === true || row["Verifikasi"] === "Ya" || row["Verifikasi"] === "Yes"
        }));

        const res = await fetch("/api/dpc/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Gagal menyimpan bulk data");
        alert("Upload sukses!");
        router.refresh();
      } catch (err: any) {
        alert("Upload gagal: " + err.message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</a>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Daftar Anggota</h1>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <select 
              value={filterPac} 
              onChange={e => setFilterPac(e.target.value)}
              className={styles.replyInput}
              style={{ width: "200px" }}
            >
              <option value="">Semua PAC</option>
              {pacs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            
            {filterPac && (
              <button className={styles.btnReject} onClick={handleDeleteAll}>
                Hapus Semua Data PAC Ini
              </button>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
              />
              <button 
                className={styles.btnApprove} 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Mengupload..." : "Upload Excel"}
              </button>
              
              <button 
                className={styles.btnSave} 
                onClick={() => { setEditId(null); setFormData(initialForm); setShowModal(true); }}
              >
                INPUT ANGGOTA
              </button>
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <p className={styles.empty}>Belum ada data anggota terdaftar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table} style={{ whiteSpace: "nowrap" }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>PAC</th>
                  <th>No KTA</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>No HP</th>
                  <th>JK</th>
                  <th>Verifikasi</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{m.noUrut || idx + 1}</td>
                    <td>{m.pac.name}</td>
                    <td>{m.nomorKta || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.nik || "-"}</td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.gender || "-"}</td>
                    <td>
                      <span className={styles.badge} style={{ background: m.isVerified ? "rgba(46,213,115,0.15)" : "rgba(255,71,87,0.15)", color: m.isVerified ? "#2ed573" : "#ff4757" }}>
                        {m.isVerified ? "Terverifikasi" : "Belum"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className={styles.btnApprove} onClick={() => setViewMember(m)} style={{ marginRight: "4px", background: "rgba(100,149,237,0.15)", color: "#6495ed", border: "1px solid rgba(100,149,237,0.3)" }}>View</button>
                      <button className={styles.btnApprove} onClick={() => handleEdit(m)} style={{ marginRight: "4px" }}>Edit</button>
                      <button className={styles.btnReject} onClick={() => handleDelete(m.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View Detail */}
      {viewMember && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)",
            padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "600px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#f0f0f0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
              Detail Anggota: {viewMember.name}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", fontSize: "0.95rem", color: "#ddd" }}>
              <div style={{ color: "#aaa" }}>Nomor Urut</div><div>: {viewMember.noUrut || "-"}</div>
              <div style={{ color: "#aaa" }}>Nomor KTA</div><div>: {viewMember.nomorKta || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Lengkap</div><div style={{ fontWeight: 600, color: "#fff" }}>: {viewMember.name}</div>
              <div style={{ color: "#aaa" }}>NIK</div><div>: {viewMember.nik || "-"}</div>
              <div style={{ color: "#aaa" }}>Kontak / No HP</div><div>: {viewMember.phone || "-"}</div>
              <div style={{ color: "#aaa" }}>Jenis Kelamin</div><div>: {viewMember.gender || "-"}</div>
              <div style={{ color: "#aaa" }}>Tempat, Tgl Lahir</div><div>: {viewMember.birthPlace ? viewMember.birthPlace + ", " : ""}{viewMember.birthDate || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Perkawinan</div><div>: {viewMember.maritalStatus || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Pekerjaan</div><div>: {viewMember.jobStatus || "-"}</div>
              <div style={{ color: "#aaa" }}>Alamat Lengkap</div><div>: {viewMember.address || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Kelurahan</div><div>: {viewMember.village || "-"}</div>
              <div style={{ color: "#aaa" }}>Nama Kecamatan</div><div>: {viewMember.subDistrict || "-"}</div>
              <div style={{ color: "#aaa" }}>Status Verifikasi</div>
              <div>: 
                <span style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, background: viewMember.isVerified ? "rgba(46,213,115,0.15)" : "rgba(255,71,87,0.15)", color: viewMember.isVerified ? "#2ed573" : "#ff4757" }}>
                  {viewMember.isVerified ? "Terverifikasi" : "Belum"}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "2rem", textAlign: "right" }}>
              <button onClick={() => setViewMember(null)} className={styles.btnSave}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input/Edit Anggota */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.1)",
            padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "800px",
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#f0f0f0", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
              {editId ? "Edit Anggota" : "Input Anggota Manual"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {/* Form fields stay the same */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Pilih PAC</label>
                <select value={formData.pacId} onChange={(e) => setFormData({ ...formData, pacId: e.target.value })} className={styles.replyInput} required>
                  <option value="">-- Pilih PAC --</option>
                  {pacs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nomor Urut</label>
                <input type="number" value={formData.noUrut} onChange={(e) => setFormData({ ...formData, noUrut: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nomor KTA</label>
                <input type="text" value={formData.nomorKta} onChange={(e) => setFormData({ ...formData, nomorKta: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nama Lengkap</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={styles.replyInput} required />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>NIK</label>
                <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>No. HP</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Jenis Kelamin</label>
                <input type="text" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Tempat Lahir</label>
                <input type="text" value={formData.birthPlace} onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Tanggal Lahir</label>
                <input type="text" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className={styles.replyInput} placeholder="DD/MM/YYYY" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Status Perkawinan</label>
                <input type="text" value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Status Pekerjaan</label>
                <input type="text" value={formData.jobStatus} onChange={(e) => setFormData({ ...formData, jobStatus: e.target.value })} className={styles.replyInput} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Alamat Lengkap</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nama Kelurahan</label>
                <input type="text" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className={styles.replyInput} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", color: "#aaa" }}>Nama Kecamatan</label>
                <input type="text" value={formData.subDistrict} onChange={(e) => setFormData({ ...formData, subDistrict: e.target.value })} className={styles.replyInput} />
              </div>
              
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", gap: "1rem" }}>
                <button type="button" onClick={() => { setShowModal(false); setEditId(null); setFormData(initialForm); }} className={styles.btnReject}>
                  Tutup
                </button>
                <button type="submit" className={styles.btnSave} disabled={loading || !formData.pacId || !formData.name}>
                  {loading ? "Menyimpan..." : (editId ? "Update Anggota" : "Simpan Anggota")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
