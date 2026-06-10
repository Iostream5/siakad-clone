Berikut strategi terbaiknya agar hasil dari Codex CLI / Gemini CLI benar-benar rapi, modular, dan minim error:

Gunakan 1 prompt khusus untuk 1 fase
Jalankan berurutan
Test setiap fase
Commit Git setiap selesai fase

Di bawah ini saya buatkan prompt enterprise-grade untuk masing-masing fase utama.

1. PROMPT KHUSUS — STEP 1 (SUPER DETAIL)

Buat setup awal project enterprise-grade SIAKAD menggunakan monorepo architecture.

Gunakan:

Turborepo
PNPM workspace
Next.js latest App Router
NestJS latest
TypeScript strict mode
TailwindCSS
Shadcn UI
Prisma ORM
PostgreSQL
Redis
Docker
ESLint
Prettier
Husky
lint-staged

apps/
├── api
└── web

packages/
├── ui
├── config
├── types
└── eslint-config

Inisialisasi monorepo
Setup pnpm workspace
Setup turborepo
Setup Next.js App Router
Setup NestJS
Setup shared packages
Setup TypeScript strict
Setup ESLint
Setup Prettier
Setup Husky
Setup lint-staged
Setup TailwindCSS
Setup Shadcn UI
Setup environment variables
Setup Docker
Setup docker-compose
Setup PostgreSQL
Setup Redis
Setup Prisma
Setup base folder structure
Semua command terminal harus dijelaskan
Semua file harus dijelaskan
Generate struktur folder final
Pastikan semua dependency compatible
Pastikan project bisa langsung dijalankan
Gunakan clean architecture
Gunakan naming convention enterprise
Pastikan Docker berjalan normal
Pastikan hot reload berjalan

Generate:

Semua command install
Semua isi file config
Semua struktur folder
Semua environment example
Dockerfile
docker-compose.yml
README setup
Script development
Script build
Script production

Jangan lanjut ke authentication dulu.
Fokus hanya foundation project.

2. PROMPT KHUSUS — AUTHENTICATION MODULE

Buat authentication system enterprise-grade menggunakan NestJS.

Login
Register
Logout
Refresh token rotation
Forgot password
Reset password
Email verification
Session management
Multi-device login
Audit logs

Gunakan:

JWT access token
JWT refresh token
Argon2 password hashing
HTTP-only cookies
CSRF protection
Helmet
Rate limiting
RBAC authorization
SUPER_ADMIN
ADMIN_AKADEMIK
ADMIN_KEUANGAN
DOSEN
MAHASISWA

Gunakan:

DTO validation
Guards
Interceptors
Exception filters
Repository pattern
Service layer
Prisma ORM
Swagger documentation

Generate Prisma schema untuk:

users
roles
permissions
refresh_tokens
audit_logs

Generate:

Auth controller
Auth service
JWT strategy
Refresh strategy
Role guard
Permission guard

Generate:

Semua source code
Prisma migration
Seeder role
Swagger docs
API examples
Folder structure
Environment variables
Secure cookie config

Jelaskan setiap langkah.

3. PROMPT KHUSUS — DASHBOARD PREMIUM UI

Buat dashboard UI enterprise premium untuk SIAKAD menggunakan:

Next.js App Router
TailwindCSS
Shadcn UI
Framer Motion
TypeScript

Style:

Elegant
Premium
Modern enterprise dashboard
Responsive
Smooth animations
Dark mode
Light mode
Clean minimal
Professional typography

Inspirasi:

Vercel
Linear
Stripe
Notion
Responsive sidebar
Floating sidebar toggle button
Animated sidebar
Top navbar
User dropdown
Notification dropdown
Dashboard cards
Analytics charts
Smart tables
Skeleton loading
Empty state
Error state

Sidebar harus:

Collapse/expand
Responsive mobile drawer
Smooth animation
Tooltip saat collapse
Active route highlight
Nested menu
Elegant hover effect

Gunakan:

Framer Motion
Zustand

Generate:

Layout dashboard
Sidebar component
Navbar component
Theme switcher
Dashboard cards
Charts
Table reusable
Loading components
Protected routes

Pastikan mobile responsive sempurna.

4. PROMPT KHUSUS — DATABASE PRISMA

Buat database schema Prisma enterprise-grade untuk sistem SIAKAD lengkap.

Gunakan:

PostgreSQL
Prisma ORM
UUID primary keys
Timestamps
Soft delete
Proper indexes
Foreign keys
Relational scalable design

