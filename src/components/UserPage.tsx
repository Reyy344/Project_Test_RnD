import { type FormEvent, useEffect, useState } from "react";
import {
  RiArrowRightLine,
  RiCalendar2Line,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiLock2Line,
  RiMapPin2Line,
  RiTimeLine,
} from "react-icons/ri";

type CursorClass = {
  id: number;
  namaMatkul: string;
  jumlahHadir: number;
  pengajar: string;
  jadwal: string;
  jamSelesai: string;
  ruangan: string;
  kodeSesi: string;
  linkModul: string;
  statusKelas: "Not Ready" | "Ongoing" | "Finished";
};

type AttendanceResponse = {
  message: string;
  classId?: number;
};

const statusStyle = {
  "Not Ready": {
    label: "BELUM MULAI",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  Ongoing: {
    label: "LIVE",
    className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  Finished: {
    label: "CLOSED",
    className: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));

export const UserPage = () => {
  const [classes, setClasses] = useState<CursorClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<CursorClass | null>(null);
  const [attendanceTab, setAttendanceTab] = useState<"check-in" | "check-out">(
    "check-in",
  );
  const [checkInName, setCheckInName] = useState("");
  const [checkInNim, setCheckInNim] = useState("");
  const [checkOutNim, setCheckOutNim] = useState("");
  const [checkOutCode, setCheckOutCode] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [isAttendanceSuccess, setIsAttendanceSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function getClasses() {
      try {
        const response = await fetch("http://localhost:8080/api/classes");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setClasses(data);
      } catch {
        setError("Kelas belum dapat dimuat. Pastikan backend Go menyala.");
      } finally {
        setLoading(false);
      }
    }

    getClasses();
  }, []);

  const filteredClasses = classes.filter((item) =>
    item.namaMatkul.toLowerCase().includes(search.toLowerCase()),
  );

  const openAttendance = (item: CursorClass) => {
    setSelectedClass(item);
    setAttendanceTab("check-in");
    setAttendanceMessage("");
    setIsAttendanceSuccess(false);
  };

  const handleCheckIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClass) return;

    setSubmitting(true);
    setAttendanceMessage("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/attendance/check-in",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: selectedClass.id,
            namaLengkap: checkInName,
            nim: checkInNim,
          }),
        },
      );
      const data: AttendanceResponse = await response.json();

      setIsAttendanceSuccess(response.ok);
      setAttendanceMessage(data.message);

      if (response.ok) {
        setCheckInName("");
        setCheckInNim("");
      }
    } catch {
      setIsAttendanceSuccess(false);
      setAttendanceMessage("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const cursor_ConfirmtOExit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cursor_Session_Token = checkOutCode.trim();

    setSubmitting(true);
    setAttendanceMessage("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/attendance/check-out",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nim: checkOutNim,
            kodeSesi: cursor_Session_Token,
          }),
        },
      );
      const data: AttendanceResponse = await response.json();

      setIsAttendanceSuccess(response.ok);
      setAttendanceMessage(data.message);

      if (response.ok && data.classId) {
        setClasses((currentClasses) =>
          currentClasses.map((item) =>
            item.id === data.classId
              ? { ...item, jumlahHadir: item.jumlahHadir + 1 }
              : item,
          ),
        );
        setCheckOutNim("");
        setCheckOutCode("");
      }
    } catch {
      setIsAttendanceSuccess(false);
      setAttendanceMessage("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="px-8 py-6 md:px-9">
        <div className="relative overflow-hidden rounded-3xl border border-gray-600 bg-[#080c14] p-8 md:p-12 lg:p-14">
          <img
            src="https://hmif.umn.ac.id/assets/WorkProgram/cursor/img4.webp"
            className="absolute inset-0 z-0 h-full w-full object-cover object-center opacity-35"
            alt=""
          />

          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#070a12] via-[#070a12]/85 to-[#070a12]/40" />

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1.5 backdrop-blur-sm">
                <span className="text-xs text-emerald-400">✦</span>
                <span className="font-mono text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
                  Ruang Belajar Digital HMIF
                </span>
              </div>

              <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[54px]">
                Akses Absen Cursor,
                <span className="mt-1 block bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  dengan lebih mudah!
                </span>
              </h1>

              <p className="max-w-xl pt-1 text-justify text-sm leading-relaxed text-slate-300/80 md:text-base">
                Selamat datang di CURSOR Hub, platform inovatif yang dirancang
                untuk memudahkan akses absen bagi anggota HMIF. Dengan antarmuka
                yang intuitif dan fitur-fitur canggih, CURSOR Hub memastikan
                pengalaman pengguna yang lancar dan efisien.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-6 md:px-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[40px]">
            Pilih Kelas Yang Tersedia:
          </h1>

          <input
            type="text"
            placeholder="Cari mata kuliah..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-600 bg-[#080c14] px-4 py-3 text-slate-300 outline-none placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 lg:w-72"
          />
        </div>

        <div className="py-8">
          {loading && <p className="text-slate-400">Memuat kelas...</p>}
          {error && <p className="text-red-400">{error}</p>}

          {!loading && !error && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredClasses.map((item) => {
                const status = statusStyle[item.statusKelas];
                const isFinished = item.statusKelas === "Finished";
                const isOngoing = item.statusKelas === "Ongoing";

                return (
                  <article
                    key={item.id}
                    className="cursor-card-glow rounded-3xl border border-slate-700/80 bg-[#0b1220] p-6 text-white shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold tracking-[0.16em] ${status.className}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {status.label}
                      </span>

                      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-400">
                        <RiGroupLine className="text-lg" />
                        {item.jumlahHadir ?? 0} hadir
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight">
                      {item.namaMatkul}
                    </h2>
                    <p className="mt-3 text-base text-slate-400">
                      oleh {item.pengajar}
                    </p>

                    <div className="my-6 h-px bg-slate-700/80" />

                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex items-center gap-3">
                        <RiCalendar2Line className="shrink-0 text-xl text-cyan-400" />
                        <span>{formatDate(item.jadwal)}</span>
                        <RiTimeLine className="ml-auto shrink-0 text-xl text-cyan-400" />
                        <span>
                          {formatTime(item.jadwal)}–
                          {item.jamSelesai.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiMapPin2Line className="shrink-0 text-xl text-cyan-400" />
                        <span>{item.ruangan}</span>
                      </div>
                    </div>

                    {isFinished ? (
                      <a
                        href={item.linkModul}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-300"
                      >
                        Download modul
                        <RiExternalLinkLine className="text-xl" />
                      </a>
                    ) : isOngoing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openAttendance(item)}
                          className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-sky-400"
                        >
                          Buka Presensi
                          <RiArrowRightLine className="text-xl" />
                        </button>
                        <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
                          <RiLock2Line className="text-base" />
                          Modul dibuka setelah sesi ditutup 🔒
                        </p>
                      </>
                    ) : (
                      <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3.5 text-center text-sm font-semibold text-slate-400">
                        <RiLock2Line className="text-lg" />
                        Modul dibuka setelah sesi ditutup 🔒
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredClasses.length === 0 && (
            <p className="text-slate-400">
              Kelas yang kamu cari belum tersedia.
            </p>
          )}
        </div>
      </section>

      {selectedClass && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          onMouseDown={() => setSelectedClass(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0b1220] p-6 text-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-400 uppercase">
                  CURSOR / PRESENSI
                </p>
                <h2
                  id="attendance-title"
                  className="mt-2 text-2xl font-extrabold"
                >
                  {selectedClass.namaMatkul}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup presensi"
                onClick={() => setSelectedClass(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => {
                  setAttendanceTab("check-in");
                  setAttendanceMessage("");
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  attendanceTab === "check-in"
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Check-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceTab("check-out");
                  setAttendanceMessage("");
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  attendanceTab === "check-out"
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Check-Out
              </button>
            </div>

            {attendanceTab === "check-in" ? (
              <form
                id="cursors-attendances-forms"
                className="mt-6 space-y-5"
                onSubmit={handleCheckIn}
              >
                <div>
                  <h3 className="text-lg font-bold">Check-In Kelas</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Isi identitasmu sebelum mulai. Satu NIM hanya dapat masuk
                    satu kali untuk setiap sesi.
                  </p>
                </div>

                <label className="block text-sm font-semibold text-slate-200">
                  Nama Lengkap
                  <input
                    name="namaLengkap"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={checkInName}
                    onChange={(event) => setCheckInName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  NIM
                  <input
                    name="nim"
                    required
                    placeholder="Contoh: 00000123456ch"
                    value={checkInNim}
                    onChange={(event) => setCheckInNim(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </label>

                {attendanceMessage && (
                  <p
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isAttendanceSuccess
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-red-400/30 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {attendanceMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-sky-400"
                >
                  {submitting ? "Memproses..." : "Masuk Kelas CURSOR"}
                  <RiArrowRightLine className="text-xl" />
                </button>
              </form>
            ) : (
              <form
                id="cursors-attendances-forms"
                className="mt-6 space-y-5"
                onSubmit={cursor_ConfirmtOExit}
              >
                <div>
                  <h3 className="text-lg font-bold">Check-Out Kelas</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Masukkan NIM yang sama dan kode sesi dari pengajar untuk
                    mengubah statusmu menjadi <strong>Hadir Penuh</strong>.
                  </p>
                </div>

                <label className="block text-sm font-semibold text-slate-200">
                  NIM
                  <input
                    name="nim"
                    required
                    placeholder="Contoh: 00000123456"
                    value={checkOutNim}
                    onChange={(event) => setCheckOutNim(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  Kode Sesi
                  <input
                    name="kodeSesi"
                    required
                    placeholder="Masukkan kode dari pengajar"
                    value={checkOutCode}
                    onChange={(event) => setCheckOutCode(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  />
                </label>

                {attendanceMessage && (
                  <p
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isAttendanceSuccess
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-red-400/30 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {attendanceMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-300"
                >
                  {submitting ? "Memproses..." : "Konfirmasi Keluar Sesi"}
                  <RiArrowRightLine className="text-xl" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
