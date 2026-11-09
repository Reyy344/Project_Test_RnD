// HMIF-RnD-26Ch
package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

type APIResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	ClassID int    `json:"classId,omitempty"`
}

type Class struct {
	ID            int    `json:"id"`
	NamaMatkul    string `json:"namaMatkul"`
	JumlahHadir   int    `json:"jumlahHadir"`
	JumlahPeserta int    `json:"jumlahPeserta"`
	Pengajar      string `json:"pengajar"`
	Jadwal        string `json:"jadwal"`
	JamSelesai    string `json:"jamSelesai"`
	Ruangan       string `json:"ruangan"`
	KodeSesi      string `json:"kodeSesi"`
	LinkModul     string `json:"linkModul"`
	StatusKelas   string `json:"statusKelas"`
}

type Attendee struct {
	ID              int     `json:"id"`
	NIM             string  `json:"nim"`
	NamaLengkap     string  `json:"namaLengkap"`
	StatusKehadiran string  `json:"statusKehadiran"`
	WaktuAbsen      *string `json:"waktuAbsen"`
	WaktuCheckOut   *string `json:"waktuCheckOut"`
}

type ClassRequest struct {
	NamaMatkul  string `json:"namaMatkul"`
	Pengajar    string `json:"pengajar"`
	Jadwal      string `json:"jadwal"`
	JamSelesai  string `json:"jamSelesai"`
	Ruangan     string `json:"ruangan"`
	KodeSesi    string `json:"kodeSesi"`
	LinkModul   string `json:"linkModul"`
	StatusKelas string `json:"statusKelas"`
}

type CheckInRequest struct {
	ClassID     int    `json:"classId"`
	NamaLengkap string `json:"namaLengkap"`
	NIM         string `json:"nim"`
}

type CheckOutRequest struct {
	NIM      string `json:"nim"`
	KodeSesi string `json:"kodeSesi"`
}

var sessions sync.Map

func connectDB() (*sql.DB, error) {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		user := env("DB_USER", "root")
		pass := os.Getenv("DB_PASSWORD")
		host := env("DB_HOST", "127.0.0.1:3306")
		name := env("DB_NAME", "cursor_hub")
		dsn = user + ":" + url.QueryEscape(pass) + "@tcp(" + host + ")/" + name + "?parseTime=true&loc=Asia%2FJakarta&charset=utf8mb4"
	}
	database, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	database.SetMaxOpenConns(10)
	database.SetMaxIdleConns(5)
	database.SetConnMaxLifetime(5 * time.Minute)
	if err = database.Ping(); err != nil {
		return nil, err
	}
	return database, nil
}

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, APIResponse{Message: message})
}

func decode(r *http.Request, v any) error {
	d := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	d.DisallowUnknownFields()
	return d.Decode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, 405, "Metode tidak diizinkan")
		return
	}
	writeJSON(w, 200, map[string]string{"message": "CURSOR Hub API is running"})
}

func classesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, 405, "Metode tidak diizinkan")
		return
	}
	rows, err := db.Query(`SELECT c.id,c.nama_matkul,c.pengajar,c.jadwal,c.jam_selesai,c.ruangan,c.kode_sesi,c.link_modul,c.status_kelas,COUNT(a.id) FROM classes c LEFT JOIN cursor_attendees_logch a ON a.class_id=c.id AND a.status_kehadiran='Hadir Penuh' GROUP BY c.id ORDER BY c.jadwal ASC`)
	if err != nil {
		log.Printf("classes: %v", err)
		writeError(w, 500, "Gagal mengambil data kelas")
		return
	}
	defer rows.Close()
	out := []Class{}
	for rows.Next() {
		var c Class
		var jadwal time.Time
		var selesai string
		if err = rows.Scan(&c.ID, &c.NamaMatkul, &c.Pengajar, &jadwal, &selesai, &c.Ruangan, &c.KodeSesi, &c.LinkModul, &c.StatusKelas, &c.JumlahHadir); err != nil {
			writeError(w, 500, "Gagal memproses data kelas")
			return
		}
		c.Jadwal = jadwal.Format("2006-01-02T15:04")
		c.JamSelesai = selesai
		c.JumlahPeserta = c.JumlahHadir
		out = append(out, c)
	}
	writeJSON(w, 200, out)
}

func checkInHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, 405, "Metode tidak diizinkan")
		return
	}
	var q CheckInRequest
	if decode(r, &q) != nil {
		writeError(w, 400, "Data Check-In tidak valid")
		return
	}
	q.NamaLengkap = strings.TrimSpace(q.NamaLengkap)
	q.NIM = strings.TrimSpace(q.NIM)
	if q.ClassID < 1 || q.NamaLengkap == "" || q.NIM == "" {
		writeError(w, 400, "Nama lengkap dan NIM wajib diisi")
		return
	}
	var status string
	err := db.QueryRow("SELECT status_kelas FROM classes WHERE id=?", q.ClassID).Scan(&status)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, 404, "Kelas CURSOR tidak ditemukan")
		return
	}
	if err != nil {
		writeError(w, 500, "Gagal memeriksa kelas")
		return
	}
	if status == "Finished" {
		writeError(w, 409, "Sesi CURSOR telah ditutup (kode: E-SES-410).")
		return
	}
	if status != "Ongoing" {
		writeError(w, 409, "Presensi hanya dibuka saat kelas berlangsung")
		return
	}
	_, err = db.Exec("INSERT INTO cursor_attendees_logch (class_id,nim,nama_lengkap,status_kehadiran) VALUES (?,?,?,'Check-In')", q.ClassID, q.NIM, q.NamaLengkap)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			writeError(w, 409, "NIM sudah terdaftar di sesi CURSOR ini (kode: E-CIN-409).")
			return
		}
		log.Printf("checkin: %v", err)
		writeError(w, 500, "Gagal menyimpan Check-In")
		return
	}
	writeJSON(w, 201, APIResponse{Message: "Selamat datang di CURSOR, semangat belajarnya! Cihuy", ClassID: q.ClassID})
}

func checkOutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, 405, "Metode tidak diizinkan")
		return
	}
	var q CheckOutRequest
	if decode(r, &q) != nil {
		writeError(w, 400, "Data Check-Out tidak valid")
		return
	}
	q.NIM = strings.TrimSpace(q.NIM)
	q.KodeSesi = strings.TrimSpace(q.KodeSesi)
	if q.NIM == "" || q.KodeSesi == "" {
		writeError(w, 400, "NIM dan kode sesi wajib diisi")
		return
	}
	var id int
	err := db.QueryRow("SELECT id FROM classes WHERE kode_sesi=?", q.KodeSesi).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, 401, "Kode sesi tidak valid (kode: E-COUT-401).")
		return
	}
	if err != nil {
		writeError(w, 500, "Gagal memeriksa kode sesi")
		return
	}
	res, err := db.Exec("UPDATE cursor_attendees_logch SET status_kehadiran='Hadir Penuh',waktu_check_out=CURRENT_TIMESTAMP WHERE class_id=? AND nim=? AND status_kehadiran='Check-In'", id, q.NIM)
	if err != nil {
		writeError(w, 500, "Gagal memproses Check-Out")
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		writeError(w, 404, "NIM belum tercatat melakukan Check-In di sesi CURSOR ini")
		return
	}
	writeJSON(w, 200, APIResponse{Message: "Check-Out berhasil. Status kehadiranmu: Hadir Penuh ✓", ClassID: id})
}

func adminClassesHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		rows, err := db.Query("SELECT id,nama_matkul,pengajar,jadwal,jam_selesai,ruangan,kode_sesi,link_modul,status_kelas FROM classes ORDER BY jadwal DESC")
		if err != nil {
			writeError(w, 500, "Gagal mengambil kelas")
			return
		}
		defer rows.Close()
		out := []Class{}
		for rows.Next() {
			var c Class
			var dt time.Time
			if err = rows.Scan(&c.ID, &c.NamaMatkul, &c.Pengajar, &dt, &c.JamSelesai, &c.Ruangan, &c.KodeSesi, &c.LinkModul, &c.StatusKelas); err != nil {
				writeError(w, 500, "Gagal membaca kelas")
				return
			}
			c.Jadwal = dt.Format("2006-01-02T15:04")
			out = append(out, c)
		}
		writeJSON(w, 200, out)
	case http.MethodPost:
		var q ClassRequest
		if decode(r, &q) != nil {
			writeError(w, 400, "Data kelas tidak valid")
			return
		}
		if !validClass(q) {
			writeError(w, 400, "Lengkapi seluruh data kelas dengan format yang benar")
			return
		}
		dt, err := time.ParseInLocation("2006-01-02T15:04", q.Jadwal, time.Local)
		if err != nil {
			writeError(w, 400, "Format jadwal tidak valid")
			return
		}
		res, err := db.Exec("INSERT INTO classes(nama_matkul,pengajar,jadwal,jam_selesai,ruangan,kode_sesi,link_modul,status_kelas) VALUES(?,?,?,?,?,?,?,?)", strings.TrimSpace(q.NamaMatkul), strings.TrimSpace(q.Pengajar), dt, strings.TrimSpace(q.JamSelesai), strings.TrimSpace(q.Ruangan), strings.TrimSpace(q.KodeSesi), strings.TrimSpace(q.LinkModul), q.StatusKelas)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				writeError(w, 409, "Kode sesi sudah digunakan")
				return
			}
			log.Printf("create class: %v", err)
			writeError(w, 500, "Gagal menambahkan kelas")
			return
		}
		id, _ := res.LastInsertId()
		writeJSON(w, 201, APIResponse{Message: "Kelas berhasil ditambahkan", ClassID: int(id)})
	default:
		writeError(w, 405, "Metode tidak diizinkan")
	}
}
func validClass(q ClassRequest) bool {
	q.NamaMatkul = strings.TrimSpace(q.NamaMatkul)
	q.Pengajar = strings.TrimSpace(q.Pengajar)
	q.Ruangan = strings.TrimSpace(q.Ruangan)
	q.KodeSesi = strings.TrimSpace(q.KodeSesi)
	q.LinkModul = strings.TrimSpace(q.LinkModul)
	if q.NamaMatkul == "" || q.Pengajar == "" || q.Ruangan == "" || q.KodeSesi == "" || q.JamSelesai == "" {
		return false
	}
	if q.StatusKelas != "Not Ready" && q.StatusKelas != "Ongoing" && q.StatusKelas != "Finished" {
		return false
	}
	if _, err := time.ParseInLocation("2006-01-02T15:04", q.Jadwal, time.Local); err != nil {
		return false
	}
	u, err := url.ParseRequestURI(q.LinkModul)
	return err == nil && (u.Scheme == "https" || u.Scheme == "http") && u.Host != ""
}
func adminClassItemHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/classes/"), "/"))
	if err != nil || id < 1 {
		writeError(w, 400, "ID kelas tidak valid")
		return
	}
	switch r.Method {
	case http.MethodGet:
		rows, err := db.Query("SELECT id,nim,nama_lengkap,status_kehadiran,DATE_FORMAT(waktu_absen,'%Y-%m-%d %H:%i:%s'),DATE_FORMAT(waktu_check_out,'%Y-%m-%d %H:%i:%s') FROM cursor_attendees_logch WHERE class_id=? ORDER BY waktu_absen DESC", id)
		if err != nil {
			writeError(w, 500, "Gagal mengambil peserta")
			return
		}
		defer rows.Close()
		out := []Attendee{}
		for rows.Next() {
			var a Attendee
			var in, outTime sql.NullString
			if err = rows.Scan(&a.ID, &a.NIM, &a.NamaLengkap, &a.StatusKehadiran, &in, &outTime); err != nil {
				writeError(w, 500, "Gagal membaca peserta")
				return
			}
			if in.Valid {
				a.WaktuAbsen = &in.String
			}
			if outTime.Valid {
				a.WaktuCheckOut = &outTime.String
			}
			out = append(out, a)
		}
		writeJSON(w, 200, out)
	case http.MethodPut:
		var q ClassRequest
		if decode(r, &q) != nil || !validClass(q) {
			writeError(w, 400, "Data kelas tidak valid atau belum lengkap")
			return
		}
		dt, _ := time.ParseInLocation("2006-01-02T15:04", q.Jadwal, time.Local)
		res, err := db.Exec("UPDATE classes SET nama_matkul=?,pengajar=?,jadwal=?,jam_selesai=?,ruangan=?,kode_sesi=?,link_modul=?,status_kelas=? WHERE id=?", strings.TrimSpace(q.NamaMatkul), strings.TrimSpace(q.Pengajar), dt, strings.TrimSpace(q.JamSelesai), strings.TrimSpace(q.Ruangan), strings.TrimSpace(q.KodeSesi), strings.TrimSpace(q.LinkModul), q.StatusKelas, id)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				writeError(w, 409, "Kode sesi sudah digunakan kelas lain")
				return
			}
			writeError(w, 500, "Gagal memperbarui kelas")
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			var exists int
			if db.QueryRow("SELECT id FROM classes WHERE id=?", id).Scan(&exists) != nil {
				writeError(w, 404, "Kelas tidak ditemukan")
				return
			}
		}
		writeJSON(w, 200, APIResponse{Message: "Kelas berhasil diperbarui"})
	case http.MethodDelete:
		res, err := db.Exec("DELETE FROM classes WHERE id=?", id)
		if err != nil {
			writeError(w, 500, "Gagal menghapus kelas")
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			writeError(w, 404, "Kelas tidak ditemukan")
			return
		}
		writeJSON(w, 200, APIResponse{Message: "Kelas berhasil dihapus"})
	default:
		writeError(w, 405, "Metode tidak diizinkan")
	}
}
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func main() {
	var err error
	db, err = connectDB()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", healthHandler)
	mux.HandleFunc("/api/classes", classesHandler)
	mux.HandleFunc("/api/attendance/check-in", checkInHandler)
	mux.HandleFunc("/api/attendance/check-out", checkOutHandler)
	mux.HandleFunc("/api/admin/login", loginAdminHandler)
	mux.Handle("/api/admin/classes", adminAuth(http.HandlerFunc(adminClassesHandler)))
	mux.Handle("/api/admin/classes/", adminAuth(http.HandlerFunc(adminClassItemHandler)))
	log.Println("CURSOR Hub API running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
