# PaperThought

Platform analisis penulisan akademik berbasis AI. Mengevaluasi kualitas sitasi, koherensi, keselarasan topik, dan kesenjangan penelitian per paragraf — kemudian menyajikan saran perbaikan yang dapat langsung direvisi.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

---

## Latar Belakang

Mahasiswa dan peneliti kerap menyerahkan seluruh proses koreksi tulisan kepada AI, yang justru mengikis kemampuan berpikir kritis mereka sendiri. PaperThought dibangun dengan filosofi sebaliknya: AI berperan sebagai auditor yang mengekspos kelemahan tulisan, bukan sebagai penulis pengganti. Keputusan revisi sepenuhnya ada di tangan penulis.

---

## Tech Stack

| Layer    | Teknologi                                                                 |
|----------|---------------------------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, Zustand                      |
| Backend  | Node.js 18, Express 4, TypeScript                                         |
| Database | PostgreSQL 14+                                                            |
| AI       | NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b:free`) via OpenRouter |
| Auth     | JWT (RS256)                                                               |
| Testing  | Jest + ts-jest (backend), Vitest + Testing Library (frontend)             |

---

## Fitur

- Upload makalah dalam format teks biasa, PDF, atau DOCX.
- Analisis per paragraf dengan empat metrik: kualitas sitasi, koherensi, keselarasan, dan kesenjangan penelitian.
- Setiap masalah dilengkapi tingkat keparahan (kritis / mayor / minor) dan saran perbaikan konkret dalam Bahasa Indonesia.
- Editor revisi inline dengan perbandingan teks asli dan revisi.
- Rate-limit guard bawaan: jeda 4 detik antar request, cache hasil 30 menit, retry otomatis saat kena HTTP 429.
- Fallback ke mock analyzer jika API tidak tersedia, sehingga server tidak pernah crash karena ketiadaan koneksi AI.

---

## Cara Menjalankan

Panduan lengkap tersedia di [RUNNING.md](./RUNNING.md). Ringkasan:

```bash
# Install semua dependencies (monorepo workspace)
npm install

# Setup PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "CREATE DATABASE paperthought OWNER postgres;"
npm --workspace=backend run db:migrate
npm --workspace=backend run db:seed

# Salin template environment dan isi OPENROUTER_API_KEY
cp .env.example backend/.env

# Jalankan di dua terminal terpisah
npm --workspace=backend run dev    # API  → localhost:3001
npm --workspace=frontend run dev   # UI   → localhost:3000
```

Akun test: `test@paperthought.dev` / `Test1234!`

---

## Environment Variables

Lihat [`.env.example`](./.env.example) untuk daftar lengkap. Variabel kritis:

| Variable             | Keterangan                                                                |
|----------------------|---------------------------------------------------------------------------|
| `DATABASE_URL`       | Connection string PostgreSQL                                              |
| `JWT_SECRET`         | Secret untuk signing JWT — ganti di production                           |
| `OPENROUTER_API_KEY` | API key dari [openrouter.ai/keys](https://openrouter.ai/keys) (gratis)   |
| `OPENROUTER_MODEL`   | Model AI, default `nvidia/nemotron-3-super-120b-a12b:free`               |

---

## Tests

```bash
npm --workspace=backend test           # 45 unit tests
npm --workspace=frontend test -- --run # 32 component tests
```

Semua test berjalan tanpa koneksi API maupun database nyata — backend menggunakan in-memory mock pool saat `NODE_ENV=test`, frontend menggunakan Vitest dengan jsdom.

---

## Struktur Proyek

```
.
├── backend/
│   └── src/
│       ├── config/       # Environment, database pool
│       ├── database/     # Migrasi dan seed
│       ├── middleware/   # Auth JWT, error handler
│       ├── routes/       # REST endpoints
│       ├── services/     # aiService, analysisService
│       └── utils/
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/        # AnalysisPage, RevisionPage, dll.
│       ├── services/
│       └── store/        # Zustand slices
├── .env.example
├── RUNNING.md
└── LICENSE
```

---

## Catatan Arsitektur

**Kenapa tidak menggunakan OpenAI SDK langsung?**
`@openrouter/sdk` v0.12 adalah ESM-only. Menggunakan static import akan memutus Jest yang dikompilasi ke CommonJS via ts-jest. Solusinya adalah dynamic `import()` di dalam fungsi — import hanya terjadi saat runtime ketika API key tersedia, sehingga unit test tidak pernah menyentuh modul tersebut.

**Kenapa AI prompt dalam Bahasa Indonesia?**
Model Nemotron menghasilkan respons yang lebih relevan dan kontekstual ketika instruksi diberikan dalam bahasa yang sama dengan tulisan yang dianalisis. Prompt berbahasa Inggris cenderung menghasilkan saran generik yang tidak sensitif terhadap konteks akademik lokal.

**Rate limiting pada free tier.**
Free tier OpenRouter tidak mendokumentasikan limit secara eksplisit, tetapi dalam pengujian konsisten mengembalikan HTTP 429 setelah burst request. Guard yang diimplementasikan (4 detik jeda, cache MD5, backoff 60 detik pada 429) menjaga throughput di bawah ~15 req/menit — cukup untuk analisis 10 paragraf dalam sekitar 4 menit.

---

## Inspirasi & Referensi

Proyek ini terinspirasi dari ide yang dibahas dalam TED Talk berikut:

> "How to Stop AI from Killing Your Critical Thinking"
> — Advait Sarkar | TED
> https://www.youtube.com/watch?v=3lPnN8omdPA

Talk tersebut berargumen bahwa penggunaan AI yang tepat seharusnya mempertajam, bukan menggantikan, kemampuan berpikir kritis pengguna. PaperThought mencoba menerjemahkan argumen itu ke dalam produk yang konkret.

---

## License

[MIT](./LICENSE) &copy; 2026 HafizhAkr
