import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Email atau username wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password harus sama",
  path: ["confirmPassword"],
});

export const pmbRegistrationSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap wajib diisi"),
  email: z.email("Email tidak valid"),
  phone: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
  program: z.string().min(1, "Program studi wajib dipilih"),
  registrationPath: z.string().min(1, "Jalur pendaftaran wajib dipilih"),
  registrationType: z.string().min(1, "Jenis pendaftaran wajib dipilih"),
  birthPlace: z.string().min(2, "Tempat lahir wajib diisi"),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["Laki-laki", "Perempuan"], {
    error: "Jenis kelamin tidak valid",
  }),
  address: z.string().min(8, "Alamat lengkap wajib diisi").max(300, "Alamat maksimal 300 karakter"),
  educationLevel: z.string().min(1, "Jenjang pendidikan wajib dipilih"),
  schoolName: z.string().min(3, "Asal sekolah wajib diisi"),
  schoolMajor: z.string().min(2, "Jurusan sekolah wajib diisi"),
  graduationYear: z.string().regex(/^\d{4}$/, "Tahun lulus harus 4 digit"),
  city: z.string().min(2, "Kota asal wajib diisi"),
  fatherName: z.string().min(3, "Nama ayah/wali wajib diisi"),
  fatherJob: z.string().min(2, "Pekerjaan ayah/wali wajib diisi"),
  motherName: z.string().min(3, "Nama ibu/wali wajib diisi"),
  motherJob: z.string().min(2, "Pekerjaan ibu/wali wajib diisi"),
  parentPhone: z
    .string()
    .min(10, "Nomor orang tua minimal 10 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor orang tua hanya boleh berisi angka"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export const academicYearSchema = z
  .object({
    kode: z.string().trim().min(2, "Kode wajib diisi"),
    nama: z.string().trim().min(3, "Nama periode wajib diisi"),
    semester: z.enum(["Ganjil", "Genap", "Pendek"], {
      error: "Semester tidak valid",
    }),
    tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
    tanggalSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
    isAktif: z.boolean(),
    isKrsOpen: z.boolean(),
  })
  .refine((value) => value.tanggalSelesai >= value.tanggalMulai, {
    message: "Tanggal selesai harus sesudah tanggal mulai",
    path: ["tanggalSelesai"],
  });

export const facultySchema = z.object({
  kode: z.string().trim().min(2, "Kode fakultas wajib diisi"),
  nama: z.string().trim().min(3, "Nama fakultas wajib diisi"),
  dekan: z.string().trim().max(120, "Nama dekan maksimal 120 karakter").optional().or(z.literal("")),
  deskripsi: z.string().trim().max(300, "Deskripsi maksimal 300 karakter").optional().or(z.literal("")),
  isAktif: z.boolean(),
});

export const studyProgramSchema = z.object({
  kode: z.string().trim().min(2, "Kode program studi wajib diisi"),
  nama: z.string().trim().min(3, "Nama program studi wajib diisi"),
  jenjang: z.string().trim().min(2, "Jenjang wajib diisi"),
  fakultasId: z.string().trim().min(1, "Fakultas wajib dipilih"),
  isAktif: z.boolean(),
});

export const mataKuliahSchema = z.object({
  kode: z.string().trim().min(2, "Kode mata kuliah wajib diisi"),
  nama: z.string().trim().min(3, "Nama mata kuliah wajib diisi"),
  sks: z.number().int().min(1, "SKS minimal 1").max(30, "SKS maksimal 30"),
  semester: z.number().int().min(1, "Semester minimal 1").max(20, "Semester maksimal 20"),
  jenis: z.string().trim().min(1, "Jenis mata kuliah wajib diisi").max(40, "Jenis maksimal 40 karakter"),
  prodiId: z.string().trim().min(1, "Program studi wajib dipilih"),
  isAktif: z.boolean(),
});

export const dosenSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap wajib diisi"),
  email: z.string().trim().email("Email tidak valid"),
  nidn: z.string().trim().min(5, "NIDN minimal 5 karakter").optional().or(z.literal("")),
  nip: z.string().trim().optional().or(z.literal("")),
  gelar: z.string().trim().optional().or(z.literal("")),
  homebaseProdiId: z.string().trim().min(1, "Homebase prodi wajib dipilih"),
  statusDosen: z.string().trim().min(1, "Status dosen wajib diisi"),
});

export const mahasiswaSchema = z.object({
  fullName: z.string().trim().min(3, "Nama lengkap wajib diisi"),
  email: z.string().trim().email("Email tidak valid"),
  nim: z.string().trim().min(5, "NIM minimal 5 karakter").optional().or(z.literal("")),
  namaIbuKandung: z.string().trim().optional().or(z.literal("")),
  tempatLahir: z.string().trim().optional().or(z.literal("")),
  tanggalLahir: z.string().optional().or(z.literal("")),
  angkatan: z.number().int().min(2000).max(2100),
  prodiId: z.string().trim().min(1, "Program studi wajib dipilih"),
  statusMahasiswa: z.enum(["CALON", "AKTIF", "NON-AKTIF", "CUTI", "LULUS", "DO"]),
});

export const gedungSchema = z.object({
  kode: z.string().trim().min(2, "Kode gedung wajib diisi"),
  nama: z.string().trim().min(3, "Nama gedung wajib diisi"),
  jumlahLantai: z.number().int().min(1),
  isAktif: z.boolean(),
});

export const ruanganSchema = z.object({
  kode: z.string().trim().min(2, "Kode ruangan wajib diisi"),
  nama: z.string().trim().min(3, "Nama ruangan wajib diisi"),
  gedungId: z.string().trim().min(1, "Gedung wajib dipilih"),
  lantai: z.number().int().min(1),
  jenisRuangan: z.string().trim().min(1, "Jenis ruangan wajib diisi"),
  kapasitas: z.number().int().min(1, "Kapasitas minimal 1"),
  isAktif: z.boolean(),
});

export const kampusSchema = z.object({
  kode: z.string().trim().min(2, "Kode kampus wajib diisi"),
  nama: z.string().trim().min(3, "Nama kampus wajib diisi"),
  alamat: z.string().trim().max(300, "Alamat maksimal 300 karakter").optional().or(z.literal("")),
  kota: z.string().trim().max(80, "Nama kota maksimal 80 karakter").optional().or(z.literal("")),
  telepon: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter").optional().or(z.literal("")),
  email: z.string().trim().email("Email kampus tidak valid").optional().or(z.literal("")),
  isAktif: z.boolean(),
});

export const kelasSchema = z.object({
  kode: z.string().trim().min(2, "Kode kelas wajib diisi"),
  nama: z.string().trim().min(2, "Nama kelas wajib diisi"),
  prodiId: z.string().trim().optional().or(z.literal("")),
  angkatan: z.number().int().min(2000).max(2100).optional().nullable(),
  tingkat: z.string().trim().max(20, "Tingkat maksimal 20 karakter").optional().or(z.literal("")),
  kapasitas: z.number().int().min(1, "Kapasitas minimal 1"),
  isAktif: z.boolean(),
});

export const kurikulumSchema = z.object({
  kode: z.string().trim().min(2, "Kode kurikulum wajib diisi"),
  nama: z.string().trim().min(3, "Nama kurikulum wajib diisi"),
  prodiId: z.string().trim().min(1, "Program studi wajib dipilih"),
  tahunMulai: z.number().int().min(2000).max(2100),
  totalSks: z.number().int().min(0, "Total SKS tidak valid"),
  deskripsi: z.string().trim().max(300, "Deskripsi maksimal 300 karakter").optional().or(z.literal("")),
  isAktif: z.boolean(),
});
