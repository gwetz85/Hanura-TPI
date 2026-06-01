"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./activity-detail.module.css";

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  date: string | null;
  time: string | null;
  location: string | null;
  activityType: string | null;
  reply: string | null;
  status: string;
  pac: { id: string; name: string; role: string };
  comments: Comment[];
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", icon: "⏳" },
  { value: "SEDANG_BERLANGSUNG", label: "Sedang Berlangsung", icon: "🔄" },
  { value: "SELESAI", label: "Selesai", icon: "✅" },
  { value: "BATAL", label: "Batal", icon: "🚫" },
];

const ACTIVITY_TYPES = ["Rapat Koordinasi", "Sosialisasi", "Musyawarah", "Bakti Sosial", "Pelatihan", "Kampanye", "Lainnya"];

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;
}

function getStatusIcon(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.icon ?? "📋";
}

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", date: "", time: "", location: "", activityType: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status change state
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id || status === "loading") return;
    if (!session) { router.push("/login"); return; }

    fetch(`/api/dpc/activity/${id}`)
      .then(r => r.json())
      .then(data => { setSuggestion(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, session, status, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [suggestion?.comments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dpc/activity/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pesan");
      const newComment = await res.json();
      setSuggestion(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
      setMessage("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSending(false);
    }
  };

  // Status change handler
  const handleStatusChange = async (newStatus: string) => {
    if (!suggestion || newStatus === suggestion.status || statusLoading) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/dpc/activity/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      const data = await res.json();
      setSuggestion(prev => prev ? { ...prev, status: data.status } : prev);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setStatusLoading(false);
    }
  };

  // Edit handlers
  const openEditModal = () => {
    if (!suggestion) return;
    setEditForm({
      title: suggestion.title,
      description: suggestion.description,
      date: suggestion.date ? new Date(suggestion.date).toISOString().split("T")[0] : "",
      time: suggestion.time || "",
      location: suggestion.location || "",
      activityType: suggestion.activityType || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editLoading) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/dpc/activity/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      const updated = await res.json();
      setSuggestion(updated);
      setShowEditModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (deleteLoading) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/dpc/activity/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus kegiatan");
      router.push(backHref);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const backHref = ["DPC", "ADMIN"].includes(session?.user?.role as string) ? "/dpc/activity" : "/pac/activity";
  const isDpc = ["DPC", "ADMIN"].includes(session?.user?.role as string);
  const isOwner = suggestion?.pac.id === session?.user?.id;
  const canChangeStatus = isDpc || isOwner;

  if (status === "loading" || loading) return (
    <div className={styles.container}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Memuat data...</p>
      </div>
    </div>
  );

  if (!suggestion) return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <a href={backHref} className={styles.backLink}>← Kembali</a>
        <p style={{ color: "#ff4757", textAlign: "center" }}>Data tidak ditemukan.</p>
      </div>
    </div>
  );

  const myId = session?.user?.id;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* LEFT PANEL - Detail */}
        <div className={styles.detailPanel}>
          <a href={backHref} className={styles.backLink}>← Kembali</a>

          <div className={styles.detailHeader}>
            <div>
              <span className={`${styles.badge} ${styles[suggestion.status]}`}>
                {getStatusIcon(suggestion.status)} {getStatusLabel(suggestion.status)}
              </span>
              <h1 className={styles.title}>{suggestion.title}</h1>
              <p className={styles.meta}>
                Diusulkan oleh <strong>{suggestion.pac.name}</strong> · {new Date(suggestion.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionBar}>
              {/* Status Dropdown */}
              {canChangeStatus && (
                <div className={styles.statusDropdownWrap}>
                  <label className={styles.statusLabel}>Status:</label>
                  <select
                    className={styles.statusSelect}
                    value={suggestion.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={statusLoading}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Edit & Delete - DPC/ADMIN only */}
              {isDpc && (
                <div className={styles.actionButtons}>
                  <button className={styles.btnEdit} onClick={openEditModal}>
                    ✏️ Edit
                  </button>
                  <button className={styles.btnDelete} onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ Hapus
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Detail Fields */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📅</span>
              <div>
                <div className={styles.detailLabel}>Tanggal Kegiatan</div>
                <div className={styles.detailValue}>
                  {suggestion.date ? new Date(suggestion.date).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Belum ditentukan"}
                </div>
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🕐</span>
              <div>
                <div className={styles.detailLabel}>Waktu Kegiatan</div>
                <div className={styles.detailValue}>{suggestion.time || "Belum ditentukan"}</div>
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📍</span>
              <div>
                <div className={styles.detailLabel}>Lokasi Kegiatan</div>
                <div className={styles.detailValue}>{suggestion.location || "Belum ditentukan"}</div>
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🏷️</span>
              <div>
                <div className={styles.detailLabel}>Jenis Kegiatan</div>
                <div className={styles.detailValue}>{suggestion.activityType || "Belum ditentukan"}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.descBox}>
            <div className={styles.descLabel}>📄 Deskripsi Kegiatan</div>
            <p className={styles.descText}>{suggestion.description}</p>
          </div>

          {/* DPC Reply */}
          {suggestion.reply && (
            <div className={styles.replyBox}>
              <div className={styles.replyLabel}>💬 Balasan DPC</div>
              <p className={styles.replyText}>{suggestion.reply}</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Comments Chat */}
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span className={styles.chatIcon}>💬</span>
            <div>
              <div className={styles.chatTitle}>Diskusi Kegiatan</div>
              <div className={styles.chatSubtitle}>{suggestion.comments.length} pesan</div>
            </div>
          </div>

          <div className={styles.chatMessages}>
            {suggestion.comments.length === 0 ? (
              <div className={styles.chatEmpty}>
                <span>🗨️</span>
                <p>Belum ada diskusi. Mulai diskusi dengan mengirim pesan!</p>
              </div>
            ) : (
              suggestion.comments.map(comment => {
                const isMe = comment.author.id === myId;
                const isDpcAuthor = comment.author.role === "DPC";
                return (
                  <div key={comment.id} className={`${styles.messageBubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                    {!isMe && (
                      <div className={styles.avatarSmall}>
                        {comment.author.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMeColor : isDpcAuthor ? styles.bubbleDpcColor : styles.bubblePacColor}`}>
                      {!isMe && <div className={styles.bubbleAuthor}>{comment.author.name} {isDpcAuthor ? "· DPC" : "· PAC"}</div>}
                      <p className={styles.bubbleText}>{comment.message}</p>
                      <div className={styles.bubbleTime}>
                        {new Date(comment.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {new Date(comment.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form className={styles.chatInput} onSubmit={handleSendComment}>
            <textarea
              className={styles.chatTextarea}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tulis pesan diskusi..."
              rows={2}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(e as unknown as React.FormEvent); } }}
            />
            <button type="submit" className={styles.chatSendBtn} disabled={!message.trim() || sending}>
              {sending ? "..." : "➤"}
            </button>
          </form>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>✏️ Edit Kegiatan</h2>
              <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Judul Kegiatan *</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.modalField}>
                <label>Deskripsi *</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  required
                  rows={4}
                  className={styles.modalTextarea}
                />
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label>Tanggal</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.modalField}>
                  <label>Waktu</label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                    className={styles.modalInput}
                  />
                </div>
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label>Lokasi</label>
                  <input
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Contoh: Kantor DPC"
                    className={styles.modalInput}
                  />
                </div>
                <div className={styles.modalField}>
                  <label>Jenis Kegiatan</label>
                  <select
                    value={editForm.activityType}
                    onChange={e => setEditForm({ ...editForm, activityType: e.target.value })}
                    className={styles.modalSelect}
                  >
                    <option value="">Pilih Jenis</option>
                    {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className={styles.btnSave} disabled={editLoading}>
                  {editLoading ? "Menyimpan..." : "💾 Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.deleteModal} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteIcon}>🗑️</div>
            <h3 className={styles.deleteTitle}>Hapus Kegiatan?</h3>
            <p className={styles.deleteText}>
              Apakah Anda yakin ingin menghapus kegiatan <strong>&quot;{suggestion.title}&quot;</strong>? Semua diskusi terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className={styles.deleteActions}>
              <button className={styles.btnCancel} onClick={() => setShowDeleteConfirm(false)}>Batal</button>
              <button className={styles.btnDeleteConfirm} onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
