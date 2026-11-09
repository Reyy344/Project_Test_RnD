package main

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func loginAdminHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Metode tidak diizinkan")
		return
	}

	var q LoginRequest

	if err := decode(r, &q); err != nil {
		writeError(w, http.StatusBadRequest, "Data login tidak valid")
		return
	}

	q.Username = strings.TrimSpace(q.Username)

	if q.Username == "" || q.Password == "" {
		writeError(w, http.StatusBadRequest, "Username dan password wajib diisi")
		return
	}

	var hash string

	err := db.QueryRow(
		"SELECT password FROM admins WHERE username = ?",
		q.Username,
	).Scan(&hash)

	if err != nil {
		writeError(w, http.StatusUnauthorized, "Username atau password salah")
		return
	}

	if bcryptCompare([]byte(hash), []byte(q.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "Username atau password salah")
		return
	}

	b := make([]byte, 32)

	if _, err := rand.Read(b); err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal membuat sesi login")
		return
	}

	token := hex.EncodeToString(b)

	sessions.Store(token, time.Now().Add(8*time.Hour))

	writeJSON(w, http.StatusOK, APIResponse{
		Message: "Login berhasil!",
		Token:   token,
	})
}

func bcryptCompare(hash, password []byte) error {
	return bcrypt.CompareHashAndPassword(hash, password)
}

func adminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := strings.TrimSpace(
			strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "),
		)

		v, ok := sessions.Load(h)

		if !ok {
			writeError(w, http.StatusUnauthorized, "Sesi admin tidak valid atau telah berakhir")
			return
		}

		expiry, ok := v.(time.Time)

		if !ok || time.Now().After(expiry) {
			sessions.Delete(h)
			writeError(w, http.StatusUnauthorized, "Sesi admin telah berakhir")
			return
		}

		next.ServeHTTP(w, r)
	})
}
