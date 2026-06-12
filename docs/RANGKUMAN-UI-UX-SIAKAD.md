# Rangkuman UI/UX SIAKAD STAI Al-Ittihad

Dokumen ini merangkum kondisi UI/UX project saat ini sebagai bahan dasar untuk membuat workflow UI/UX berikutnya. Dokumen ini bukan SOP final, bukan checklist eksekusi lengkap, dan tidak mengubah API, database, route, atau behavior aplikasi.

## 1. Konteks Project

SIAKAD STAI Al-Ittihad adalah aplikasi akademik berbasis dashboard operasional. UI utama berada di area `/dashboard`, dengan beberapa halaman publik seperti landing page dan PMB online.

Karakter UI yang paling cocok untuk dashboard adalah dense enterprise SaaS: rapi, hemat ruang, mudah discan, dan fokus ke data serta aksi kerja. Halaman publik boleh lebih marketing, tetapi tetap harus branded, jelas, dan memakai aset visual yang nyata.

Environment project saat audit ini adalah `DEV`. Jika workflow UI/UX nanti membutuhkan validasi live Supabase, gunakan MCP `siakad_dev`, bukan MCP production.

## 2. Stack UI Saat Ini

Stack UI yang terpasang dan dipakai project:

- Next.js 16 dan React 19.
- Tailwind CSS v4 melalui `@tailwindcss/postcss`.
- shadcn/ui style dengan komponen lokal di `src/components/ui`.
- Radix UI untuk primitive seperti dialog, dropdown, select, tabs, checkbox, avatar, dan command.
- lucide-react untuk icon.
- TanStack Table tersedia untuk tabel kompleks, meski banyak tabel saat ini masih memakai wrapper table internal.
- React Hook Form dan Zod tersedia untuk form dan validasi.
- Recharts untuk grafik dashboard.
- Framer Motion untuk transisi halaman dan micro-interaction.
- `clsx` dan `tailwind-merge` melalui helper `cn()` di `src/lib/utils.ts`.

Konfigurasi shadcn berada di `components.json`. Styling global berada di `src/app/globals.css`; project memakai Tailwind v4, jadi tidak ada `tailwind.config.js` tradisional.

## 3. Struktur UI Saat Ini

Struktur UI utama:

- `src/components/ui`: komponen dasar seperti `Button`, `Card`, `Badge`, `Input`, `Dialog`, `Table`, `Tabs`, `Select`, `Checkbox`, `ToastProvider`, dan skeleton loading.
- `src/components/layout`: shell aplikasi, sidebar, topbar, dan footer.
- `src/modules/*`: komponen fitur per domain seperti dashboard, master data, PMB, keuangan, LMS, KRS, nilai, laporan, settings.
- `src/app/dashboard/*`: route page tipis yang melakukan auth, mengambil data server-side, lalu mengoper props ke module client.
- `src/app/page.tsx`, `src/app/pmb/*`, dan `src/app/login/*`: halaman publik, PMB, dan login.

Pola yang paling sehat saat ini adalah server page tipis plus module client untuk interaksi. Contoh: page dashboard master data mengambil data dan permission, lalu module seperti `KampusManager` mengelola search, modal, selection, dan submit action.

## 4. Baseline Pola Terbaik

### CRUD List dan Tabel

Baseline terbaik untuk CRUD list adalah `src/modules/master-data/kampus-manager.tsx`.

Pola yang layak dipertahankan:

- Search memakai URL query `q`.
- Pagination memakai URL query `page`.
- Mode data aktif/sampah/semua memakai URL query `view`.
- Data list datang dari server page.
- Tabel punya checkbox selection.
- Ada bulk action toolbar saat row dipilih.
- Ada create/edit modal.
- Ada delete confirmation.
- Ada soft delete, restore, dan hard delete.
- Ada import, export, dan template.
- Ada toast feedback setelah action.
- Setelah action sukses, modal ditutup dan data direfresh.

Catatan: komponen ini masih memakai custom `ModalShell`. Untuk workflow ke depan, pola behavior-nya boleh dijadikan baseline, tetapi implementasi modal baru sebaiknya distandarkan ke Radix `Dialog`.

### Layout Dashboard

Baseline layout adalah:

- `src/components/layout/dashboard-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/topbar.tsx`

Pola yang layak dipertahankan:

- Sidebar responsive dengan mode collapsed dan mobile overlay.
- Topbar fixed untuk akses cepat.
- Command search tersedia dari topbar.
- Notification preview tersedia di topbar.
- Role switcher tersedia jika user punya multi-role.
- Sidebar item berasal dari access context, bukan menu hardcode di page.

Catatan: `sidebar.tsx` masih punya mapping icon/accent berdasarkan route. Untuk workflow nanti, route-level metadata seperti icon, label, dan badge sebaiknya punya sumber yang lebih konsisten.

### Dashboard Overview

Baseline dashboard adalah `src/modules/dashboard/overview.tsx`.

Pola yang layak dipertahankan:

- Metric cards ringkas.
- Chart diload dynamic agar tidak membebani SSR.
- Loading chart punya skeleton.
- Admin mendapat highlight card berbasis data real.
- Area kanan bisa diisi activity feed atau pengumuman sesuai role.

### Modal Detail Data Kompleks

Baseline modal detail kompleks adalah `src/modules/finance/modals/ledger-modal.tsx`.

Pola yang layak dipertahankan:

- Modal menampilkan ringkasan, tabel detail, dan timeline.
- Header sticky.
- Ada `role="dialog"` dan `aria-modal`.
- Close button punya `aria-label`.
- Data uang memakai formatter, bukan string manual.
- Status divisualkan dengan badge.

Catatan: behavior modal detail ini bagus, tetapi modal custom sebaiknya diselaraskan dengan Radix `Dialog` agar focus trap dan keyboard handling konsisten.

## 5. Best Practice yang Perlu Dipertahankan

### URL State

State list yang memengaruhi data harus masuk URL:

- Search: `q`
- Pagination: `page`
- Trash/all/active: `view`
- Tab modul: `tab`
- Detail spesifik jika perlu: `id`

State lokal boleh dipakai untuk modal open/close, selected row, draft input, dan state UI sementara.

### Server Page Tipis

Route page di `src/app/dashboard/*/page.tsx` sebaiknya tetap tipis:

- Jalankan `requireUser` atau `requireAuthorizedUser`.
- Ambil data awal dari helper server.
- Parse `searchParams`.
- Kirim props ke module client.

Komponen client tidak boleh mengambil data sensitif langsung dengan service role. Mutasi tetap lewat Server Action.

### Form dan Validasi

Form harus punya validasi Zod di action atau helper. Untuk form kompleks, workflow ke depan sebaiknya mendorong React Hook Form + Zod agar error field konsisten.

Setiap field form wajib punya:

- Label yang jelas.
- `name` yang benar.
- Type sesuai isi data.
- `autocomplete` untuk field yang relevan.
- Inline error atau pesan feedback yang jelas.

### Feedback Async

Setiap action async harus punya feedback:

- Loading state saat submit.
- Disabled state saat pending.
- Toast sukses/gagal.
- Pesan error yang bisa ditindaklanjuti user.
- `router.refresh()` atau revalidation setelah mutasi sukses.

### State Data

Setiap halaman data perlu menangani:

- Loading state.
- Empty state.
- Error state.
- Data penuh.
- Data terlalu panjang.
- Data kosong per field.

Tabel harus aman di mobile dengan horizontal scroll dan teks panjang memakai `truncate`, `line-clamp`, atau `break-words`.

### Aksi Destruktif

Delete, reset, hard delete, bulk delete, dan aksi permanen wajib memakai confirmation dialog. Hard delete harus dibedakan visual dan copy-nya dari soft delete.

## 6. Inkonsistensi UI/UX Saat Ini

Beberapa inkonsistensi yang perlu jadi perhatian workflow:

- Banyak module master data membuat `ModalShell` sendiri, bukan memakai Radix `Dialog`.
- Beberapa icon-only button hanya memakai `title` atau tidak punya `aria-label`.
- Radius komponen belum seragam: ada `rounded-none`, `rounded-lg`, `rounded-2xl`, sampai `rounded-[2rem]`.
- Style card belum satu arah: ada glassmorphism, flat card, sharp card, dan card dekoratif.
- Sebagian form masih manual dengan `useActionState`, belum React Hook Form.
- Ada beberapa `as any` atau prop `any` di module UI, terutama area LMS, KRS, dan beberapa manager.
- Beberapa tab hanya local state atau button visual, belum selalu sinkron URL.
- Ada penggunaan `transition-all` dan animasi besar seperti bounce yang perlu dibatasi.
- Input fokus di beberapa komponen memakai `outline-none` tanpa ring pengganti yang cukup kuat.
- Beberapa tombol di dalam form belum eksplisit `type="button"` atau `type="submit"`.
- Empty state banyak yang sudah ada, tetapi desain dan copy-nya belum konsisten.
- Dark mode disebut di rules, tetapi implementasi theme switcher saat ini masih placeholder.
- Halaman publik masih memakai placeholder visual untuk hero kampus; untuk workflow nanti, halaman publik sebaiknya memakai aset kampus nyata.

## 7. Rekomendasi Arah UI/UX

### Dashboard Operasional

Dashboard harus mengikuti arah dense enterprise SaaS:

- Gunakan layout yang padat tapi tidak sesak.
- Prioritaskan tabel, filter, tab, toolbar, dan status.
- Hindari hero besar di dashboard.
- Hindari dekorasi visual yang tidak membantu kerja.
- Gunakan typography kecil-menengah yang stabil.
- Gunakan card hanya untuk metric, panel, modal, atau item berulang.

### Master Data

Master data harus menjadi pola paling standar:

- Header ringkas berisi judul, deskripsi, dan primary action.
- Toolbar berisi search, filter, import, export, template.
- Tabel dengan pagination server-side.
- Modal create/edit.
- Bulk action saat row dipilih.
- Soft delete, trash view, restore, hard delete.
- Empty state dan error state.
- URL state untuk search, page, dan view.

