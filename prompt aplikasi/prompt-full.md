MASTER PROMPT SIAKAD KAMPUS ENTERPRISE

Anda adalah Senior Software Architect, Senior Fullstack Engineer, Senior UI/UX Designer, Senior Database Architect, dan DevOps Engineer.

Buatkan aplikasi SIAKAD (Sistem Informasi Akademik Kampus) Enterprise Multi-Tenant yang modern, scalable, production-ready, clean architecture, dan mudah dikembangkan.

TUJUAN PROYEK

Membangun sistem SIAKAD Kampus lengkap yang mencakup:

PMB (Penerimaan Mahasiswa Baru)
Akademik
Keuangan
LMS
Penilaian
EDOM
Notifikasi Mobile
Payment Gateway
Multi Role
Dynamic Permission Management

Namun untuk tahap pertama fokus pada:

Phase 1
Landing Page
Authentication
Multi User Login
Super Admin Dashboard
Dynamic Role Management
Dynamic Menu Management

Role lain belum dibuat dashboardnya, tetapi struktur database dan permission system harus sudah siap.

STACK TEKNOLOGI

Frontend:

Next.js 15 App Router
React 19
TypeScript
Tailwind CSS v4
Shadcn UI
Framer Motion
React Hook Form
Zod
Tanstack Query

Backend:

Next.js Fullstack
Server Actions
REST API
Clean Architecture

Database Development:

SQLite

ORM:

Prisma ORM

Production Database:

PostgreSQL
Support Supabase PostgreSQL

Authentication:

Better Auth / NextAuth
JWT
RBAC

Storage:

Local Storage Development
Supabase Storage Production

Notification:

Firebase Cloud Messaging (FCM)

Payment Gateway:

Midtrans
Xendit

Deployment:

Vercel
SISTEM ROLE

Buat sistem role yang fleksibel.

Role default:

Super Admin
Admin Akademik
Operator PMB
Keuangan
Dosen
Mahasiswa
Kaprodi
Dekan
Rektor

Namun seluruh role harus dapat dibuat, diubah, dan dihapus oleh Super Admin.

PERMISSION SYSTEM

Buat Dynamic Permission Management.

Contoh:

User Management
Role Management
Menu Management
PMB Management
Akademik
KRS
KHS
Transkrip
Keuangan
LMS
EDOM
Jadwal
Notifikasi
Master Data

Permission:

create
read
update
delete
approve
export
import

Gunakan tabel:

roles
permissions
role_permissions
user_roles

FITUR BESAR YANG HARUS SUDAH DIDESAIN

Walaupun belum semuanya dibuat sekarang, database dan arsitektur harus siap.

MODULE PMB

Pendaftaran Online

Data:

Biodata
Orang Tua
Pendidikan
Upload Berkas

Status:

Draft
Menunggu Pembayaran
Verifikasi Pembayaran
Lulus Seleksi
Registrasi Ulang
Menjadi Mahasiswa

Fitur:

Generate Invoice PMB otomatis.

PAYMENT GATEWAY

Support:

Midtrans
Xendit

Fitur:

Virtual Account
QRIS
E-Wallet
Transfer Bank

Webhook Handler.

Status:

pending
paid
expired
failed
refund

MODUL KEUANGAN

Tagihan:

PMB
Registrasi
SPP
Praktikum
Skripsi
Wisuda

Fitur:

Cicilan SPP.

Contoh:

SPP Semester:
Rp 6.000.000

Skema:

Cicilan 1:
Rp 2.000.000

Cicilan 2:
Rp 2.000.000

Cicilan 3:
Rp 2.000.000

Status pembayaran harus otomatis terupdate setelah callback payment gateway.

MODUL AKADEMIK

Master:

Fakultas
Program Studi
Tahun Akademik
Kurikulum
Mata Kuliah
Dosen
Ruangan
Kelas
KRS

Mahasiswa dapat:

Ambil Mata Kuliah
Drop Mata Kuliah

Validasi:

Maksimum SKS
Prasyarat Mata Kuliah
Status Pembayaran

Approval:

Dosen Wali

KHS

Generate otomatis.

TRANSKRIP

Generate otomatis.

JADWAL KULIAH
Kalender Akademik
Jadwal Kuliah
Jadwal UTS
Jadwal UAS
PENILAIAN DOSEN

Komponen:

Tugas
Quiz
UTS
UAS

Nilai akhir otomatis.

