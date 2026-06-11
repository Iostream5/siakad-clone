gunakan folder "prompt aplikasi", "docs", dan "clone-dumps" sebagai patokan/referensi.
Buat file workflow untuk AI Agent pada folder `.agent/workflow/`.

Workflow ini digunakan sebagai SOP berpikir dan SOP eksekusi AI Agent saat mengerjakan project.

Format wajib:

---
description: [deskripsi workflow]
---

# [Nama Workflow]

## Tujuan

Jelaskan tujuan workflow.

---

## FASE 1: ANALISIS

### Langkah-langkah

STEP 1:
Jelaskan apa yang harus diperiksa.

STEP 2:
Jelaskan validasi berikutnya.

STEP 3:
Jelaskan output fase ini.

### Checklist

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

---

## FASE 2: PERENCANAAN

### Langkah-langkah

STEP 1:
Identifikasi requirement.

STEP 2:
Identifikasi dependency.

STEP 3:
Identifikasi risiko.

### Checklist

- [ ] Requirement jelas
- [ ] Dependency jelas
- [ ] Risiko terdokumentasi

---

## FASE 3: IMPLEMENTASI

### Langkah-langkah

STEP 1:
Implementasi backend.

STEP 2:
Implementasi frontend.

STEP 3:
Integrasi.

### Contoh

✅ BENAR

```typescript
// contoh implementasi benar
```

❌ SALAH

```typescript
// contoh implementasi salah
```

### Checklist

- [ ] Sesuai rules
- [ ] Tidak melanggar security
- [ ] Tidak ada hardcode

---

## FASE 4: VALIDASI

### Langkah-langkah

STEP 1:
Review kode.

STEP 2:
Review security.

STEP 3:
Review business logic.

### Checklist

- [ ] Logic benar
- [ ] Security benar
- [ ] Data valid

---

## FASE 5: QA

### Langkah-langkah

STEP 1:
Test normal case.

STEP 2:
Test edge case.

STEP 3:
Test failure case.

### Checklist

- [ ] Normal case lolos
- [ ] Edge case lolos
- [ ] Error handling lolos

---

## FASE 6: FINAL REVIEW

### Checklist Akhir

□ Tidak ada bug kritis
□ Tidak ada security issue
□ Tidak ada pelanggaran rules
□ Dokumentasi diperbarui
□ Siap deploy

---

## Output yang Diharapkan

Tuliskan hasil akhir yang harus dicapai AI Agent setelah workflow selesai.