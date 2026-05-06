# PaperThought

> Platform analisis penulisan akademik berbasis AI — evaluasi sitasi, koherensi, keselarasan, dan kesenjangan penelitian secara otomatis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

---

## ✨ Fitur

- 📄 **Upload makalah** — teks langsung, PDF, atau DOCX
- 🤖 **Analisis AI** — menggunakan NVIDIA Nemotron via OpenRouter (gratis)
- 📊 **4 metrik evaluasi** per paragraf:
  - Kualitas Sitasi
  - Koherensi
  - Keselarasan dengan topik
  - Kesenjangan Penelitian
- ✏️ **Editor revisi** dengan saran inline per paragraf
- 🔄 **Analisis ulang** setelah revisi untuk pantau progres
- 🇮🇩 **Antarmuka Bahasa Indonesia**

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| AI | NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b:free`) via [OpenRouter](https://openrouter.ai) |
| Auth | JWT |

---

## 🚀 Cara Menjalankan

Lihat panduan lengkap di **[RUNNING.md](./RUNNING.md)**.

### TL;DR

```bash
# 1. Install dependencies
npm install

# 2. Setup database (PostgreSQL lokal)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
npm --workspace=backend run db:migrate
npm --workspace=backend run db:seed   # buat akun test

# 3. Konfigurasi environment
cp .env.example backend/.env
# Edit backend/.env → isi OPENROUTER_API_KEY

# 4. Jalankan (2 terminal)
npm --workspace=backend run dev    # Terminal 1 → localhost:3001
npm --workspace=frontend run dev   # Terminal 2 → localhost:3000
```

Buka **http://localhost:3000** — login dengan `test@paperthought.dev` / `Test1234!`

---

## 🔑 Environment Variables

Lihat [`.env.example`](./.env.example) untuk panduan konfigurasi.

| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | URL koneksi PostgreSQL |
| `JWT_SECRET` | Secret untuk JWT token |
| `OPENROUTER_API_KEY` | API key dari [openrouter.ai](https://openrouter.ai/keys) (gratis) |
| `OPENROUTER_MODEL` | Model AI (default: `nvidia/nemotron-3-super-120b-a12b:free`) |

---

## 🧪 Tests

```bash
npm --workspace=backend test           # 45 tests
npm --workspace=frontend test -- --run # 32 tests
```

---

## 📁 Struktur Proyek

```
PaperThought/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # AnalysisPage, DashboardPage, dll.
│       ├── components/
│       └── services/
├── backend/           # Express + TypeScript
│   └── src/
│       ├── routes/    # REST API endpoints
│       ├── services/  # aiService, analysisService
│       └── config/    # database, env config
├── .env.example       # Template environment variables
├── RUNNING.md         # Panduan lengkap menjalankan app
└── LICENSE
```

---

## 📝 License

[MIT](./LICENSE) © 2026 HafizhAkr
