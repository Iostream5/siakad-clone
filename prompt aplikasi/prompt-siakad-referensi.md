# PROMPT MASTER — ENTERPRISE SIAKAD SYSTEM

Anda adalah Senior Enterprise Software Architect, Principal Fullstack Engineer, dan DevOps Engineer.

Bangun aplikasi SIAKAD (Sistem Informasi Akademik) enterprise-grade yang modern, scalable, modular, production-ready, dan SaaS-ready menggunakan arsitektur terbaik.

Gunakan clean architecture, SOLID principles, dan scalable modular architecture.

==================================================
TUJUAN APLIKASI
===============

Bangun sistem universitas modern yang terintegrasi:

- SIAKAD
- LMS (Learning Management System)
- Online Class
- Payment Gateway
- Portal Mahasiswa
- Portal Dosen
- Portal Admin
- Portal Keuangan
- REST API
- Multi-role Authentication
- Responsive Web App
- Mobile-ready Backend
- Multi-campus Ready
- SaaS-ready

==================================================
TEKNOLOGI YANG WAJIB DIGUNAKAN
==============================

FRONTEND:

- Next.js latest App Router
- TypeScript strict mode
- TailwindCSS
- Shadcn UI
- Framer Motion
- Zustand
- TanStack Query
- React Hook Form
- Zod validation
- Lucide Icons
- Recharts

BACKEND:

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Refresh Token Rotation
- RBAC Authorization
- BullMQ
- Swagger OpenAPI

INFRASTRUCTURE:

- Docker
- Docker Compose
- Nginx
- GitHub Actions
- CI/CD Ready

STORAGE:

- Local Storage Abstraction
- AWS S3 Compatible

PAYMENT:

- Midtrans
- Xendit
- Webhook Handler
- QRIS
- Virtual Account
- E-wallet

ONLINE LEARNING:

- Zoom Integration
- Jitsi Integration

==================================================
DESAIN UI/UX WAJIB
==================

Buat tampilan:

- Modern
- Elegant
- Premium
- Enterprise dashboard style
- Responsive mobile-first
- Clean minimal UI
- Smooth animation
- Dark mode & light mode
- Professional typography
- Soft shadows
- Rounded modern cards
- Beautiful spacing system

Gunakan:

- Framer Motion animations
- Modern transitions
- Skeleton loading
- Empty states
- Toast notifications
- Interactive charts
- Smart tables
- Responsive grids

==================================================
SIDEBAR WAJIB
=============

Buat sidebar enterprise modern dengan fitur:

- Collapse/expand sidebar
- Floating toggle button
- Smooth animation
- Mobile drawer sidebar
- Auto responsive
- Icon + label mode
- Tooltip saat collapse
- Nested menu
- Active menu indicator
- Elegant hover effect

Gunakan:

- Framer Motion
- Zustand state management

Style:

- Premium enterprise admin dashboard
- Mirip Linear / Vercel / Notion / Stripe dashboard

==================================================
ROLE SYSTEM
===========

Roles:

- SUPER_ADMIN
- ADMIN_AKADEMIK
- ADMIN_KEUANGAN
- DOSEN
- MAHASISWA

Gunakan RBAC:

- Permission-based authorization
- Route protection
- API guards
- Role middleware

==================================================
MODULE YANG WAJIB DIBUAT
========================

1. Authentication
2. User Management
3. Student Management
4. Lecturer Management
5. Faculty & Study Program
6. Courses
7. KRS & KHS
8. GPA & Transcript
9. Scheduling
10. Classroom
11. LMS
12. Assignment
13. Quiz & Exam
14. Online Class
15. Attendance
16. Finance
17. Payment Gateway
18. Notifications
19. Reporting
20. Audit Logs

==================================================
DATABASE REQUIREMENTS
=====================

Gunakan Prisma schema enterprise-grade.

WAJIB:

- UUID primary key
- Timestamps
- Soft delete
- Indexing
- Proper relations
- Foreign key constraints

Tables:

- users
- roles
- permissions
- students
- lecturers
- faculties
- study_programs
- courses
- schedules
- enrollments
- attendance
- assignments
- submissions
- quizzes
- exams
- grades
- invoices
- payments
- payment_transactions
- notifications
- audit_logs

==================================================
BACKEND REQUIREMENTS
====================

Gunakan arsitektur modular:

src/
├── common/
├── config/
├── database/
├── modules/
├── integrations/
├── queues/
├── jobs/

Gunakan:

- DTO validation
- Repository pattern
- Service layer
- Guards
- Interceptors
- Exception filters
- Swagger docs
- Pagination
- Search/filter
- File upload validation
- Queue workers
- Cron jobs

==================================================
FRONTEND REQUIREMENTS
=====================

Buat halaman:

- Login
- Register
- Dashboard
- Student portal
- Lecturer portal
- Finance portal
- Admin portal
- LMS pages
- Payment pages

WAJIB:

- Responsive
- Loading states
- Skeleton loader
- Error boundary
- Form validation
- Reusable components
- Protected routes
- Elegant tables
- Charts dashboard

==================================================
SECURITY REQUIREMENTS
=====================

