---
trigger: always_on
---

# UI & Component Rules

## Tujuan
Memastikan AI menghasilkan komponen UI yang konsisten, responsif, aksesibel, dan mengikuti pola yang sudah ada di project — termasuk tabel, form, modal, master data, import/export, dan state handling.

---

## 1. Gambaran Umum

### Design Language

Target desain: **Premium Enterprise SaaS** — referensi Stripe, Vercel, Linear, Supabase, Notion.

| Karakteristik | Deskripsi |
|---|---|
| Mode | Light mode + Dark mode wajib |
| Density | Dense tapi tetap nyaman dibaca |
| Responsif | Semua halaman harus mobile-friendly |
| State | Loading, empty, error state wajib ada |
| Animasi | Framer Motion untuk transisi dan micro-interaction |

### Stack UI

| Library | Kegunaan |
|---|---|
| Tailwind CSS v4 | Styling — konfigurasi di CSS, bukan `tailwind.config.js` |
| Shadcn UI + Radix UI | Komponen UI — copy ke `/components/ui`, jangan dimodifikasi langsung |
| Framer Motion | Animasi transisi halaman dan sidebar |
| Tanstack Table | Tabel dengan sorting, filter, pagination |
| React Hook Form + Zod | Form dan validasi |
| lucide-react | Icon |
| Recharts | Chart dan grafik |

---

## 2. Aturan Inti

### 2.1 Semua Form Wajib Validasi Zod

✅ BENAR
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const FakultasSchema = z.object({
  kode: z.string().min(2, 'Kode minimal 2 karakter').max(10),
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  is_active: z.boolean().default(true),
})

type FakultasForm = z.infer<typeof FakultasSchema>

