"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Home,
  Phone,
  School,
  UploadCloud,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { registerPmbAction, type PmbRegistrationState } from "@/actions/pmb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: PmbRegistrationState = {
  error: null,
  success: null,
};

const registrationPaths = ["Reguler", "Prestasi", "Beasiswa", "Transfer"];
const registrationTypes = ["Baru", "Pindahan", "Lanjutan"];
const educationLevels = ["SMA/MA", "SMK", "Paket C", "Transfer"];
const genderOptions = ["Laki-laki", "Perempuan"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-[0.95rem] font-semibold shadow-[0_14px_24px_rgba(15,118,110,0.22)] hover:brightness-105"
      disabled={pending}
    >
      <span>{pending ? "Mengirim pendaftaran..." : "Kirim pendaftaran"}</span>
      {!pending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
    </Button>
  );
}

export function PmbRegistrationForm({
  programOptions,
}: {
  programOptions: { id: string; nama: string }[];
}) {
  const [state, formAction] = useActionState(registerPmbAction, initialState);

  return (
    <div className="space-y-5">
      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-[linear-gradient(180deg,#f2fbf7_0%,#ffffff_100%)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <p className="text-[0.88rem] uppercase tracking-[0.2em] text-emerald-700">Pendaftaran diterima</p>
              <h2 className="text-xl font-semibold text-slate-950">{state.success.fullName}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nomor pendaftaran</p>
                  <p className="mt-2 font-mono text-[0.92rem] font-semibold text-slate-950">
                    {state.success.registrationNumber}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Program pilihan</p>
                  <p className="mt-2 text-[0.92rem] font-semibold text-slate-950">{state.success.program}</p>
                </div>
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Invoice PMB</p>
                  <p className="mt-2 font-mono text-[0.92rem] font-semibold text-slate-950">
                    {state.success.invoiceNumber}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Biaya pendaftaran</p>
                  <p className="mt-2 text-[0.92rem] font-semibold text-slate-950">
                    {formatCurrency(state.success.invoiceAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email login</p>
                  <p className="mt-2 text-[0.92rem] font-semibold text-slate-950">{state.success.loginEmail}</p>
                </div>
                <div className="rounded-xl bg-white p-3.5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Password sementara</p>
                  <p className="mt-2 font-mono text-[0.92rem] font-semibold text-slate-950">
                    {state.success.temporaryPassword}
                  </p>
                </div>
              </div>
              <p className="text-[0.92rem] leading-6 text-slate-600">
                Konfirmasi pendaftaran akan dikirim ke <span className="font-medium text-slate-900">{state.success.email}</span>.
                Batas pembayaran invoice:{" "}
                <span className="font-medium text-slate-900">
                  {new Date(state.success.invoiceDueAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                </span>
                .
              </p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.88rem] leading-6 text-amber-800">
                Simpan password sementara ini. Setelah login, buka menu Keuangan untuk membayar invoice PMB.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form action={formAction} encType="multipart/form-data" className="grid gap-6">
        <section className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <UserRound className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Biodata</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Nama lengkap</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="fullName" className="h-12 rounded-xl pl-11" placeholder="Nama sesuai ijazah" required />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Email aktif</label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="email" type="email" className="h-12 rounded-xl pl-11" placeholder="nama@email.com" required />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="phone" className="h-12 rounded-xl pl-11" placeholder="08xxxxxxxxxx" required />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Jenis kelamin</label>
              <select
                name="gender"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih jenis kelamin
                </option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Tempat lahir</label>
              <Input name="birthPlace" className="h-12 rounded-xl" placeholder="Kota lahir" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Tanggal lahir</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="birthDate" type="date" className="h-12 rounded-xl pl-11" required />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Alamat lengkap</label>
              <div className="relative">
                <Home className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="address" className="h-12 rounded-xl pl-11" placeholder="Alamat domisili" required />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <School className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Pilihan dan pendidikan</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Program studi</label>
              <select
                name="program"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih program studi
                </option>
                {programOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Jalur pendaftaran</label>
              <select
                name="registrationPath"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih jalur
                </option>
                {registrationPaths.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Jenis pendaftaran</label>
              <select
                name="registrationType"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih jenis
                </option>
                {registrationTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Jenjang pendidikan</label>
              <select
                name="educationLevel"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Pilih jenjang
                </option>
                {educationLevels.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Asal sekolah</label>
              <Input name="schoolName" className="h-12 rounded-xl" placeholder="SMA / MA / SMK" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Jurusan sekolah</label>
              <Input name="schoolMajor" className="h-12 rounded-xl" placeholder="IPA / IPS / Keagamaan / RPL" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Tahun lulus</label>
              <Input name="graduationYear" inputMode="numeric" maxLength={4} className="h-12 rounded-xl" placeholder="2026" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Kota asal</label>
              <Input name="city" className="h-12 rounded-xl" placeholder="Kota / Kabupaten" required />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <UsersRound className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Data orang tua</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Nama ayah / wali</label>
              <Input name="fatherName" className="h-12 rounded-xl" placeholder="Nama lengkap" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Pekerjaan ayah / wali</label>
              <Input name="fatherJob" className="h-12 rounded-xl" placeholder="Pekerjaan" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Nama ibu / wali</label>
              <Input name="motherName" className="h-12 rounded-xl" placeholder="Nama lengkap" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Pekerjaan ibu / wali</label>
              <Input name="motherJob" className="h-12 rounded-xl" placeholder="Pekerjaan" required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Nomor orang tua / wali</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input name="parentPhone" className="h-12 rounded-xl pl-11" placeholder="08xxxxxxxxxx" required />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <UploadCloud className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Berkas</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Identitas diri</label>
              <Input name="identityFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-12 rounded-xl bg-white file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Ijazah / SKL</label>
              <Input name="diplomaFile" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-12 rounded-xl bg-white file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" required />
            </div>
            <div>
              <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Pas foto</label>
              <Input name="photoFile" type="file" accept=".jpg,.jpeg,.png" className="h-12 rounded-xl bg-white file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold" />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <WalletCards className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Catatan</h3>
          </div>
          <div>
            <label className="mb-2 block text-[0.92rem] font-medium text-slate-800">Catatan tambahan</label>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[0.92rem] text-slate-900 outline-none transition focus:border-[var(--primary)]"
              placeholder="Opsional"
            />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[0.78rem] leading-5 text-slate-500">
              Format berkas: PDF, JPG, atau PNG. Maksimal 2MB per file.
            </p>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.92rem] leading-6 text-red-700">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  );
}
