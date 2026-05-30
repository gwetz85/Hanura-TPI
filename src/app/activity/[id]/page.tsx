"use client";
import { useState, useEffect, useRef } from "react";
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

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const backHref = ["DPC", "ADMIN"].includes(session?.user?.role as string) ? "/dpc/activity" : "/pac/activity";

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

  const isDpc = ["DPC", "ADMIN"].includes(session?.user?.role as string);
  const myId = session?.user?.id;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* LEFT PANEL - Detail */}
        <div className={styles.detailPanel}>
          <a href={backHref} className={styles.backLink}>← Kembali</a>

          <div className={styles.detailHeader}>
            <div>
              <span className={`${styles.badge} ${styles[suggestion.status]}`}>{suggestion.status}</span>
              <h1 className={styles.title}>{suggestion.title}</h1>
              <p className={styles.meta}>
                Diusulkan oleh <strong>{suggestion.pac.name}</strong> · {new Date(suggestion.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
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
    </div>
  );
}
