"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import styles from "./dpc.module.css";

interface PacUser { id: string; name: string; role: string; }
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
}

interface Props {
  userName: string;
  pendingKta: number;
  pendingActivity: number;
  pacUsers: PacUser[];
  memberCountMap: Record<string, number>;
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
}

export default function DpcDashboardClient({ userName, pendingKta, pendingActivity, pacUsers, memberCountMap, totalMembers, maleCount, femaleCount, otherCount }: Props) {
  const [selectedPac, setSelectedPac] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Gender filter modal
  const [genderFilter, setGenderFilter] = useState<{ label: string; value: string } | null>(null);
  const [genderMembers, setGenderMembers] = useState<Member[]>([]);
  const [genderLoading, setGenderLoading] = useState(false);
  const [genderSearch, setGenderSearch] = useState("");

  const handleGenderClick = async (label: string, value: string) => {
    setGenderFilter({ label, value });
    setGenderLoading(true);
    setGenderSearch("");
    try {
      const res = await fetch(`/api/members?gender=${value}`);
      if (res.ok) setGenderMembers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setGenderLoading(false);
    }
  };

  const filteredGenderMembers = genderMembers.filter((m) => {
    const q = genderSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nik && m.nik.includes(q)) ||
      (m.nomorKta && m.nomorKta.toLowerCase().includes(q))
    );
  });

  // Helper: get PAC name by pacId
  const getPacName = (pacId: string) => pacUsers.find((p) => p.id === pacId)?.name ?? "-";

  const menus = [
    { icon: "🪪", title: "Kelola Pengajuan KTA", desc: "Setujui atau tolak pengajuan KTA dari semua PAC.", href: "/dpc/kta" },
    { icon: "📋", title: "Kelola Usulan Kegiatan", desc: "Balas usulan kegiatan dari semua PAC.", href: "/dpc/activity" },
    { icon: "👥", title: "Upload Daftar Anggota", desc: "Upload daftar anggota resmi untuk masing-masing PAC.", href: "/dpc/members" },
    { icon: "⚙️", title: "Kelola Akun PAC", desc: "Tambah, ubah, atau hapus akun PAC.", href: "/dpc/accounts" },
    { icon: "🗓️", title: "Kelola Event", desc: "Tambahkan kegiatan dan aktifkan countdown global.", href: "/dpc/events" },
  ];

  const pacColors = [
    { gradient: "linear-gradient(135deg, #667eea, #764ba2)", glow: "rgba(102,126,234,0.25)", accent: "#667eea" },
    { gradient: "linear-gradient(135deg, #f093fb, #f5576c)", glow: "rgba(240,147,251,0.25)", accent: "#f093fb" },
    { gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", glow: "rgba(79,172,254,0.25)", accent: "#4facfe" },
    { gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", glow: "rgba(67,233,123,0.25)", accent: "#43e97b" },
    { gradient: "linear-gradient(135deg, #fa709a, #fee140)", glow: "rgba(250,112,154,0.25)", accent: "#fa709a" },
    { gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", glow: "rgba(161,140,209,0.25)", accent: "#a18cd1" },
  ];

  const handlePacClick = async (pac: { id: string; name: string }) => {
    setSelectedPac(pac);
    setLoading(true);
    setSearchQuery("");
    try {
      const res = await fetch(`/api/members?pacId=${pac.id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        console.error("Failed to fetch members");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nik && m.nik.includes(q)) ||
      (m.nomorKta && m.nomorKta.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.greeting}>Selamat datang,</p>
        <h1 className={styles.title}>{userName}</h1>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pendingKta}</div>
          <div className={styles.statLabel}>KTA Menunggu</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pendingActivity}</div>
          <div className={styles.statLabel}>Usulan Kegiatan</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{pacUsers.length}</div>
          <div className={styles.statLabel}>Total PAC</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{totalMembers}</div>
          <div className={styles.statLabel}>Total Anggota</div>
        </div>
      </div>

      {/* Target & Gender Analysis Grid */}
      <div className={styles.sectionHeader} style={{ marginTop: "1.25rem" }}>
        <h2 className={styles.sectionTitle}>🎯 Analisis & Target Anggota</h2>
        <span className={styles.sectionSub}>Target DPC: 480 Anggota</span>
      </div>

      <div className={styles.statsGrid}>
        <div
          className={styles.statCard}
          style={{ borderLeft: "4px solid #f093fb", cursor: "pointer" }}
          onClick={() => handleGenderClick("Anggota Perempuan (P)", "P")}
          title="Klik untuk lihat daftar anggota perempuan"
        >
          <div className={styles.statNum} style={{ color: "#f093fb" }}>{femaleCount}</div>
          <div className={styles.statLabel}>Anggota Perempuan (P)</div>
          <div style={{ fontSize: "0.65rem", color: "#f093fb", marginTop: "4px", opacity: 0.7 }}>Klik untuk detail →</div>
        </div>
        <div
          className={styles.statCard}
          style={{ borderLeft: "4px solid #4facfe", cursor: "pointer" }}
          onClick={() => handleGenderClick("Anggota Laki-Laki (L)", "L")}
          title="Klik untuk lihat daftar anggota laki-laki"
        >
          <div className={styles.statNum} style={{ color: "#4facfe" }}>{maleCount}</div>
          <div className={styles.statLabel}>Anggota Laki-Laki (L)</div>
          <div style={{ fontSize: "0.65rem", color: "#4facfe", marginTop: "4px", opacity: 0.7 }}>Klik untuk detail →</div>
        </div>
        {otherCount > 0 && (
          <div
            className={styles.statCard}
            style={{ borderLeft: "4px solid #a0aec0", cursor: "pointer" }}
            onClick={() => handleGenderClick("Tidak Terklasifikasi", "other")}
            title="Klik untuk lihat anggota tanpa klasifikasi gender"
          >
            <div className={styles.statNum} style={{ color: "#a0aec0" }}>{otherCount}</div>
            <div className={styles.statLabel}>Tidak Terklasifikasi</div>
            <div style={{ fontSize: "0.65rem", color: "#a0aec0", marginTop: "4px", opacity: 0.7 }}>Klik untuk detail →</div>
          </div>
        )}
        <div className={styles.statCard} style={{ borderLeft: "4px solid #D4AF37" }}>
          <div className={styles.statNum} style={{ color: "#D4AF37" }}>480</div>
          <div className={styles.statLabel}>Target Anggota</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: `4px solid ${(480 - totalMembers) > 0 ? "#ff4757" : "#2ed573"}` }}>
          <div className={styles.statNum} style={{ color: (480 - totalMembers) > 0 ? "#ff4757" : "#2ed573" }}>
            {Math.max(0, 480 - totalMembers)}
          </div>
          <div className={styles.statLabel}>Kekurangan Target</div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>📊 Anggota per PAC</h2>
        <span className={styles.sectionSub}>{pacUsers.length} PAC terdaftar</span>
      </div>
      <div className={styles.pacGrid}>
        {pacUsers.map((pac, idx) => {
          const color = pacColors[idx % pacColors.length];
          const count = memberCountMap[pac.id] || 0;
          return (
            <div
              key={pac.id}
              className={styles.pacCard}
              style={{ boxShadow: `0 8px 30px ${color.glow}`, cursor: "pointer" }}
              onClick={() => handlePacClick({ id: pac.id, name: pac.name })}
            >
              <div className={styles.pacCardAccent} style={{ background: color.gradient }} />
              <div className={styles.pacCardBody}>
                <div className={styles.pacCardIcon} style={{ background: color.gradient }}>
                  👥
                </div>
                <div className={styles.pacCardInfo}>
                  <div className={styles.pacCardName}>{pac.name}</div>
                  <div className={styles.pacCardRole}>{pac.role}</div>
                  <span className={styles.clickHint}>Klik untuk detail →</span>
                </div>
                <div className={styles.pacCardCount} style={{ color: color.accent }}>
                  {count}
                </div>
                <div className={styles.pacCardCountLabel}>anggota</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.navGrid}>
        {menus.map(m => (
          <a key={m.href} href={m.href} className={styles.navCard}>
            <div className={styles.navIcon}>{m.icon}</div>
            <div className={styles.navTitle}>{m.title}</div>
            <div className={styles.navDesc}>{m.desc}</div>
            <div className={styles.navArrow}>Buka →</div>
          </a>
        ))}
      </div>

      <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
        Keluar
      </button>

      {selectedPac && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPac(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Daftar Anggota</h3>
                <p className={styles.modalSubtitle}>{selectedPac.name}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedPac(null)}>
                &times;
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIK, atau nomor KTA..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner} />
                  <p>Memuat data anggota...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <p className={styles.emptyText}>
                    {searchQuery ? "Tidak ada anggota yang cocok dengan pencarian." : "Belum ada data anggota untuk PAC ini."}
                  </p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.memberTable}>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>No. KTA</th>
                        <th>Nama Lengkap</th>
                        <th>NIK</th>
                        <th>No. HP</th>
                        <th>Gender</th>
                        <th>Alamat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m, idx) => (
                        <tr key={m.id}>
                          <td className={styles.textCenter}>{m.noUrut || idx + 1}</td>
                          <td>
                            {m.nomorKta ? (
                              <span className={styles.badgeKta}>{m.nomorKta}</span>
                            ) : (
                              <span className={styles.badgePending}>Belum Ada KTA</span>
                            )}
                          </td>
                          <td 
                            className={`${styles.textBold} ${styles.clickableName}`}
                            onClick={() => setSelectedMember(m)}
                            title="Klik untuk melihat detail lengkap"
                          >
                            {m.name}
                          </td>
                          <td>{m.nik || "-"}</td>
                          <td>{m.phone || "-"}</td>
                          <td>{m.gender || "-"}</td>
                          <td className={styles.textMuted}>
                            {m.address ? `${m.address}${m.village ? `, Kel. ${m.village}` : ""}${m.subDistrict ? `, Kec. ${m.subDistrict}` : ""}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.memberCountInfo}>
                Menampilkan <strong>{filteredMembers.length}</strong> dari <strong>{members.length}</strong> anggota
              </div>
              <button className={styles.closeModalFooterBtn} onClick={() => setSelectedPac(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Floating Modal for Member Detail */}
      {selectedMember && (
        <div className={styles.detailOverlay} onClick={() => setSelectedMember(null)}>
          <div className={styles.detailContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <h4 className={styles.detailTitle}>📄 Detail Lengkap Anggota</h4>
              <button className={styles.closeBtn} onClick={() => setSelectedMember(null)}>
                &times;
              </button>
            </div>
            
            <div className={styles.detailBody}>
              <div className={styles.detailCard}>
                <div className={styles.detailAvatar}>
                  {selectedMember.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <h3 className={styles.detailName}>{selectedMember.name}</h3>
                {selectedMember.nomorKta ? (
                  <span className={styles.detailKtaBadge}>KTA: {selectedMember.nomorKta}</span>
                ) : (
                  <span className={styles.detailPendingBadge}>Belum Ada KTA</span>
                )}
              </div>

              <div className={styles.infoGrid}>
                {/* Personal Info Group */}
                <div className={styles.infoGroup}>
                  <h5 className={styles.groupTitle}>👤 Informasi Pribadi</h5>
                  <div className={styles.infoRows}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nama Lengkap</span>
                      <span className={styles.infoValue}>{selectedMember.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>NIK</span>
                      <span className={styles.infoValue}>{selectedMember.nik || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Jenis Kelamin</span>
                      <span className={styles.infoValue}>
                        {selectedMember.gender === "L" ? "Laki-laki (L)" : selectedMember.gender === "P" ? "Perempuan (P)" : selectedMember.gender || "-"}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Tempat, Tgl Lahir</span>
                      <span className={styles.infoValue}>
                        {selectedMember.birthPlace || "-"}
                        {selectedMember.birthDate ? `, ${selectedMember.birthDate}` : ""}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Status Pernikahan</span>
                      <span className={styles.infoValue}>{selectedMember.maritalStatus || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Pekerjaan</span>
                      <span className={styles.infoValue}>{selectedMember.jobStatus || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>No. Handphone</span>
                      <span className={styles.infoValue}>{selectedMember.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Address & Status Group */}
                <div className={styles.infoGroup}>
                  <h5 className={styles.groupTitle}>📍 Informasi Wilayah & Status</h5>
                  <div className={styles.infoRows}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Alamat Lengkap</span>
                      <span className={styles.infoValue}>{selectedMember.address || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kelurahan</span>
                      <span className={styles.infoValue}>{selectedMember.village || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kecamatan</span>
                      <span className={styles.infoValue}>{selectedMember.subDistrict || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Status Verifikasi</span>
                      <span className={styles.infoValue}>
                        {selectedMember.isVerified ? (
                          <span className={styles.statusVerified}>✓ Terverifikasi</span>
                        ) : (
                          <span className={styles.statusUnverified}>⚠ Belum Terverifikasi</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nomor Urut</span>
                      <span className={styles.infoValue}>{selectedMember.noUrut || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.detailFooter}>
              <button className={styles.closeModalFooterBtn} onClick={() => setSelectedMember(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gender Filter Modal */}
      {genderFilter && (
        <div className={styles.modalOverlay} onClick={() => setGenderFilter(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {genderFilter.value === "P" ? "♀" : genderFilter.value === "L" ? "♂" : "⚪"} {genderFilter.label}
                </h3>
                <p className={styles.modalSubtitle}>
                  {genderLoading ? "Memuat..." : `${filteredGenderMembers.length} dari ${genderMembers.length} anggota`}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setGenderFilter(null)}>
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIK, atau nomor KTA..."
                  className={styles.searchInput}
                  value={genderSearch}
                  onChange={(e) => setGenderSearch(e.target.value)}
                />
              </div>

              {genderLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner} />
                  <p>Memuat data anggota...</p>
                </div>
              ) : filteredGenderMembers.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <p className={styles.emptyText}>
                    {genderSearch ? "Tidak ada anggota yang cocok dengan pencarian." : "Tidak ada data anggota."}
                  </p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.memberTable}>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>No. KTA</th>
                        <th>Nama Lengkap</th>
                        <th>NIK</th>
                        <th>No. HP</th>
                        <th>PAC</th>
                        <th>Kecamatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGenderMembers.map((m, idx) => (
                        <tr key={m.id}>
                          <td className={styles.textCenter}>{m.noUrut || idx + 1}</td>
                          <td>
                            {m.nomorKta ? (
                              <span className={styles.badgeKta}>{m.nomorKta}</span>
                            ) : (
                              <span className={styles.badgePending}>Belum Ada</span>
                            )}
                          </td>
                          <td
                            className={`${styles.textBold} ${styles.clickableName}`}
                            onClick={() => setSelectedMember(m)}
                            title="Klik untuk melihat detail lengkap"
                          >
                            {m.name}
                          </td>
                          <td>{m.nik || "-"}</td>
                          <td>{m.phone || "-"}</td>
                          <td style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
                            {getPacName(m.pacId)}
                          </td>
                          <td className={styles.textMuted}>{m.subDistrict || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.memberCountInfo}>
                Menampilkan <strong>{filteredGenderMembers.length}</strong> dari <strong>{genderMembers.length}</strong> anggota
              </div>
              <button className={styles.closeModalFooterBtn} onClick={() => setGenderFilter(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
