---
description: SOP standar UI/UX untuk SIAKAD berdasarkan audit kode aktual project. Mencakup baseline pola terbaik yang sudah ada, inkonsistensi yang harus diseragamkan, komponen yang wajib dipakai, dan standar state handling yang harus diikuti di setiap halaman baru.
---

# SOP UI/UX Standard — SIAKAD STAI Al-Ittihad

## FASE 1: BASELINE POLA YANG WAJIB DIIKUTI

### Langkah-langkah

STEP 1: Kenali file referensi yang menjadi standar project.

Sebelum membuat komponen atau halaman baru, baca file-file ini sebagai patokan:

| File | Dipakai sebagai referensi untuk |
|------|--------------------------------|
| `src/modules/master-data/kampus-manager.tsx` | Pola CRUD list: URL state, modal, bulk action, soft delete |
| `src/components/layout/dashboard-shell.tsx` | Pola layout shell: sidebar + topbar + main content |
| `src/components/layout/sidebar.tsx` | Pola sidebar: dark theme, icon mapping, nested menu |
| `src/components/layout/topbar.tsx` | Pola topbar: glassmorphism, search, notif, role switcher |
| `src/modules/finance/modals/ledger-modal.tsx` | Pola modal kompleks: sticky header, tabel, timeline |
| `src/components/ui/button.tsx` | Varian button yang tersedia |
| `src/components/ui/card.tsx` | Standar card dengan rounded-[1.5rem] dan shadow |
| `src/components/ui/table.tsx` | Wrapper tabel yang sudah distandarkan |
| `src/components/ui/toast-provider.tsx` | Sistem toast yang sudah ada |

STEP 2: Pahami design language aktual project.

Design language yang sudah ditetapkan di codebase:

- **Target visual:** Premium Enterprise SaaS — referensi Stripe, Vercel, Linear
- **Mode:** Light mode aktif; dark mode belum diimplementasi (jangan tambahkan dulu)
- **Sidebar:** Dark gradient `#202333 → #232738 → #1f2432` dengan teks putih
- **Dashboard area:** Light, glassmorphism subtle, background gradient slate
- **Card standar:** `rounded-[1.5rem]`, `border border-black/5`, `shadow-[0_14px_36px_rgba(15,23,42,0.08)]`, `bg-white/90 backdrop-blur`
- **Topbar:** Glassmorphism `bg-white/70`, `backdrop-blur-xl`, `border border-white/80`

STEP 3: Aturan yang tidak boleh dilanggar.

```
❌ Jangan tambah library UI baru (MUI, Ant Design, Chakra, dll)
❌ Jangan pakai icon library selain lucide-react
❌ Jangan hardcode warna hex di komponen — pakai CSS variable atau Tailwind token
❌ Jangan buat radius/shadow/spacing sendiri — ikuti yang sudah ada di Card, Button
❌ Jangan pakai transition-all berlebihan — animasi harus ringan
❌ Jangan buat ModalShell custom baru — pakai Radix Dialog dari src/components/ui/dialog.tsx
```

### Checklist

- [ ] File referensi yang relevan sudah dibaca sebelum membuat komponen baru
- [ ] Design language aktual sudah dipahami (warna, radius, shadow)
- [ ] Tidak menambah library UI atau icon baru
- [ ] Tidak membuat varian card/button/modal sendiri

---

## FASE 2: POLA CRUD LIST (STANDAR KAMPUS-MANAGER)

### Langkah-langkah

STEP 1: Setiap halaman master data harus mengikuti pola kampus-manager.

Pola yang sudah terbukti di `kampus-manager.tsx` dan wajib direplikasi:

```
URL State (wajib masuk URL, bukan state lokal):
  ?q=         → search keyword
  ?page=      → halaman pagination
  ?view=      → active | trash | all

State Lokal (boleh pakai useState):
  formOpen    → modal create/edit buka atau tutup
  editingItem → data yang sedang diedit
  deletingItem → data yang mau dihapus
  selectedIds → checkbox yang dipilih (bulk action)
```

STEP 2: Struktur layout halaman list yang harus diikuti.

