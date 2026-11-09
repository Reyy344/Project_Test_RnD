# CURSOR Hub

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Go, net/http
- Database: MySQL

## Menjalankan project
1. Import `cursor_hub.sql` ke MySQL.
2. Atur environment variable backend (Go tidak otomatis membaca file `.env`):
   - `DB_HOST=127.0.0.1:3306`
   - `DB_USER=root`
   - `DB_PASSWORD=` (sesuaikan)
   - `DB_NAME=cursor_hub`
   Alternatif: isi `DB_DSN` langsung sesuai format DSN MySQL.
3. Jalankan backend dari folder `backend` dengan `go run .` (gunakan Go sesuai versi di `go.mod`).
4. Dari root project jalankan `pnpm install`, lalu `pnpm dev`.
5. Buka alamat Vite yang ditampilkan (umumnya `http://localhost:5173`).

## Fitur Admin
- Login admin memakai password hash bcrypt dari tabel `admins`.
- Backend menerbitkan bearer token acak yang berlaku 8 jam.
- Endpoint CRUD kelas dan daftar peserta dilindungi middleware autentikasi.
- Validasi input dilakukan di backend; kode sesi harus unik dan URL modul harus HTTP/HTTPS.
- Penghapusan kelas meminta konfirmasi dan mengikuti foreign key `ON DELETE CASCADE`.

## Catatan
`node_modules` tidak disertakan. Dependency frontend dipasang ulang dengan `pnpm install`.
Token admin disimpan di `localStorage` untuk kebutuhan project test. Untuk deployment produksi, gunakan HTTPS dan pertimbangkan cookie HttpOnly/SameSite serta penyimpanan sesi persisten.
