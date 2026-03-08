# 📊 Dashboard Monitoring Project FTTH

Aplikasi monitoring progres pemasangan jaringan *Fiber To The Home* (FTTH) berbasis web modern dengan Next.js 15. Solusi end-to-end yang mengintegrasikan dashboard interaktif web dengan akses cepat dan aman via Webhook Bot Telegram.

---

## ✨ Fitur Unggulan

- 🔐 **Autentikasi User dengan Verifikasi Bot Telegram**
  Mewajibkan pengguna untuk memverifikasi nomor telepon mereka menggunakan bot Telegram sebagai lapisan keamanan tambahan secara komprehensif.

- 💬 **Cek Status Project Instan**
  Pengguna dapat mengecek progres status proyek terbaru menggunakan perintah `/cek [WBS ID]` langsung dari aplikasi Telegram (mobile/desktop), tanpa harus membuka dashboard di browser.

- 🎛️ **Dashboard Interaktif Manajemen Data**
  Antarmuka data-tabel responsif dan ringkas untuk kebutuhan manajemen data *master* (*regional & vendor*), data lokasi proyek, perangkat (*plant*), serta integrasi import/eksport Excel.

## 💻 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database Backend**: PostgreSQL via [Neon Serverless](https://neon.tech/)
- **ORM & Type-Safety**: Prisma
- **Styling UI**: Tailwind CSS
- **Integrasi Pihak Ketiga**: Telegram Bot API

---

## 🚀 Panduan Instalasi (Local Development)

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini di environment lokal Anda.

### 1. Kloning Repositori & Instal Dependensi

```bash
git clone https://github.com/StevenJ0/dashboard-ftth.git
cd dashboard-ftth
npm install
```

### 2. Konfigurasi Variabel Lingkungan (`.env`)

Buat file bernama `.env` (atau pindahkan dari `.env.example` bila ada) pada root folder aplikasi ini, dan sesuaikan isinya dengan kredensial database & identitas bot Telegram Anda:

```env
# URL Koneksi Database PostgreSQL (Contoh dari Neon DB Serverless)
DATABASE_URL="postgresql://username:randompassword123@ep-cool-cloud-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:randompassword123@ep-cool-cloud-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Token Bot Telegram (Didapatkan melalui BotFather di Telegram)
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz_123456"

# Secret untuk NextAuth / JWT Generator
JWT_SECRET="secret_super_aman_untuk_aplikasi_anda"
```

### 3. Generate Database Client (Prisma)

Selaraskan skema Prisma dari source code dengan koneksi URL di database yang sudah Anda konfigurasi, lalu *generate* Prisma Client TypeScript-nya:

```bash
# Untuk sinkronisasi schema local dengan remote database:
npx prisma db push

# Generate client Prisma bindings:
npx prisma generate
```

### 4. Jalankan Server Development

```bash
npm run dev
```

Project dapat diakses melalui [http://localhost:3000](http://localhost:3000) di peramban (browser) Anda. Webhook untuk testing bot Telegram secara lokal dapat dihubungkan menggunakan [Ngrok](https://ngrok.com/).

---
*Dibuat khusus untuk keperluan Portofolio Program Magang.*
