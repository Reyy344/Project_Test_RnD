import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiX,
  FiRefreshCw,
  FiBookOpen,
} from "react-icons/fi";

const API = "http://localhost:8080/api";
type ClassItem = {
  id: number;
  namaMatkul: string;
  pengajar: string;
  jadwal: string;
  jamSelesai: string;
  ruangan: string;
  kodeSesi: string;
  linkModul: string;
  statusKelas: "Not Ready" | "Ongoing" | "Finished";
  jumlahHadir?: number;
};
type Attendee = {
  id: number;
  nim: string;
  namaLengkap: string;
  statusKehadiran: string;
  waktuAbsen?: string | null;
  waktuCheckOut?: string | null;
};
type FormData = Omit<ClassItem, "id" | "jumlahHadir">;
const emptyForm: FormData = {
  namaMatkul: "",
  pengajar: "",
  jadwal: "",
  jamSelesai: "",
  ruangan: "",
  kodeSesi: "",
  linkModul: "",
  statusKelas: "Not Ready",
};
const token = () => localStorage.getItem("cursor_admin_token") || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("cursor_admin_token");
    localStorage.removeItem("cursor_admin_logged_in");
    window.location.href = "/login";
    throw new Error("Sesi admin berakhir. Silakan login kembali.");
  }
  if (!response.ok)
    throw new Error(data.message || "Permintaan gagal diproses");
  return data as T;
}
const dateLabel = (value: string) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";
const statusLabel = (status: string) =>
  status === "Ongoing" ? "LIVE" : status === "Finished" ? "CLOSED" : "UPCOMING";