```tsx
// Urutan layout standar dalam Card
<Card>
  {/* 1. Header: judul + action buttons */}
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
        <IconModul className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Judul Modul</h3>
        <p className="text-sm text-slate-500">Deskripsi singkat modul</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {/* Tombol: Aktif, Sampah, Import, Export, Template, Tambah */}
    </div>
  </div>

  {/* 2. Search form */}
  <form onSubmit={handleSearch} className="mt-5 flex gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <Input placeholder="Cari..." className="pl-10" />
    </div>
    <Button type="submit">Cari</Button>
    <Button type="button" variant="secondary">Reset</Button>
  </form>

  {/* 3. Bulk action bar — muncul hanya saat ada yang dipilih */}
  {selectedIds.length > 0 && (
    <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
      {/* Bulk actions */}
    </div>
  )}

  {/* 4. Tabel */}
  <div className="mt-5 overflow-x-auto">
    <Table>{/* ... */}</Table>
  </div>

  {/* 5. Pagination */}
  <div className="mt-5 flex items-center justify-between border-t pt-4">
    <p className="text-sm text-slate-500">Menampilkan X dari Y data.</p>
    {/* Tombol Sebelumnya / Berikutnya */}
  </div>
</Card>
```

STEP 3: Modal form menggunakan ModalShell ATAU Radix Dialog.

Aturan ke depan:
- **Halaman baru:** wajib pakai Radix `Dialog` dari `src/components/ui/dialog.tsx`
- **Halaman lama yang sudah pakai ModalShell:** jangan diubah dulu kecuali ada task refactor khusus

```tsx
// ✅ BENAR — modal baru pakai Radix Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{item ? "Edit Data" : "Tambah Data"}</DialogTitle>
    </DialogHeader>
    {/* form content */}
  </DialogContent>
</Dialog>
```

### Checklist

- [ ] URL state dipakai untuk search, page, dan view
- [ ] State lokal hanya untuk open/close modal dan selection
- [ ] Layout mengikuti urutan: header → search → bulk bar → tabel → pagination
- [ ] Modal baru menggunakan Radix Dialog (bukan ModalShell baru)
- [ ] Soft delete tersedia (view=trash, restore, hard delete)

---

## FASE 3: POLA FORM

### Langkah-langkah

STEP 1: Form baru wajib pakai React Hook Form + Zod.

Aturan ke depan:
- **Form baru:** wajib RHF + Zod
- **Form lama yang pakai `useActionState`:** jangan diubah kecuali ada task refactor

```typescript
// ✅ BENAR — form baru dengan RHF + Zod
const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  kode: z.string().min(1, "Kode wajib diisi").max(20),
});

const form = useForm({ resolver: zodResolver(schema) });

async function onSubmit(values: z.infer<typeof schema>) {
  const result = await saveAction(values);
  if (!result.success) {
    toast.error(result.error as string);
    return;
  }
  toast.success("Data berhasil disimpan");
  onClose();
  router.refresh();
}
```

STEP 2: Standar field label dan error.

```tsx
// Label + Input + Error — pola yang konsisten
<div>
  <label className="mb-2 block text-sm font-medium text-slate-800">
    Nama <span className="text-rose-500">*</span>
  </label>
  <Input name="nama" placeholder="..." required />
  {/* Error dari RHF */}
  {form.formState.errors.nama && (
    <p className="mt-1 text-xs text-rose-600">
      {form.formState.errors.nama.message}
    </p>
  )}
</div>
```

STEP 3: Submit button dengan loading state.

```tsx
// Submit button — menggunakan useFormStatus atau isSubmitting dari RHF
<Button
  type="submit"
  disabled={isSubmitting}
  className="w-full bg-cyan-600 hover:bg-cyan-700"
>
  {isSubmitting
    ? "Menyimpan..."
    : item ? "Simpan Perubahan" : "Tambah Data"
  }
</Button>
```

### Checklist

- [ ] Form baru menggunakan React Hook Form + Zod
- [ ] Setiap field punya label yang jelas
- [ ] Field wajib ditandai (bintang merah atau keterangan)
- [ ] Error tampil di bawah field yang bermasalah
- [ ] Submit button menunjukkan loading state
- [ ] Tombol batal selalu tersedia

---

## FASE 4: STATE HANDLING

### Langkah-langkah

STEP 1: Loading state — gunakan skeleton, bukan spinner polos.

```tsx
// ✅ BENAR — skeleton yang mencerminkan struktur tabel
{isLoading ? (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
    ))}
  </div>
) : (
  <Table>...</Table>
)}
```

STEP 2: Empty state — pesan berbeda untuk kosong vs tidak ada hasil filter.

