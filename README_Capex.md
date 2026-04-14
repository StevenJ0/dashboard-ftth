<div align="center">

# 📊 Dashboard FTTH (Fiber to the Home)
**Platform Monitoring dan Manajemen Proyek Jaringan FTTH Termutakhir**

[![Deploy Status](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://dashboard-ftth.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Telegram API](https://img.shields.io/badge/Telegram_Bot-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots)

[**Lihat Live Demo**](https://dashboard-ftth.vercel.app/) • [**Dokumentasi API**](#9-dokumentasi-api-endpoint) • [**Panduan Instalasi**](#10-instalasi--konfigurasi-lokal)

</div>

---

## 📑 Daftar Isi
1. [Tentang Proyek](#3-tentang-proyek-about-the-project)
2. [Fitur Utama](#4-fitur-utama-key-features)
3. [Bot Telegram Commands](#5-bot-telegram-commands-daftar-perintah)
4. [Tech Stack](#6-tech-stack)
5. [Struktur Folder](#7-struktur-folder-project-structure)
6. [Skema Database](#8-skema-database-database-schema)
7. [Dokumentasi API Endpoint](#9-dokumentasi-api-endpoint)
8. [Instalasi & Konfigurasi Lokal](#10-instalasi--konfigurasi-lokal)
9. [Panduan Deployment](#11-panduan-deployment-vercel--webhook)
10. [Screenshots](#12-screenshots)

---

## 3. Tentang Proyek (About The Project)

**Dashboard FTTH** adalah sebuah terobosan sistem informasi berbasis web yang dirancang secara khusus untuk mendigitalisasi, memonitor, dan mengelola operasi proyek **Fiber to the Home (FTTH)** yang tersebar di berbagai witel dan regional. 

**Masalah yang Dipecahkan:**
Sebelumnya, pelacakan dokumen _Purchase Request_ (PR), _Purchase Order_ (PO), dan progres penyelesaian lapangan dilakukan secara konvensional dan terfragmentasi. Aplikasi ini mengeleminasi hambatan tersebut melalui sistem sentralisasi data yang **aman, terskalakan, dan real-time**. Hal ini mempercepat eskalasi pengambilan keputusan, menghindari duplikasi data (terutama saat validasi massal), dan menjamin tata kelola manajemen proyek yang jauh lebih proaktif.

*Catatan: Repositori proyek ini dikembangkan sebagai karya portofolio tingkat lanjut dan pemenuhan tugas Praktik Kerja Lapangan (PKL), mengusung arsitektur perangkat lunak standard industri.*

---

## 4. Fitur Utama (Key Features)

Aplikasi ini mendemonstrasikan kapabilitas _Full-Stack_ yang ekstensif, meliputi:

### 📈 Dashboard Analitik Lanjutan
*   **Visualisasi Komprehensif:** Menggunakan pustaka tingkat tinggi `Recharts` untuk merender metrik krusial lapangan menjadi aset visual interaktif.
*   **Filter Agregat:** Dilengkapi kemampuan konseptual dan dinamis untuk menampilkan data parsial sesuai periode atau status pengerjaan yang relevan.

### 🛠️ Manajemen Proyek & Import Manipulasi Data
*   **CRUD Operasional Penuh:** Operasi terintegrasi pembuatan, pembaruan, serta penghapusan data Proyek (WBS) beserta sub-proyek (Item) yang mendetail dengan manajemen _relational cascades_.
*   **Validasi Formulir Ketat:** Formulir dilindungi oleh skema `Zod` bersamaan dengan `React Hook Form` memastikan integritas struktural tipe data masuk di peramban klien sebelum diteruskan ke peladen (Server).
*   **Mass Data Import (CSV/Excel):** Adanya fungsionalitas pengolahan entri data massal melalui _parser_ `xlsx` terotomasi, memungkinkan operator melakukan iterasi ribuan _project item_ beserta konversi tipe relasional secara efisien dalam hitungan detak sistem.

### 🤖 Interface Bot Telegram Interaktif
Fitur keamanan inovatif dan interface pelaporan real-time, jauh di atas hanya sekadar alat OTP biasa:
*   **Manajemen Sesi Lintas Saluran (Cross-Channel):** Pengguna menautkan identitas web mereka kepada profil Telegram melalui webhook otonom.
*   **Pengecekan Real-time Langsung dari Chat:** Pengguna/Vendor dapat mengirimkan _command_ dinamis dan paramater permintaan spesifik yang pada gilirannya bot akan merekonstruksi ulang hasil rekapan basis data proyek ke format _markup_ HTML Telegram interaktif detik itu juga (tanpa melalui Web UI).
*   **Gatekeeper Security:** Mencegah sembarang orang melihat operasional atau status via Telegram sebelum otoritas identitas HP di-kuotakan dengan status _verified_.

### 🔐 Keamanan & Arsitektur Jaringan (Security Layer)
*   **Stateless JWT Custom Session:** Impelementasi kuki sesi terenkripsi dengan standardisasi algoritma HS256 didemonstrasikan menggunakan `jose`, menggantikan cara konvensional guna mencapai retensi latensi nol pada _serverless endpoints_ seperti Vercel.
*   **Proteksi Middleware Pintar:** Rute dilindungi di lapisan peramban Edge via Next.js `middleware.ts`, secara eksplisit menyekat rintangan masuk zona rute `/dashboard` dengan status `401/302 Redirect` otomatis jika tidak ada/sesi JWT telah kedaluwarsa.
*   **Bcrypt Encryption:** Salting dan Hashing sandi pengguna sebelum disentuh oleh transaksional basis data demi perlindungan ancaman _Rainbow Table_.

---

## 5. Bot Telegram Commands (Daftar Perintah)

Sistem _Webhook Handler_ otonom memfasilitasi interaksi pengguna melalui Telegram langsung kepada inti server (_Node.js REST_) bertepatan di `/api/telegram/webhook/route.ts`.

| Perintah Lengkap | Argumen yang Diminta | Deskripsi dan Efek _Runtime_ |
| :--- | :--- | :--- |
| `/start` atau `/help` | _None_ | Merender pesan bantuan dan selamat datang global terkait fungsionalitas interaktif yang dimuat bot ini. |
| `/verify` | `[Nomor_HP_Anda]` | **Mekanisme Otomatisasi (Gatekeeper):** Menautkan dan memvalidasi `telegram_id` _chat_ saat ini ke nomor HP dan akun pengguna yang sudah didaftarkan pada Portal Web. Contoh eksekusi: `/verify 08123456789`.
| `/cek` | `[WBS_ID]` | **Query Proyek _On-Demand_:** Memanggil fungsi Prisma ORM secara diam-diam menuju _database_ PostgreSQL untuk menemukan WBS terkait, lalu mengembali representatif _markup HTML Telegram_ berisi rincian (Vendor, Regional, Progres Terkini, Status Lapangan) di dalam bilah riwayat chat. |

> **Catatan:** Setiap pengiriman perintah, gambar, atau teks yang dilakukan oleh entitas pengguna (yang gagal mengkompensasi profil dengan skema Gatekeeper pada DB), otomatis akan menerima pemberitahuan penyitaan otorisasi: _"Akses Terbatas: Sistem tidak mengenali Anda."_

---

## 6. Tech Stack

### 🖥️ Frontend (Client-side)
*   **Core Framework:** `Next.js 16.1.3` (App Router Paradigm)
*   **UI Library:** `React 19`
*   **Styling & Theming:** `Tailwind CSS v4` terintegrasi dengan utilitas penggabungan seperti `clsx` & `tailwind-merge`
*   **State & Data Fetching:** `SWR` (Stale-While-Revalidate pattern)
*   **Charts & Visuals:** `Recharts`, iterasi `Framer Motion` (micro-animations)
*   **Form Security Validations:** `React Hook Form` dengan `Zod` resolvers

### ⚙️ Backend (Server-side & API)
*   **Architecture:** Modular `Next.js Route Handlers` / Serverless Functions
*   **Authentication & Security:** Custom Session `Jose` (JWT), Payload Parser, `bcrypt/bcryptjs`
*   **Third-party Integration:** `Telegram Bot API`
*   **Data Parser Toolset:** `exceljs`, `xlsx` (Multipart Buffer Extraction)

### 🗄️ Database & ORM
*   **Database Engine:** `PostgreSQL` (Relational DBMS)
*   **ORM Modeler:** `Prisma` (@prisma/client v5)

---

## 7. Struktur Folder (Project Structure)

Secara konseptual, arsitektur diatur dengan paradigma *Feature-First* dan isolasi lapis layanan (_Service Layer Separation_):

```text
📦 fe-proyek-pkl-ftth
 ┣ 📂 app
 ┃ ┣ 📂 api               # Rute Endpoints (REST API) Backend: Auth, Master Data, Projects, Telegram
 ┃ ┣ 📂 auth              # Top-level Routing UI halaman Login dan Register
 ┃ ┣ 📂 dashboard         # Top-level Routing UI layar Monitoring Panel utama
 ┃ ┗ 📜 layout.tsx        # Root arsitektural DOM (Theme/Global Providers)
 ┣ 📂 components
 ┃ ┣ 📂 auth              # Fragmented "View Components" spesifik modul formulir akses autentikasi
 ┃ ┣ 📂 dashboard         # Komponen Modular Rendering Interaktif Panel (Grafik, Rekap, Filter)
 ┃ ┣ 📂 layout            # Komponen Tata Letak (Sidebar, Header Dinamis, Navigasi Ekstra)
 ┃ ┗ 📂 ui                # Komponen Primitif (Reusable Assets) seperti Button, Input Field, Modal Window
 ┣ 📂 lib
 ┃ ┣ 📂 auth              # Manajemen Konstelasi Konfigurasi Rahasia dan Parsing Token
 ┃ ┣ 📂 prisma            # Instansiasi Singleton Prima Client & Abstraksi Logika Layanan Database
 ┃ ┗ 📂 telegram          # Generator Konstruksi Formatter Markup untuk Pengiriman Pesan Bot
 ┣ 📂 prisma
 ┃ ┗ 📜 schema.prisma     # Deklarasi Inti ORM (Mapping Model DB Terpusat)
 ┣ 📂 services
 ┃ ┗ 📜 auth.service.ts   # Isolasi Domain Service Controller Khusus Proses Bisnis Registrasi & Sesi
 ┗ 📜 middleware.ts       # Sentinel Edge Middleware (Router Interceptor & Proteksi Kuki JWT Aktif)
```

---

## 8. Skema Database (Database Schema)

Fondasi data dikonstruksi secara logis untuk merefleksikan struktur hierarki kompleks operasional (Prisma ORM):

*   **`users`**: Entitas kunci dalam _realm_ identifikasi pengguna aplikasi. Menyimpan *credentials* (_password hash_), peran (`role`), nomor kontak, validitas (_is_verified_), serta *linkage* *bot* Telegram (`telegram_id`). Memiliki jalinan _One-to-Many_ relasi parsial dengan tabel catatan OTP.
*   **`otp_logs`**: Menjalankan *logging* audit OTP historis terkait pendaftaran dan akses pengguna sementara.
*   **`projects` (Tabel Inti)**: Mengandung abstraksi fundamental setiap entitas pendanaan proyek, bernaung di bawah kode WBS ID unik sebagai `Primary Key`, dengan derivasi elemen informasional kontrak dan jenis.
*   **`project_items` (Cabang/Transaksional)**: Berelasi referensial _Cascade Constraint_ dengan tabel `projects`. Ini adalah komponen yang ditrack sedemikian dinamis setiap progres real-timenya (PR/PO Number, Tanggal Delivery/GR, Amount Finansial, Progress %, dan Status Tahapan Tomps).
*   **Dimensi Master Data (Referensi Silang)**: Konstelasi tabel penyedia _lookup reference_: 
    - `dim_regionals` (Pusat Teritorial) → `dim_witels` (Anak Regional) → `dim_locations` (Kawasan/Sub-distrik).
    - `dim_vendors` (Katalog Manufaktur/Rekanan).
    - `dim_plants` & `dim_programs` (Penamaan area dan nomenklatur pendanaan internal). 

---

## 9. Dokumentasi API Endpoint

Secara parsial (_stateless REST_), aplikasi mengekspos endpoint spesifik di bawah kendali `/app/api`:

| Endpoint URL | HTTP Method | Deskripsi Eksekusi Bisnis |
| :--- | :---: | :--- |
| `/api/auth/login` | `POST` | Autentikasi sesi melalui resolusi kredensial No HP dan kata sandi untuk meneruskan Kuki sesi. |
| `/api/auth/register` | `POST` | Insersi pengguna tahap awal berbasis formulir yang mengharapkan konfirmasi lebih lanjut. |
| `/api/auth/otp` | `POST` | Validasi akhir status _verified_ yang menumbuhkan sesi autentikasi tetap penuh (JWT Issue). |
| `/api/auth/logout` | `POST` | Melucuti identitas token dari peramban dan mengakhiri rentang sesi kuki temporal. |
| `/api/master-data/*`| `GET` | (Beragam rute turunan seperti _/vendors, /witels_) Rute pengambilan hierarki *lookup dropdown options*. |
| `/api/projects/list`| `GET` | Rute *fetching* dengan *filtering query* ekstensif dan pengambilan daftar muatan portofolio proyek asinkron. |
| `/api/projects/import`|`POST` | Menginjeksi abstraksi Buffer (*CSV/Spreadsheet Content*) langsung via FormData dan menerjemahkannya kepada formasi kueri rekaman *massal* Prisma dalam milidetik. |
| `/api/telegram/webhook`|`POST`| Pintu gerbang otonom (Callback) penerima denyut pengiriman pesan pengguna dari integrasi sistem pusat Telegram. |

---

## 10. Instalasi & Konfigurasi Lokal

Instruksi komprehensif bagi Anda yang hendak mendedikasikan instalasi eksekusi secara lokal:

**1. Kloning Repositori Secara Lokal**
```bash
git clone <REPOSITORY_URL>
cd fe-proyek-pkl-ftth
```

**2. Instalasi Ekosistem Dependensi (NPM)**
```bash
npm install
```

**3. Setelan Konfigurasi Variabel Lingkungan**
Salin dan wujudkan format berkas `.env` di struktur direktori utama (_root_), deklarasikan nilai peubah yang bersifat statis namun sensitif:
```env
# Koneksi Database PostgreSQL Anda
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]?schema=public"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]?schema=public"

# Kunci Penanda Enkripsi Sistem JWT Anda
JWT_SECRET="YOUR_SUPER_SECRET_JWT_SIGNATURE_KEY_HERE"

# Kredensial Pendelegasian Telegram Bot
TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_HTTP_API_TOKEN"
```

**4. Konstruksi Skema dan Sinkronisasi ORM Prisma**
Ini akan mengubah model skema internal yang dikelola aplikasi kepada refleksi riil tabel-tabel terstruktur pada PostgreSQL Anda:
```bash
npx prisma generate
npx prisma db push
```

**5. Luncurkan Peladen Penguji (Local Development)**
```bash
npm run dev
```
Buka `http://localhost:3000` di peramban luncuran andalan Anda.

---

## 11. Panduan Deployment (Vercel & Webhook)

### Fase 1: Hosting Melalui Jaringan Serverless Vercel
Platform Vercel disarankan sebagai manifestasi akhir aplikasi ini:
1. Hubungkan (_Import_) direktori GitHub atau GitLab anda ke kontrol muka pengelola proyek Vercel.
2. Navigasikan pengaturan proaktif menuju **Project Settings > Environment Variables** di muka layar _Vercel Cloud_.
3. Alirkan kembali rincian semua entri (_key-value_) konfidensial dari *file* `.env` luring (_offline_) tadi sepenuhnya.
4. Lakukan pemicuan _Deploy_. *(Catatan: Instruksi `postinstall: "prisma generate"` di `package.json` akan otomatis membangun sirkuit konektor modul binari Prisma sewaktu fase *Build* tanpa interupsi manual).*

### Fase 2: Aktivasi Sentralisasi Bot Webhook Telegram
Agar bot mendeteksi _input_ _messenger_ dan mentransmisikan sinyal kembali pada API kita, sistem webhook harus diaktifkan memfasilitasi _reverse proxy callback_:

Buka *browser* konvensional, dan jalankan perintah URL langsung ini di _address-bar_ (pastikan variabel dipetakan benar):

```text
https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN_PENGGANTI>/setWebhook?url=https://[DOMAIN_VERCEL_ANDA_PENGGANTI]/api/telegram/webhook
```
*Tanda status sukses jaringan akan segera mengkonfirmasi aktivasi webhook yang siap merespons percakapan apa pun melalui saluran Telegram.*

---

## 12. Screenshots

_Tinjauan Antarmuka (Akan segera dilampirkan demonstrasi grafis):_

![Dashboard View](/public/docs/dashboard.png)
> **Tampilan Dashboard Utama:** Mendemonstrasikan kapabilitas Recharts dan Filter Dinamis Manajemen Proyek.

![Project Data Import](/public/docs/import.png)
> **Fitur Mass Import:** Tinjauan struktur antar muka pemasukan lembar kerja proyek secara ribuan baris transaksional.

![Telegram Bot Interface](/public/docs/bot_telegram.png)
> **Demonstrasi Eksekusi Command Otomatisasi ( /cek Q-24001 ):** Representasional visual dari HTML Markup Generator di perangkat seluler pengguna.