Implement:

- JWT Auth
- Refresh Token Rotation
- Password hashing (Argon2)
- Helmet
- Rate limiting
- CSRF protection
- XSS prevention
- SQL injection prevention
- File upload validation
- Audit logs

==================================================
PAYMENT FLOW
============

Flow:

1. Generate invoice
2. Create payment gateway transaction
3. Save transaction
4. Wait webhook callback
5. Verify signature
6. Update payment status
7. Activate semester access
8. Send notification

WAJIB:

- Idempotency protection
- Retry mechanism
- Event logging
- Queue processing

==================================================
LMS FLOW
========

1. Dosen membuat kelas
2. Upload materi
3. Buat assignment
4. Mahasiswa submit tugas
5. Dosen memberi nilai
6. Nilai sync ke akademik

==================================================
ONLINE CLASS FLOW
=================

- Zoom scheduler
- Jitsi room generator
- Attendance automation
- Meeting reminders
- Recording links

==================================================
DEVOPS REQUIREMENTS
===================

Generate:

- Dockerfile
- docker-compose.yml
- nginx.conf
- GitHub Actions CI/CD
- Environment configs
- Production deployment guide

==================================================
MONOREPO STRUCTURE
==================

Gunakan struktur:

apps/
├── api
└── web

packages/
├── ui
├── config
├── types
└── eslint-config

==================================================
CODING STANDARDS
================

WAJIB:

- TypeScript strict
- Clean code
- SOLID principles
- Reusable components
- No duplicated code
- Enterprise architecture
- Async/await
- Environment variables
- Feature modularization

==================================================
OUTPUT YANG HARUS DIGENERATE
============================

Generate secara bertahap:

1. Monorepo setup
2. Docker infrastructure
3. Next.js setup
4. NestJS setup
5. Prisma setup
6. Database schema
7. Authentication module
8. RBAC module
9. Frontend dashboard
10. Student module
11. Lecturer module
12. Academic system
13. LMS
14. Payment gateway
15. Online class
16. Notification system
17. Reporting
18. Queue workers
19. Swagger docs
20. Deployment configs

==================================================
WORKFLOW PENGERJAAN
===================

KERJAKAN BERTAHAP DAN JANGAN LOMPAT.

==================================================
STEP 1 — PROJECT INITIALIZATION
===============================

Buat:

- Turborepo monorepo
- PNPM workspace
- Next.js App Router
- NestJS API
- Shared packages
- TypeScript strict
- ESLint
- Prettier
- Husky
- lint-staged

==================================================
STEP 2 — INFRASTRUCTURE
=======================

Setup:

- Docker
- Docker Compose
- PostgreSQL
- Redis
- Nginx

==================================================
STEP 3 — BACKEND FOUNDATION
===========================

Setup:

- NestJS modular architecture
- ConfigModule
- Prisma
- Swagger
- Helmet
- ValidationPipe
- Exception filter
- Logger
- Rate limiter

==================================================
STEP 4 — DATABASE
=================

Generate:

- Prisma schema
- Migrations
- Seeders
- Repository base pattern

==================================================
STEP 5 — AUTHENTICATION
=======================

Build:

- Login
- Register
- JWT
- Refresh token
- RBAC
- Session management
- Audit logs

==================================================
STEP 6 — FRONTEND FOUNDATION
============================

Build:

- Dashboard layout
- Sidebar
- Header
- Mobile responsive layout
- Theme switcher
- Protected routes

==================================================
STEP 7 — ACADEMIC MODULES
=========================

Build:

- Students
- Lecturers
- Faculties
- Study programs
- Courses
- Schedules
- KRS/KHS

==================================================
STEP 8 — LMS MODULE
===================

Build:

- Course classroom
- Assignment
- Quiz
- Discussion
- Progress tracking

==================================================
STEP 9 — PAYMENT MODULE
=======================

Build:

- Invoice
- Midtrans
- Xendit
- Webhook
- Financial reports

==================================================
STEP 10 — ONLINE CLASS
======================

Build:

- Zoom integration
- Jitsi integration
- Attendance automation

==================================================
STEP 11 — NOTIFICATION SYSTEM
=============================

Build:

- Email notification
- WhatsApp notification
- Push notification
- In-app notification

==================================================
STEP 12 — REPORTING
===================

Build:

- Academic reports
- Financial reports
- Export Excel/PDF

==================================================
STEP 13 — TESTING
=================

Implement:

- Unit test
- Integration test
- E2E test

==================================================
STEP 14 — DEPLOYMENT
====================

Generate:

- Production Docker
- CI/CD pipeline
- Nginx config
- Environment setup
- Monitoring setup

==================================================
FINAL RESULT
============

Aplikasi harus:

- Production-ready
- Enterprise scalable
- Responsive
- Premium UI
- Secure
- SaaS-ready
- Multi-campus ready
- Mobile-ready backend
- Clean architecture
- Fully modular

Saat generate code:

- Jelaskan setiap langkah
- Generate per module
- Jangan langsung semua sekaligus
- Pastikan setiap step runnable
- Pastikan tidak ada error dependency
- Pastikan code clean dan maintainable