EDOM

Evaluasi Dosen Oleh Mahasiswa.

Mahasiswa mengisi:

Kuisioner
Saran

Laporan:

Grafik
Statistik
LMS

Fitur:

Materi
Video
Tugas
Quiz
Forum
NOTIFIKASI MOBILE

Firebase Cloud Messaging.

Event:

Tagihan Baru
Pembayaran Berhasil
Jadwal Kuliah
Pengumuman
Nilai Keluar
Persetujuan KRS
SUPER ADMIN DASHBOARD

Phase 1 hanya membuat dashboard Super Admin.

Menu:

Dashboard

Master

Kampus
Fakultas
Program Studi
Ruangan
Kelas
Tahun Akademik
Kurikulum

User Management

Users
Roles
Permissions

System

Menus
Settings
Audit Logs

PMB

Gelombang
Program Studi
Tagihan PMB

Keuangan

Jenis Tagihan
Payment Gateway

Notification

Template Notifikasi
Broadcast

Developer

API Logs
Queue Jobs
Scheduler
DYNAMIC MENU BUILDER

Super Admin dapat:

Membuat menu
Menghapus menu
Mengubah urutan menu
Menentukan icon
Menentukan role yang dapat mengakses

Struktur menu disimpan di database.

Sidebar harus dirender dinamis dari database.

AUDIT LOG

Catat seluruh aktivitas:

Login
Logout
CRUD
Approval

Data:

User
IP
Browser
Timestamp
Action
DASHBOARD UI

Desain harus:

Premium Enterprise SaaS

Referensi:

Stripe Dashboard
Vercel Dashboard
Linear
Notion
Clerk
Supabase

Karakteristik:

Modern
Minimalis
Clean
Responsive
Dark Mode
Light Mode
LANDING PAGE

Buat Landing Page Kampus Modern.

Section:

Hero
Features
Modules
Statistics
Testimonials
FAQ
Contact

CTA:

Daftar PMB
Login

AUTHENTICATION

Halaman:

/login

Support:

Email Login
Username Login

Fitur:

Remember Me
Forgot Password
Reset Password

Middleware:

Role Based Access Control.

DATABASE DESIGN

Gunakan Prisma.

Tahap pertama wajib membuat:

User
Role
Permission
Menu
MenuPermission
AuditLog
Faculty
Department
Campus
NotificationTemplate

Buat Prisma Schema yang scalable untuk seluruh modul yang akan datang.

CLEAN ARCHITECTURE

Pisahkan folder:

src/

application/
domain/
infrastructure/

modules/

auth/
users/
roles/
permissions/
menus/

shared/

components/
hooks/
lib/
types/

OUTPUT YANG HARUS DIBUAT

Kerjakan secara berurutan.

STEP 1

Buat Project Structure Lengkap.

STEP 2

Buat Prisma Schema Lengkap.

STEP 3

Buat Database Seeder.

STEP 4

Buat Authentication System.

STEP 5

Buat Dynamic RBAC.

STEP 6

Buat Dynamic Menu Builder.

STEP 7

Buat Landing Page Premium.

STEP 8

Buat Login Page Premium.

STEP 9

Buat Super Admin Dashboard Premium.

STEP 10

Buat CRUD:

User
Role
Permission
Menu
Master Akademik Dasar:
Kampus
Fakultas
Program Studi
Ruangan
Kelas
Tahun Akademik
Kurikulum

STEP 11

Buat Audit Log.

STEP 12

Buat Notification System.

RULES
Gunakan TypeScript Strict Mode.
Hindari hardcoded value.
Gunakan Server Actions jika memungkinkan.
Gunakan reusable components.
Gunakan clean code.
Gunakan repository pattern.
Gunakan scalable folder structure.
Semua kode harus production-ready.
Semua halaman harus responsive.
Semua form harus menggunakan Zod validation.
Semua tabel menggunakan pagination, filter, search, sorting.
CRUD master data wajib menggunakan modal form responsive, import Excel, export Excel, template Excel, bulk delete, soft delete, restore, dan hapus permanen.
Semua API menggunakan standar response format.
Semua CRUD harus memiliki audit log.
Siapkan migrasi SQLite → PostgreSQL tanpa perubahan struktur aplikasi.

Mulai dari STEP 1 dan tampilkan struktur folder lengkap terlebih dahulu. Jangan lanjut ke step berikutnya sebelum step sebelumnya selesai.