### Keuangan

Keuangan perlu UI yang lebih tegas dan audit-friendly:

- Angka uang memakai `Intl.NumberFormat`.
- Status pembayaran/tagihan harus konsisten via badge.
- Detail tagihan/pembayaran cocok memakai modal ledger.
- Aksi seperti verifikasi, generate tagihan, dan delete tarif wajib konfirmasi.
- Timeline dan riwayat harus mudah discan.
- Jangan memakai style terlalu dekoratif untuk data finansial.

### LMS dan Akademik

LMS boleh sedikit lebih ekspresif, tetapi tetap harus jelas:

- Tab materi, tugas, forum, peserta harus konsisten.
- Deadline dan status tugas harus terlihat cepat.
- Empty state harus memberi aksi berikutnya jika role boleh membuat data.
- File download harus pakai link yang jelas dan accessible.
- Forum card tidak boleh memakai button non-fungsional jika sebenarnya hanya dekorasi.

### Halaman Publik

Halaman publik boleh lebih marketing:

- Brand kampus harus jelas di viewport pertama.
- Gunakan aset nyata kampus atau visual yang relevan.
- CTA utama harus jelas.
- Public page tetap harus mobile-friendly.
- Hindari placeholder kosong untuk hero visual.

## 8. Checklist Siap Workflow

Checklist ini bisa diubah menjadi workflow UI/UX resmi.

### Struktur dan Komponen

- Gunakan komponen dari `src/components/ui` sebelum membuat komponen baru.
- Jika membuat pattern baru, cek apakah pattern itu reusable lintas modul.
- Jangan membuat duplikat lokal untuk `Button`, `Badge`, `Card`, `Dialog`, atau `Table`.
- Modal baru memakai Radix `Dialog`.
- Icon memakai lucide-react.

### Aksesibilitas

- Icon-only button wajib `aria-label`.
- Form control wajib label.
- Dialog wajib punya title, description jika perlu, focus trap, dan close yang jelas.
- Toast wajib `aria-live="polite"`.
- Focus state wajib terlihat.
- Link untuk navigasi, button untuk aksi.
- Image wajib `alt`; decorative image pakai `alt=""`.

### Responsif

- Dashboard dan tabel harus aman di mobile.
- Tabel kompleks pakai horizontal scroll.
- Toolbar action harus wrap rapi.
- Text panjang harus truncate atau break.
- Modal maksimal tinggi viewport dan bisa scroll.

### Data dan Tabel

- Search, filter, tab, pagination masuk URL jika memengaruhi data.
- Tabel besar wajib server-side pagination.
- Empty state tidak boleh blank.
- Error state tidak boleh expose stack trace atau detail internal.
- Date, number, dan currency memakai `Intl`.

### Form

- Validasi input memakai Zod.
- Form kompleks memakai React Hook Form + Zod.
- Submit button punya pending state.
- Error field tampil dekat field.
- File upload validasi tipe dan ukuran di server.
- Setelah submit sukses, tampilkan toast dan refresh data.

### Feedback dan Error

- Semua action async punya toast.
- Loading state tidak boleh menggeser layout secara liar.
- Error message harus menjelaskan langkah berikutnya.
- Jangan tampilkan error raw dari database.

### Visual Consistency

- Radius, spacing, shadow, dan card style harus distandarkan.
- Dashboard memakai palet enterprise yang kalem.
- Gunakan warna status secara konsisten: sukses, warning, error, info.
- Hindari `transition-all` jika tidak perlu.
- Animasi harus ringan dan tidak mengganggu workflow.

### Commit Safety

- Jangan commit `.env.local`, `env`, `env.local`, token, atau dump berisi secret.
- `.env.example` boleh tracked asal tanpa nilai secret.
- Jangan menaruh value secret di dokumen UI/UX.
- Jika workflow UI/UX nanti butuh cek live Supabase, env `DEV` berarti gunakan MCP `siakad_dev`.

## 9. Kandidat File Referensi

File yang bisa dijadikan referensi saat membuat workflow:

- `src/modules/master-data/kampus-manager.tsx`
- `src/components/layout/dashboard-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/topbar.tsx`
- `src/modules/dashboard/overview.tsx`
- `src/modules/finance/modals/ledger-modal.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/toast-provider.tsx`
- `.agents/rules/04-ui-components.md`
- `.agents/workflows/06-sop-pola-kode.md`
- `.agents/workflows/09-sop-testing-smoke.md`

## 10. Kesimpulan

UI/UX project sudah punya pondasi yang cukup bagus: layout dashboard, komponen UI dasar, toast, skeleton, tabel, modal, dan pola master data sudah ada. Masalah utamanya bukan tidak ada UI system, tetapi konsistensi penerapan.

Workflow UI/UX berikutnya sebaiknya tidak mendesain ulang total. Arah yang lebih aman adalah standarisasi bertahap: kunci pola CRUD master data, samakan modal ke Radix Dialog, wajibkan aksesibilitas dasar, rapikan URL state, batasi variasi visual, dan jadikan dashboard sebagai aplikasi kerja yang padat dan jelas.