export const AdminPage = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [attendeeClass, setAttendeeClass] = useState<ClassItem | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeLoading, setAttendeeLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClasses(await request<ClassItem[]>("/admin/classes"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat kelas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    request<ClassItem[]>("/admin/classes")
      .then((data) => {
        if (!cancelled) {
          setClasses(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat kelas");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      classes.filter(
        (c) =>
          (filter === "All" || c.statusKelas === filter) &&
          `${c.namaMatkul} ${c.pengajar} ${c.ruangan}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [classes, filter, search],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };
  const openEdit = (item: ClassItem) => {
    setEditing(item.id);
    setForm({
      namaMatkul: item.namaMatkul,
      pengajar: item.pengajar,
      jadwal: item.jadwal,
      jamSelesai: item.jamSelesai,
      ruangan: item.ruangan,
      kodeSesi: item.kodeSesi,
      linkModul: item.linkModul,
      statusKelas: item.statusKelas,
    });
    setShowForm(true);
    setError("");
  };
  const saveClass = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request(editing ? `/admin/classes/${editing}` : "/admin/classes", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setNotice(
        editing
          ? "Data kelas berhasil diperbarui."
          : "Kelas baru berhasil ditambahkan.",
      );
      setShowForm(false);
      await loadClasses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan kelas");
    } finally {
      setSaving(false);
    }
  };
  const deleteClass = async (item: ClassItem) => {
    if (
      !window.confirm(
        `Hapus kelas "${item.namaMatkul}"? Seluruh data presensi kelas ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setError("");
    setNotice("");
    try {
      await request(`/admin/classes/${item.id}`, { method: "DELETE" });
      setNotice("Kelas berhasil dihapus.");
      await loadClasses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus kelas");
    }
  };
  const showAttendees = async (item: ClassItem) => {
    setAttendeeClass(item);
    setAttendees([]);
    setAttendeeLoading(true);
    try {
      setAttendees(await request<Attendee[]>(`/admin/classes/${item.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengambil peserta");
    } finally {
      setAttendeeLoading(false);
    }
  };
  const counts = {
    total: classes.length,
    live: classes.filter((c) => c.statusKelas === "Ongoing").length,
    finished: classes.filter((c) => c.statusKelas === "Finished").length,
    upcoming: classes.filter((c) => c.statusKelas === "Not Ready").length,
  };

  return (
    <div className="admin-shell">
      <section className="admin-wrap">
        <div className="admin-heading">
          <div>
            <p className="admin-eyebrow">CURSOR HUB / MANAGEMENT</p>
            <h1>Dashboard Admin</h1>
            <p className="admin-subtitle">
              Kelola jadwal kelas dan pantau kehadiran peserta.
            </p>
          </div>
          <button className="admin-primary" onClick={openCreate}>
            <FiPlus /> Tambah Kelas
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <span>Total Kelas</span>
            <strong>{counts.total}</strong>
            <small>Seluruh jadwal</small>
          </div>
          <div className="admin-stat">
            <span>Sedang Berlangsung</span>
            <strong>{counts.live}</strong>
            <small>
              <i className="status-dot live-dot" /> LIVE
            </small>
          </div>
          <div className="admin-stat">
            <span>Kelas Selesai</span>
            <strong>{counts.finished}</strong>
            <small>Modul dapat diakses</small>
          </div>
          <div className="admin-stat">
            <span>Belum Dimulai</span>
            <strong>{counts.upcoming}</strong>
            <small>Menunggu sesi</small>
          </div>
        </div>

        {notice && (
          <div className="admin-alert success">
            {notice}
            <button onClick={() => setNotice("")}>
              <FiX />
            </button>
          </div>
        )}
        {error && (
          <div className="admin-alert danger">
            {error}
            <button onClick={() => setError("")}>
              <FiX />
            </button>
          </div>
        )}

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Daftar Kelas</h2>
              <p>Atur informasi, status, dan data peserta kelas.</p>
            </div>
            <button
              className="admin-icon-btn"
              onClick={() => void loadClasses()}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
          <div className="admin-toolbar">
            <label className="admin-search">
              <FiSearch />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah, pengajar, ruangan..."
              />
            </label>
            <select
              className="admin-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">Semua Status</option>
              <option value="Not Ready">Belum Dimulai</option>
              <option value="Ongoing">Berlangsung</option>
              <option value="Finished">Selesai</option>
            </select>
          </div>
          {loading ? (
            <div className="admin-empty">Memuat data kelas...</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <FiBookOpen />
              <strong>Belum ada kelas ditemukan</strong>
              <span>Tambahkan kelas baru atau ubah kata pencarian.</span>
            </div>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kelas</th>
                    <th>Jadwal</th>
                    <th>Ruangan</th>
                    <th>Status</th>
                    <th>Peserta</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="class-name">{item.namaMatkul}</div>
                        <div className="class-meta">{item.pengajar}</div>
                      </td>
                      <td>
                        <div>{dateLabel(item.jadwal)}</div>
                        <div className="class-meta">
                          Selesai {item.jamSelesai}
                        </div>
                      </td>
                      <td>{item.ruangan}</td>
                      <td>
                        <span
                          className={`admin-status ${item.statusKelas.toLowerCase().replace(" ", "-")}`}
                        >
                          {item.statusKelas === "Ongoing" && (
                            <i className="status-dot live-dot" />
                          )}
                          {statusLabel(item.statusKelas)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="attendee-link"
                          onClick={() => void showAttendees(item)}
                        >
                          <FiUsers /> {item.jumlahHadir ?? 0} hadir penuh
                        </button>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-icon-btn"
                            title="Lihat peserta"
                            onClick={() => void showAttendees(item)}
                          >
                            <FiUsers />
                          </button>
                          <button
                            className="admin-icon-btn"
                            title="Edit kelas"
                            onClick={() => openEdit(item)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="admin-icon-btn danger-icon"
                            title="Hapus kelas"
                            onClick={() => void deleteClass(item)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="admin-table-foot">
            Menampilkan {filtered.length} dari {classes.length} kelas
          </div>
        </div>
      </section>

      {showForm && (
        <div
          className="admin-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <section className="admin-modal">
            <div className="admin-modal-head">
              <div>
                <p className="admin-eyebrow">DATA KELAS</p>
                <h2>{editing ? "Edit Kelas" : "Tambah Kelas Baru"}</h2>
              </div>
              <button
                className="admin-icon-btn"
                onClick={() => setShowForm(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={saveClass} className="admin-form">
              <label>
                Nama Mata Kuliah
                <input
                  required
                  maxLength={255}
                  value={form.namaMatkul}
                  onChange={(e) =>
                    setForm({ ...form, namaMatkul: e.target.value })
                  }
                  placeholder="Contoh: Basis Data"
                />
              </label>
              <label>
                Nama Pengajar
                <input
                  required
                  maxLength={255}
                  value={form.pengajar}
                  onChange={(e) =>
                    setForm({ ...form, pengajar: e.target.value })
                  }
                  placeholder="Nama dosen / pengajar"
                />
              </label>
              <div className="admin-form-grid">
                <label>
                  Tanggal & Jam
                  <input
                    required
                    type="datetime-local"
                    value={form.jadwal}
                    onChange={(e) =>
                      setForm({ ...form, jadwal: e.target.value })
                    }
                  />
                </label>
                <label>
                  Jam Selesai
                  <input
                    required
                    type="time"
                    value={form.jamSelesai}
                    onChange={(e) =>
                      setForm({ ...form, jamSelesai: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="admin-form-grid">
                <label>
                  Ruangan
                  <input
                    required
                    maxLength={100}
                    value={form.ruangan}
                    onChange={(e) =>
                      setForm({ ...form, ruangan: e.target.value })
                    }
                    placeholder="Contoh: Gedung D501"
                  />
                </label>
                <label>
                  Kode Sesi
                  <input
                    required
                    maxLength={50}
                    value={form.kodeSesi}
                    onChange={(e) =>
                      setForm({ ...form, kodeSesi: e.target.value })
                    }
                    placeholder="CURSOR-BASDAT-01"
                  />
                </label>
              </div>
              <label>
                Link Modul (URL)
                <input
                  required
                  type="url"
                  value={form.linkModul}
                  onChange={(e) =>
                    setForm({ ...form, linkModul: e.target.value })
                  }
                  placeholder="https://..."
                />
              </label>
              <label>
                Status Kelas
                <select
                  value={form.statusKelas}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      statusKelas: e.target.value as FormData["statusKelas"],
                    })
                  }
                >
                  <option value="Not Ready">Belum Dimulai</option>
                  <option value="Ongoing">Berlangsung (LIVE)</option>
                  <option value="Finished">Selesai (CLOSED)</option>
                </select>
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </button>
                <button className="admin-primary" disabled={saving}>
                  {saving
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan Perubahan"
                      : "Tambah Kelas"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {attendeeClass && (
        <div
          className="admin-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAttendeeClass(null);
          }}
        >
          <section className="admin-modal attendee-modal">
            <div className="admin-modal-head">
              <div>
                <p className="admin-eyebrow">LAPORAN KEHADIRAN</p>
                <h2>{attendeeClass.namaMatkul}</h2>
                <p className="admin-subtitle">
                  {attendeeClass.pengajar} · {attendeeClass.ruangan}
                </p>
              </div>
              <button
                className="admin-icon-btn"
                onClick={() => setAttendeeClass(null)}
              >
                <FiX />
              </button>
            </div>
            {attendeeLoading ? (
              <div className="admin-empty">Memuat peserta...</div>
            ) : attendees.length === 0 ? (
              <div className="admin-empty">
                <FiUsers />
                <strong>Belum ada peserta</strong>
                <span>
                  Data presensi akan muncul setelah mahasiswa Check-In.
                </span>
              </div>
            ) : (
              <div className="attendee-list">
                {attendees.map((a) => (
                  <div className="attendee-row" key={a.id}>
                    <div>
                      <strong>{a.namaLengkap}</strong>
                      <span>NIM {a.nim}</span>
                    </div>
                    <div className="attendee-right">
                      <span
                        className={`attendance-badge ${a.statusKehadiran === "Hadir Penuh" ? "complete" : "pending"}`}
                      >
                        {a.statusKehadiran === "Hadir Penuh"
                          ? "✓ Hadir Penuh"
                          : "Check-In"}
                      </span>
                      <small>{a.waktuAbsen || "-"}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="admin-modal-actions">
              <button
                className="admin-secondary"
                onClick={() => setAttendeeClass(null)}
              >
                Tutup
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