function FakultasFormComponent() {
  const form = useForm<FakultasForm>({
    resolver: zodResolver(FakultasSchema),
    defaultValues: { kode: '', nama: '', is_active: true },
  })

  async function onSubmit(data: FakultasForm) {
    const result = await saveFakultasAction(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Fakultas berhasil disimpan')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="kode" control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage /> {/* Error message otomatis dari Zod */}
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

❌ SALAH
```typescript
// Form tanpa validasi Zod
function BadForm() {
  const [nama, setNama] = useState('')
  async function handleSubmit() {
    if (!nama) alert('Nama wajib diisi') // validasi manual ad-hoc
    await saveAction({ nama })
  }
}
```

### 2.2 Semua Tabel Wajib Search, Sort, Pagination

✅ BENAR
```typescript
// Tabel dengan search, sorting, pagination
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  searchValue: string
  onSearchChange: (value: string) => void
}

function DataTable<T>({ data, columns, totalCount, page, pageSize, ... }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // sorting, filter dihandle server-side untuk tabel besar
  })

  return (
    <div>
      <Input
        placeholder="Cari..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Table>...</Table>
      <Pagination
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  )
}
```

❌ SALAH
```typescript
// Tabel tanpa pagination — bahaya untuk data besar
function BadTable({ data }: { data: any[] }) {
  return <table>{data.map(row => <tr>...</tr>)}</table>
}
```

### 2.3 Master Data Wajib: Modal Form, Import/Export, Soft Delete

Setiap halaman master data **WAJIB** memiliki:

| Fitur | Keterangan |
|---|---|
| Modal form | Create/edit via dialog/sheet — bukan halaman baru |
| Search otomatis | Debounced search input |
| Filter | Minimal filter status (aktif/nonaktif) |
| Pagination | Server-side pagination |
| Bulk delete | Checkbox + bulk action toolbar |
| Soft delete | Pindah ke trash, bisa di-restore |
| Hard delete | Hapus permanen dari trash, dengan konfirmasi |
| Import Excel | Upload file `.xlsx`, validasi kolom |
| Export Excel | Download data tabel ke `.xlsx` |
| Template Excel | Download template untuk import |

### 2.4 Loading, Empty, Error State Wajib

✅ BENAR
```typescript
function MasterDataPage() {
  const { data, isLoading, error } = useFakultasList()

  if (isLoading) return <TableSkeleton rows={5} />

  if (error) return (
    <ErrorState
      message="Gagal memuat data fakultas"
      onRetry={refetch}
    />
  )

  if (!data || data.length === 0) return (
    <EmptyState
      title="Belum ada fakultas"
      description="Tambahkan fakultas pertama Anda"
      action={<Button onClick={openCreateModal}>Tambah Fakultas</Button>}
    />
  )

  return <DataTable data={data} ... />
}
```

❌ SALAH
```typescript
// Tidak ada state handling — crash atau blank screen saat loading/error
function BadPage() {
  const { data } = useFakultasList()
  return <table>{data.map(row => <tr>...</tr>)}</table>
}
```

### 2.5 Aksi Destruktif Wajib Konfirmasi

✅ BENAR
```typescript
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Hapus Permanen</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

❌ SALAH
```typescript
// Hapus langsung tanpa konfirmasi
<Button onClick={() => deleteAction(id)}>Hapus</Button>
```

---

## 3. Workflow

### CRUD Master Data Flow

```text
Halaman Master Data
  → Tabel (search + filter + sort + pagination)
    → Klik "Tambah" → Modal Form (Zod validation)
      → Submit → Server Action → Database
        → Toast sukses/gagal → Refresh tabel

  → Klik row → Modal Edit (pre-filled)
      → Submit → Server Action → Database
        → Toast sukses/gagal → Refresh tabel

  → Centang rows → Bulk Action Toolbar muncul
      → "Hapus Terpilih" → Konfirmasi → Soft delete

  → Tab "Arsip" / filter deleted
      → Tabel data terhapus
        → "Pulihkan" → Restore
        → "Hapus Permanen" → Konfirmasi → Hard delete
```

### Import Excel Flow

```text
Klik "Import"
  → Dialog upload file
    → User upload .xlsx
      → Preview data (opsional)
        → Validasi kolom wajib
          → Jika valid: insert ke database
            → Tampilkan ringkasan: berhasil/gagal per baris
          → Jika invalid: tampilkan error per kolom
```

---

## 4. Implementasi

### Import/Export Excel Pattern

```typescript
// Export Excel — menggunakan library xlsx
import * as XLSX from 'xlsx'

export function exportToExcel<T>(data: T[], filename: string, headers: Record<keyof T, string>) {
  const worksheetData = [
    Object.values(headers), // header row
    ...data.map(row => Object.keys(headers).map(key => row[key as keyof T]))
  ]

  const ws = XLSX.utils.aoa_to_sheet(worksheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Template Excel — header saja, tanpa data
export function downloadTemplate(filename: string, headers: string[]) {
  const ws = XLSX.utils.aoa_to_sheet([headers])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `template_${filename}.xlsx`)
}
```

### Sidebar Dinamis dari Database

```typescript
// src/components/layout/sidebar.tsx
// Sidebar TIDAK hardcode menu — selalu dari database

async function Sidebar() {
  const user = await requireUser()
  const menus = await getMenusForRole(user.active_role) // query database

  return (
    <nav>
      {menus.map(menu => (
        <SidebarItem key={menu.key} menu={menu} />
      ))}
    </nav>
  )
}
```

### Toast Feedback Pattern

```typescript
// Gunakan toast untuk semua aksi async
import { toast } from 'sonner' // atau toast library yang dipakai project

async function handleSave(data: FormData) {
  try {
    const result = await saveAction(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Data berhasil disimpan')
      setOpen(false) // tutup modal
      router.refresh() // refresh data
    }
  } catch (e) {
    toast.error('Terjadi kesalahan, coba lagi')
  }
}
```

---

## 5. Security Rules

- Form submit tidak langsung memanggil database — selalu melalui **Server Action**
- Client component tidak boleh import `createAdminSupabaseClient`
- Data sensitif (nilai, tagihan, identitas) tidak ditampilkan ke role yang tidak berwenang
- Bulk action wajib validasi di server, bukan hanya client
- File upload (import Excel, dokumen PMB) wajib validasi tipe dan ukuran file
- Export data wajib cek role — keuangan tidak boleh ekspor data nilai, misalnya

---

## 6. Anti Pattern

❌ Form tanpa Zod validation  
❌ Tabel tanpa pagination untuk data besar  
❌ Hardcode menu/navigation di sidebar — harus dari database  
❌ Aksi hapus/submit tanpa feedback (loading state atau toast)  
❌ Delete tanpa dialog konfirmasi  
❌ Import data tanpa validasi kolom  
❌ `any` type di props komponen  
❌ Render error message raw dari database ke user  
❌ Client component yang query langsung ke Supabase dengan service role  
❌ UI komponen yang menampilkan data lintas user tanpa cek role  

---

## 7. Checklist AI

Sebelum menulis komponen UI, verifikasi:

- [ ] Apakah form menggunakan React Hook Form + Zod?
- [ ] Apakah tabel memiliki search, sort, dan pagination?
- [ ] Apakah master data punya modal form (bukan halaman terpisah)?
- [ ] Apakah loading, empty, dan error state ada?
- [ ] Apakah aksi destruktif (delete, reset) punya konfirmasi?
- [ ] Apakah ada toast feedback untuk setiap aksi async?
- [ ] Apakah sidebar mengambil menu dari database?
- [ ] Apakah import/export/template tersedia untuk master data?
- [ ] Apakah soft delete, restore, dan hard delete tersedia?
- [ ] Apakah komponen responsif untuk mobile?

---

## 8. Ringkasan

- Form: **React Hook Form + Zod** — validasi wajib semua form
- Tabel: **search + sort + filter + pagination** — wajib di semua tabel data
- Master data: **modal form, import/export/template Excel, bulk delete, soft delete, restore, hard delete**
- State: **loading, empty, error** — wajib ada di setiap halaman data
- Destruktif: **dialog konfirmasi** sebelum delete/reset
- Feedback: **toast** untuk semua aksi async
- Sidebar: **dari database** — tidak hardcode
- Design: **Premium Enterprise SaaS** — Tailwind v4, Shadcn, Framer Motion, dark/light mode