```tsx
// Data memang kosong
<div className="py-10 text-center text-slate-500">
  <Building2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
  <p className="font-medium">Belum ada data kampus</p>
  <p className="text-sm mt-1">Mulai dengan menambahkan kampus pertama</p>
  <Button className="mt-4" onClick={() => setFormOpen(true)}>
    Tambah Kampus
  </Button>
</div>

// Ada filter aktif tapi tidak ada hasil
<div className="py-10 text-center text-slate-500">
  <p>Data tidak ditemukan untuk pencarian "{query}"</p>
  <Button variant="secondary" className="mt-3" onClick={resetFilter}>
    Reset Pencarian
  </Button>
</div>
```

STEP 3: Toast — gunakan `useToast` dari `src/components/ui/toast-provider.tsx`.

```typescript
// ✅ BENAR — pakai useToast yang sudah ada di project
const { success, error, info } = useToast();

success("Kampus berhasil ditambahkan");
error("Gagal menghapus kampus", "Silakan coba lagi.");
info("Data sedang diproses");

// ❌ SALAH — import sonner atau toast library lain
import { toast } from "sonner"; // tidak dipakai di project ini
```

### Checklist

- [ ] Loading state pakai skeleton (bukan spinner atau blank)
- [ ] Empty state membedakan "data kosong" vs "tidak ada hasil filter"
- [ ] Empty state saat kosong punya action button (Tambah)
- [ ] Toast menggunakan `useToast` dari toast-provider.tsx
- [ ] Error dari Server Action ditampilkan via toast atau field error
- [ ] Halaman tidak crash saat data null/undefined

---

## FASE 5: AKSESIBILITAS DAN KONSISTENSI

### Langkah-langkah

STEP 1: Standar yang wajib dipenuhi di setiap komponen.

```
□ Icon-only button wajib punya title atau aria-label
□ Form input wajib punya label (bukan placeholder saja)
□ Dialog/Modal wajib ada: title, close button dengan aria-label
□ Link untuk navigasi halaman, button untuk aksi
□ Image wajib punya alt (decorative image: alt="")
□ Focus state harus terlihat (jangan hapus outline tanpa pengganti)
□ Tombol aksi destruktif wajib ada konfirmasi (AlertDialog)
```

STEP 2: Standar radius dan spacing yang sudah ada di project.

Ikuti pola yang sudah dipakai — jangan buat variasi baru:

```
Card utama:     rounded-[1.5rem]
Modal/Dialog:   rounded-[1.75rem]
Button:         rounded-lg (sudah di button.tsx)
Input:          rounded-lg (ikuti yang sudah ada)
Badge:          rounded-full
Sidebar item:   rounded-2xl
Tabel row:      tidak ada radius (flat)
Icon container: rounded-xl atau rounded-2xl
```

STEP 3: Inkonsistensi yang sedang dalam proses perbaikan.

Ini adalah known issues project — jangan direplikasi di kode baru:

```
⚠️  Beberapa modul masih pakai ModalShell sendiri → baru pakai Dialog
⚠️  Beberapa form masih useActionState → baru pakai RHF
⚠️  Ada beberapa `as any` di modul LMS dan KRS → hindari di kode baru
⚠️  Dark mode belum diimplementasi → jangan tambahkan dulu
⚠️  Empty state copy belum konsisten → ikuti pola di fase 4
```

### Checklist Akhir

```
□ Icon-only button punya aria-label atau title
□ Semua form input punya label
□ Modal punya title dan close button yang accessible
□ Radius komponen mengikuti standar yang sudah ada
□ Tidak ada pola baru yang tidak konsisten dengan codebase
□ Toast menggunakan useToast dari toast-provider.tsx
□ Loading, empty, dan error state semua tersedia
□ Aksi destruktif menggunakan AlertDialog konfirmasi
□ Tidak menambah library atau pola baru yang bertentangan dengan existing
```

---

## Output yang Diharapkan

1. **Konsistensi bertahap** — halaman baru mengikuti pola kampus-manager dan komponen yang sudah ada.
2. **Tidak ada ModalShell baru** — semua modal baru pakai Radix Dialog.
3. **Form baru pakai RHF** — tidak ada form baru yang masih manual.
4. **State handling lengkap** — loading skeleton, empty state kontekstual, toast dari useToast.
5. **Tidak ada regresi visual** — perubahan baru tidak merusak halaman yang sudah rapi.