Generate schema lengkap untuk:

users
roles
permissions
students
lecturers
faculties
study_programs
courses
classrooms
schedules
enrollments
attendance
assignments
submissions
quizzes
exams
grades
invoices
payments
payment_transactions
notifications
audit_logs
Enum
Relation mapping
Cascade strategy
Index optimization
Query optimization
Soft delete pattern

Generate:

Full schema.prisma
Migration strategy
Seeder data
ERD explanation
Relasi antar tabel
Query optimization notes

Jelaskan struktur database dalam bahasa Indonesia.

5. PROMPT KHUSUS — MIDTRANS & XENDIT

Buat payment gateway integration enterprise-grade menggunakan:

NestJS
Midtrans
Xendit
Prisma
BullMQ
Invoice generation
Virtual account
QRIS
E-wallet
Credit card
Payment callback webhook
Retry mechanism
Idempotency protection
Event logging
Generate invoice
Create payment transaction
Save DB transaction
Redirect payment
Wait webhook
Validate signature
Update payment status
Activate semester
Send notification

Implement:

Signature validation
Webhook verification
Idempotency keys
Retry queue
Secure environment variables

Generate:

Midtrans service
Xendit service
Payment module
Invoice module
Webhook controller
Queue workers
Prisma schema
API examples
Swagger docs

Gunakan clean architecture.

6. PROMPT KHUSUS — LMS SYSTEM

Buat LMS modern enterprise-grade terintegrasi dengan SIAKAD.

Course classroom
Material upload
PDF/video/document support
Assignment
Quiz
Online exam
Discussion forum
Student progress tracking
Grade synchronization
Certificates
Dosen membuat kelas
Upload materi
Buat assignment
Mahasiswa submit tugas
Dosen memberi nilai
Sync nilai ke akademik

Frontend:

Next.js
Shadcn UI
React Hook Form

Backend:

NestJS
Prisma
S3 storage abstraction

Generate:

Backend LMS module
Frontend LMS pages
Assignment workflow
Submission workflow
Grade sync
Storage service
Prisma schema
API docs 7. PROMPT KHUSUS — DOCKER PRODUCTION

Buat production-ready Docker setup untuk SIAKAD enterprise.

Next.js frontend
NestJS API
PostgreSQL
Redis
Nginx
Multi-stage Dockerfile
Production optimization
Healthcheck
Environment config
Persistent volume
Secure networking

Generate:

Dockerfile frontend
Dockerfile backend
docker-compose.yml
docker-compose.prod.yml
nginx.conf
SSL-ready config
Production environment guide 8. PROMPT KHUSUS — CI/CD DEPLOYMENT

Buat CI/CD pipeline production-ready menggunakan GitHub Actions.

Stages:

Install dependencies
Lint
Test
Build
Docker build
Push registry
Deploy
Cache optimization
Docker registry push
Secure secrets
Rollback strategy
Healthcheck validation

Generate:

GitHub Actions workflow
Deployment scripts
Environment setup
Production deployment guide
Rollback guide 9. PROMPT KHUSUS — PREMIUM SIDEBAR UI

Buat sidebar enterprise premium modern menggunakan:

Next.js
TailwindCSS
Shadcn UI
Framer Motion
Zustand
Collapse sidebar
Expand sidebar
Floating toggle button
Mobile responsive drawer
Animated transition
Tooltip collapse mode
Nested menu
Active route indicator
Elegant hover effect

Style:

Premium
Elegant
Minimal modern
Enterprise dashboard

Inspirasi:

Vercel
Linear
Stripe

Generate:

Sidebar component
Sidebar store Zustand
Floating toggle
Mobile responsive behavior
Animation implementation
Reusable navigation config 10. PROMPT KHUSUS — CLEAN ARCHITECTURE NESTJS

Buat clean architecture NestJS enterprise-grade untuk SIAKAD.

Gunakan:

Domain-driven modular architecture
SOLID principles
Repository pattern
Service layer
DTO validation
Exception filters
Guards
Interceptors

src/
├── common/
├── config/
├── database/
├── modules/
├── integrations/
├── queues/
├── jobs/

modules/
└── students/
├── controllers/
├── services/
├── repositories/
├── dto/
├── entities/
├── interfaces/
├── guards/
└── tests/

Generate:

Base repository
Generic pagination
Global exception filter
Validation pipe
Response interceptor
Logger service
Prisma service
Module example
Clean architecture guidelines

Pastikan scalable untuk enterprise.
