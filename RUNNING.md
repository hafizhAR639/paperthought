# 🚀 Panduan Menjalankan PaperThought

## Gambaran Arsitektur

```
┌────────────────────┐     HTTP      ┌───────────────────────┐
│  Frontend (React)  │ ────────────► │  Backend (Express API) │
│  localhost:3000    │ ◄──────────── │  localhost:3001        │
└────────────────────┘               └───────────┬───────────┘
                                                 │ SQL
                                     ┌───────────▼───────────┐
                                     │  PostgreSQL            │
                                     │  localhost:5432        │
                                     └───────────────────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │  OpenRouter API        │
                                     │  NVIDIA Nemotron Free  │
                                     └───────────────────────┘
```

**Ya, butuh 2 terminal** — satu untuk backend, satu untuk frontend.

---

## Prasyarat

| Tool | Versi Min | Cek |
|------|-----------|-----|
| Node.js | 18+ | `node -v` |
| npm | 8+ | `npm -v` |
| PostgreSQL | 14+ | `psql --version` |

---

## 1. Setup Pertama Kali (lakukan sekali saja)

### Langkah 1 — Install dependencies

```sh
cd PaperThought
npm install
```

### Langkah 2 — Setup Database PostgreSQL

**Kamu sudah punya PostgreSQL lokal yang berjalan di port 5432.**
Jalankan perintah ini satu kali untuk menyiapkan user dan database:

```sh
# Set password postgres (sesuaikan dengan backend/.env)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"

# Buat database (skip kalau sudah ada)
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
```

### Langkah 3 — Konfigurasi Environment

Cek `backend/.env` sudah ada dan isinya benar:

```sh
cat backend/.env | grep -v KEY | grep -v SECRET
```

Yang perlu ada di `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/paperthought
JWT_SECRET=bebas-string-panjang-random

# API NVIDIA Nemotron GRATIS via OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # ganti dengan key kamu
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free

ANALYSIS_INTER_REQUEST_DELAY_MS=4000
FILE_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### Langkah 4 — Buat Tabel Database (Migrasi)

```sh
npm --workspace=backend run db:migrate
```

Output yang benar:
```
Running database migrations...
Connected to PostgreSQL database
✓ Migration executed
...
✓ All migrations completed
```

### Langkah 5 — Buat Akun Test

```sh
npm --workspace=backend run db:seed
```

Output:
```
✅ Test account created:
   Email   : test@paperthought.dev
   Password: Test1234!
```

---

## 2. Menjalankan App (Setiap Kali)

Buka **2 terminal** di folder `PaperThought/`.

### Terminal 1 — Backend API

```sh
npm --workspace=backend run dev
```

Output yang benar:
```
Connected to PostgreSQL database
🚀 Server running on port 3001
Environment: development
```

### Terminal 2 — Frontend

```sh
npm --workspace=frontend run dev
```

Output yang benar:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

### Buka Browser

👉 **http://localhost:3000**

Login dengan akun test:
- **Email:** `test@paperthought.dev`
- **Password:** `Test1234!`

---

## 3. Urutan Shutdown

```sh
# Stop frontend: Ctrl+C di Terminal 2
# Stop backend:  Ctrl+C di Terminal 1
# PostgreSQL: biarkan jalan (sistem service)
```

---

## 4. Cara Kerja Analisis AI (Rate Limit)

Karena menggunakan model **gratis** `nvidia/nemotron-3-super-120b-a12b:free`,
sistem sudah dikonfigurasi agar tidak kena batas:

| Strategi | Detail |
|----------|--------|
| **Delay antar paragraf** | 4 detik jeda (≈ 15 req/menit, aman di bawah limit gratis) |
| **Cache hasil** | Paragraf yang sama tidak dikirim 2x ke API (cache 30 menit) |
| **Retry 429** | Kena rate limit → tunggu otomatis **60 detik** lalu coba lagi |
| **Retry error lain** | Back-off eksponensial: 2s → 4s → 8s → 16s |
| **Fallback mock** | Jika API gagal total, hasilkan skor estimasi lokal |

> **Estimasi waktu analisis:**
> - 3 paragraf ≈ 30–60 detik
> - 10 paragraf ≈ 2–4 menit

Atur delay jika perlu:
```env
ANALYSIS_INTER_REQUEST_DELAY_MS=4000   # naikkan ke 6000 jika masih kena 429
```

---

## 5. Troubleshooting

### ❌ `password authentication failed for user "postgres"`

```sh
# Set ulang password postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
```

### ❌ `database "paperthought" does not exist`

```sh
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
npm --workspace=backend run db:migrate
```

### ❌ `relation "papers" does not exist` — Migrasi belum jalan

```sh
npm --workspace=backend run db:migrate
```

### ❌ Schema lama konflik (foreign key error saat migrate)

```sh
# Reset total database (data hilang!)
sudo -u postgres psql -c "DROP DATABASE paperthought;"
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
npm --workspace=backend run db:migrate
npm --workspace=backend run db:seed
```

### ❌ `OPENROUTER_API_KEY not set — using mock analyzer`

Cek `backend/.env` ada baris:
```
OPENROUTER_API_KEY=sk-or-v1-...
```

### ❌ Port 3000 atau 3001 sudah dipakai

```sh
lsof -i :3001   # lihat proses
lsof -i :3000

kill -9 <PID>   # ganti PID
```

### ❌ `npm install` gagal atau versi konflik

```sh
rm -rf node_modules backend/node_modules frontend/node_modules package-lock.json
npm install
```

---

## 6. Menjalankan Tests

```sh
# Backend (45 tests)
npm --workspace=backend test

# Frontend (32 tests)
npm --workspace=frontend test -- --run
```

---

## 7. Ringkasan Perintah Cepat

```sh
# === SETUP (sekali saja) ===
npm install
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
npm --workspace=backend run db:migrate
npm --workspace=backend run db:seed

# === JALANKAN (setiap kali) ===
# Terminal 1:
npm --workspace=backend run dev

# Terminal 2:
npm --workspace=frontend run dev

# === BUKA ===
# http://localhost:3000
# Login: test@paperthought.dev / Test1234!
```
