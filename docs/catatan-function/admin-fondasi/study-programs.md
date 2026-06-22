# study-programs.ts

## saveStudyProgramAction, deleteStudyProgramAction, importStudyProgramsAction
- **Deskripsi Singkat:** Operasi CRUD dan Import untuk data Program Studi.
- **Kesesuaian dengan Dokumen End-to-End:** **Belum Sesuai Sepenuhnya**.
- **Detail Temuan:**
  - Mengalami nasib yang sama dengan `faculties.ts`. Dokumen meminta *Soft Delete* dan *Restore*, namun nama fungsinya hanya `delete`.
- **Saran Perbaikan:**
  - Implementasikan pola *Soft Delete* dan *Restore* seperti pada `kampus.ts`.
