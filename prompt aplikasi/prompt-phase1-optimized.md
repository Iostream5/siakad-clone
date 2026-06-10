# SIAKAD Enterprise Phase 1 Implementation Prompt

Bangun aplikasi SIAKAD Enterprise Multi-Tenant di folder saat ini.

## Fokus Phase 1

Bangun hanya fondasi dan pengalaman Super Admin:

- Landing Page kampus modern
- Authentication dengan Better Auth
- Login menggunakan email atau username
- Remember me
- Forgot password dan reset password flow dasar
- Super Admin Dashboard
- Dynamic RBAC
- Dynamic Menu Builder
- CRUD Users
- CRUD Roles
- CRUD Permissions
- CRUD Menus
- CRUD Master Akademik dasar:
  - Kampus
  - Fakultas
  - Program Studi
  - Ruangan
  - Kelas
  - Tahun Akademik
  - Kurikulum
- Audit Logs
- Notification Templates dasar

Jangan membangun penuh modul PMB, Keuangan, LMS, EDOM, Payment Gateway, dan FCM pada Phase 1. Cukup siapkan struktur database, permission seed, menu seed, CRUD master akademik dasar, dan arsitektur agar modul tersebut mudah ditambahkan pada fase berikutnya.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- Shadcn-style reusable components
- Prisma ORM
- SQLite untuk development
- PostgreSQL atau Supabase PostgreSQL-ready untuk production
- Better Auth
- Server Actions jika sesuai

## Arsitektur

Gunakan struktur:

```txt
src/
  app/
  application/
  domain/
  infrastructure/
  modules/
  shared/
```

Prinsip:

- Clean Architecture
- Repository pattern
- SOLID secara pragmatis
- Feature/module boundary jelas
- Tidak hardcode role/menu/permission di UI utama
- Sidebar admin dirender dari database

## Multi-Tenant

Wajib ada:

- `tenants`
- relasi user ke tenant
- `tenantId` pada data utama
- role tenant-scoped
- audit log tenant-aware

Untuk Phase 1, seed satu tenant default kampus.

## Database

Wajib:

- UUID/string id
- `createdAt`
- `updatedAt`
- `deletedAt`
- soft delete untuk entity bisnis
- index untuk pencarian dan foreign key penting
- schema siap migrasi SQLite ke PostgreSQL tanpa mengubah service layer

Tabel Phase 1:

- users/auth user
- sessions
- accounts
- verification
- tenants
- tenant_users
- roles
- permissions
- role_permissions
- user_roles
- menus
- menu_permissions
- audit_logs
- settings
- campuses
- faculties
- departments
- classrooms
- class_groups
- academic_terms
- curriculums
- notification_templates

Siapkan skeleton enum atau permission untuk modul masa depan:

- PMB
- Academic
- Finance
- LMS
- EDOM
- Payment
- Notification
- Developer Tools

## UI/UX

Target desain:

- Premium Enterprise SaaS
- Clean
- Responsive
- Dense tetapi tetap nyaman dibaca
- Light mode dan dark mode
- Referensi rasa: Stripe, Vercel, Linear, Supabase, Notion

Wajib ada:

- loading state
- empty state
- error state
- tabel dengan search, sorting visual, pagination UI
- form tambah/edit memakai modal responsive
- import Excel, export Excel, dan download template Excel untuk master data
- bulk delete, soft delete, restore, dan hapus permanen untuk master data
- form validation dengan Zod
- layout admin dengan sidebar, topbar, breadcrumbs/konteks halaman
- komponen reusable

## Acceptance Criteria

Selesai jika:

- Project berhasil dibuat di folder ini
- `npm install` berhasil
- `npx prisma validate` berhasil
- `npx prisma generate` berhasil
- seed berhasil membuat Super Admin
- Super Admin bisa login
- Dashboard Super Admin tampil
- CRUD Users/Roles/Permissions/Menus tersedia
- CRUD Master Akademik dasar tersedia: Kampus, Fakultas, Program Studi, Ruangan, Kelas, Tahun Akademik, dan Kurikulum
- Master data memiliki modal form, search otomatis, filter, pagination, import/export Excel, template Excel, bulk delete, soft delete, restore, dan hapus permanen
- Sidebar admin dirender dari database
- Audit log tercatat untuk aksi penting
- `npm run build` berhasil

## Akun Seed

- Email: `superadmin@siakad.local`
- Username: `superadmin`
- Password: `SuperAdmin123!`
