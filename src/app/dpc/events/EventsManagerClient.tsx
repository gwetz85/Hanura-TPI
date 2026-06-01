"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../crud.module.css";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: Date | string;
  isActive: boolean;
}

export default function EventsManagerClient({ events: initialEvents }: { events: Event[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const initialForm = { title: "", description: "", date: "", time: "", isActive: true };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditId(event.id);
    const d = new Date(event.date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString();
    
    setFormData({
      title: event.title,
      description: event.description || "",
      date: localISOTime.split("T")[0],
      time: localISOTime.split("T")[1].substring(0, 5),
      isActive: event.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus event");
      setEvents(events.filter(e => e.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const datetimeStr = `${formData.date}T${formData.time}:00`;
      const dateObj = new Date(datetimeStr);

      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateObj.toISOString(),
        isActive: formData.isActive
      };

      if (editId) {
        const res = await fetch(`/api/events/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Gagal mengupdate event");
        const updated = await res.json();
        setEvents(events.map(ev => ev.id === editId ? updated : ev));
      } else {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Gagal membuat event");
        const created = await res.json();
        setEvents([...events, created].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }

      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <Link href="/dpc" className={styles.backLink}>← Kembali ke Dashboard DPC</Link>
        
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Kelola Event / Jadwal</h1>
            <p style={{ color: "#a0a0a0", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Tambahkan kegiatan. Event terdekat yang aktif akan muncul sebagai countdown di seluruh halaman.
            </p>
          </div>
          <button className={styles.btnSave} onClick={openAddModal}>+ TAMBAH EVENT</button>
        </div>

        {events.length === 0 ? (
          <p className={styles.empty}>Belum ada event terdaftar.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul Kegiatan</th>
                  <th>Deskripsi</th>
                  <th>Tanggal & Waktu</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => {
                  const d = new Date(ev.date);
                  return (
                    <tr key={ev.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: "bold" }}>{ev.title}</td>
                      <td>{ev.description || "-"}</td>
                      <td>
                        {d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}<br/>
                        <span style={{ fontSize: "0.8rem", color: "#d4af37" }}>
                          Pukul {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          padding: "0.2rem 0.6rem", 
                          borderRadius: "12px", 
                          fontSize: "0.8rem", 
                          background: ev.isActive ? "rgba(46,213,115,0.2)" : "rgba(255,71,87,0.2)", 
                          color: ev.isActive ? "#2ed573" : "#ff4757" 
                        }}>
                          {ev.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button className={styles.btnApprove} onClick={() => openEditModal(ev)}>Edit</button>
                          <button className={styles.btnReject} onClick={() => handleDelete(ev.id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2>{editId ? "Edit Event" : "Tambah Event Baru"}</h2>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <label className={styles.formLabel}>Judul Kegiatan *</label>
                  <input required className={styles.formInput} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Rapat Koordinasi DPC" />
                </div>
                <div>
                  <label className={styles.formLabel}>Deskripsi</label>
                  <textarea className={styles.formInput} style={{ minHeight: "80px" }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Opsional..." />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Tanggal *</label>
                    <input required type="date" className={styles.formInput} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={styles.formLabel}>Waktu *</label>
                    <input required type="time" className={styles.formInput} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                  <label htmlFor="isActive" style={{ cursor: "pointer" }}>Aktif (Tampilkan di Countdown)</label>
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
