import "server-only";

import { getStudentLedger, type StudentLedgerData } from "@/lib/admin/finance";
import { getStudentKrs } from "@/lib/admin/krs";
import { getLmsClassesForStudent } from "@/lib/admin/lms";
import { getMahasiswaByUserId, type MahasiswaRow } from "@/lib/admin/mahasiswa";
import { listRegistrasi, type RegistrasiRow } from "@/lib/admin/registrasi";
import { createAdminClient } from "@/supabase/admin";

export type PostNimStepStatus = "done" | "current" | "pending" | "blocked";

export type PostNimStep = {
  key: "nim" | "tagihan" | "registrasi" | "krs" | "approval" | "lms";
  label: string;
  href: string;
  status: PostNimStepStatus;
  description: string;
};

export type PostNimNextAction = {
  href: string;
  label: string;
  title: string;
  description: string;
};

export type PostNimActiveYear = {
  id: string;
  kode: string | null;
  nama: string | null;
  semester: string | null;
  is_krs_open: boolean;
};

export type MahasiswaPostNimFlow = {
  mahasiswa: MahasiswaRow | null;
  activeYear: PostNimActiveYear | null;
  ledger: StudentLedgerData | null;
  registrasi: RegistrasiRow | null;
  currentKrs: {
    id?: string;
    status?: string | null;
    total_sks?: number | null;
  } | null;
  lmsClassesCount: number;
  canSubmitKrs: boolean;
  krsLockedReason: string | null;
  nextAction: PostNimNextAction;
  steps: PostNimStep[];
  summary: {
    ipk: number | null;
    ips: number | null;
    outstanding: number;
    activeBills: number;
    overdueBills: number;
    paidBills: number;
    registrasiStatus: string;
    krsStatus: string;
    totalSks: number;
    lmsClasses: number;
  };
};

const fallbackAction: PostNimNextAction = {
  href: "/dashboard",
  label: "Lihat dashboard",
  title: "Dashboard mahasiswa belum lengkap",
  description: "Data mahasiswa belum bisa dirangkum sekarang.",
};

function isRegistrasiComplete(registrasi: RegistrasiRow | null) {
  return registrasi?.status === "LUNAS" || registrasi?.status === "DISPENSASI";
}

function countActiveBills(ledger: StudentLedgerData | null) {
  if (!ledger) return 0;
  return ledger.tagihan.filter((item) => item.status !== "Lunas" && item.status !== "Dispensasi").length;
}

function getActiveOutstanding(ledger: StudentLedgerData | null) {
  if (!ledger) return 0;

  return ledger.tagihan
    .filter((item) => item.status !== "Lunas" && item.status !== "Dispensasi")
    .reduce((total, item) => total + item.remaining, 0);
}

function getKrsLockedReason(options: {
  mahasiswa: MahasiswaRow | null;
  activeYear: PostNimActiveYear | null;
  registrasi: RegistrasiRow | null;
}) {
  if (!options.mahasiswa?.id) return "Profil mahasiswa belum tersedia.";
  if (!options.activeYear?.id) return "Tahun akademik aktif belum diset.";
  if (!options.activeYear.is_krs_open) return "Periode KRS belum dibuka.";
  if (!options.registrasi) return "Registrasi semester belum dibuat.";
  if (!isRegistrasiComplete(options.registrasi)) {
    return "Daftar ulang harus LUNAS atau DISPENSASI dulu.";
  }

  return null;
}

function getStepStatus(done: boolean, current: boolean, blocked = false): PostNimStepStatus {
  if (done) return "done";
  if (blocked) return "blocked";
  if (current) return "current";
  return "pending";
}

function buildNextAction(options: {
  mahasiswa: MahasiswaRow | null;
  ledger: StudentLedgerData | null;
  registrasi: RegistrasiRow | null;
  currentKrs: { status?: string | null } | null;
  activeYear: PostNimActiveYear | null;
  lmsClassesCount: number;
}) {
  const activeBills = countActiveBills(options.ledger);
  const registrasiComplete = isRegistrasiComplete(options.registrasi);
  const krsStatus = options.currentKrs?.status ?? null;

  if (!options.mahasiswa?.id) {
    return {
      href: "/dashboard/profil",
      label: "Lengkapi profil",
      title: "Profil mahasiswa belum siap",
      description: "Data mahasiswa perlu dilengkapi sebelum lanjut daftar ulang.",
    };
  }

  if (!options.ledger || options.ledger.tagihan.length === 0) {
    return {
      href: "/dashboard/keuangan?tab=tagihan",
      label: "Cek tagihan",
      title: "Tagihan semester belum ada",
      description: "Tunggu admin/keuangan membuat tagihan semester.",
    };
  }

  if (activeBills > 0) {
    return {
      href: "/dashboard/keuangan?tab=tagihan",
      label: "Bayar tagihan",
      title: "Ada tagihan aktif",
      description: "Selesaikan pembayaran atau minta dispensasi jika ada kebijakan kampus.",
    };
  }

  if (!options.registrasi || !registrasiComplete) {
    return {
      href: "/dashboard/registrasi",
      label: "Cek daftar ulang",
      title: "Registrasi semester belum selesai",
      description: "Status daftar ulang harus LUNAS atau DISPENSASI sebelum KRS.",
    };
  }

  if (!options.activeYear?.is_krs_open) {
    return {
      href: "/dashboard/krs",
      label: "Pantau KRS",
      title: "Periode KRS belum dibuka",
      description: "KRS bisa diisi setelah tahun akademik aktif membuka periode KRS.",
    };
  }

  if (!krsStatus || krsStatus === "Ditolak") {
    return {
      href: "/dashboard/krs",
      label: "Isi KRS",
      title: "KRS siap diisi",
      description: "Pilih mata kuliah dan ajukan KRS ke dosen wali/prodi.",
    };
  }

  if (krsStatus === "Diajukan") {
    return {
      href: "/dashboard/krs",
      label: "Pantau approval",
      title: "KRS menunggu approval",
      description: "KRS sudah diajukan dan menunggu persetujuan dosen wali/prodi.",
    };
  }

  if (krsStatus === "Disetujui" && options.lmsClassesCount > 0) {
    return {
      href: "/dashboard/akademik/lms",
      label: "Masuk LMS",
      title: "Kelas LMS tersedia",
      description: "Kelas LMS mengikuti KRS yang sudah disetujui.",
    };
  }

  return {
    href: "/dashboard/akademik/lms",
    label: "Cek LMS",
    title: "KRS sudah disetujui",
    description: "LMS akan tampil jika kelas dan materi sudah disiapkan dosen.",
  };
}

export async function getMahasiswaPostNimFlow(userId: string): Promise<MahasiswaPostNimFlow> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      mahasiswa: null,
      activeYear: null,
      ledger: null,
      registrasi: null,
      currentKrs: null,
      lmsClassesCount: 0,
      canSubmitKrs: false,
      krsLockedReason: "Koneksi database belum tersedia.",
      nextAction: fallbackAction,
      steps: [],
      summary: {
        ipk: null,
        ips: null,
        outstanding: 0,
        activeBills: 0,
        overdueBills: 0,
        paidBills: 0,
        registrasiStatus: "BELUM",
        krsStatus: "BELUM ISI",
        totalSks: 0,
        lmsClasses: 0,
      },
    };
  }

  const [mahasiswa, activeYearResult] = await Promise.all([
    getMahasiswaByUserId(userId),
    supabase
      .from("tahun_akademik")
      .select("id, kode, nama, semester, is_krs_open")
      .eq("is_aktif", true)
      .maybeSingle(),
  ]);

  const activeYear = (activeYearResult.data ?? null) as PostNimActiveYear | null;

  const [ledger, registrasiList, currentKrs, lmsClasses] = mahasiswa?.id
    ? await Promise.all([
        getStudentLedger(mahasiswa.id),
        activeYear?.id ? listRegistrasi({ mahasiswaId: mahasiswa.id, tahunAkademikId: activeYear.id }) : Promise.resolve([]),
        activeYear?.id ? getStudentKrs(mahasiswa.id, activeYear.id) : Promise.resolve(null),
        getLmsClassesForStudent(userId),
      ])
    : [null, [], null, []];

  const registrasi = registrasiList[0] ?? null;
  const krsLockedReason = getKrsLockedReason({ mahasiswa, activeYear, registrasi });
  const canSubmitKrs = !krsLockedReason;
  const lmsClassesCount = lmsClasses.length;
  const activeBills = countActiveBills(ledger);
  const registrasiComplete = isRegistrasiComplete(registrasi);
  const krsStatus = currentKrs?.status ?? null;
  const krsApproved = krsStatus === "Disetujui";

  const nextAction = buildNextAction({
    mahasiswa,
    ledger,
    registrasi,
    currentKrs,
    activeYear,
    lmsClassesCount,
  });

  const steps: PostNimStep[] = [
    {
      key: "nim",
      label: "NIM aktif",
      href: "/dashboard/profil",
      status: getStepStatus(Boolean(mahasiswa?.nim), !mahasiswa?.nim),
      description: mahasiswa?.nim ? `NIM ${mahasiswa.nim}` : "Data NIM belum terbaca.",
    },
    {
      key: "tagihan",
      label: "Tagihan semester",
      href: "/dashboard/keuangan?tab=tagihan",
      status: getStepStatus(Boolean(ledger?.tagihan.length && activeBills === 0), activeBills > 0 || !ledger?.tagihan.length),
      description: ledger?.tagihan.length
        ? `${activeBills} tagihan aktif`
        : "Tagihan semester belum tersedia.",
    },
    {
      key: "registrasi",
      label: "Daftar ulang",
      href: "/dashboard/registrasi",
      status: getStepStatus(registrasiComplete, Boolean(registrasi && !registrasiComplete), !registrasi),
      description: registrasi ? `Status ${registrasi.status}` : "Registrasi semester belum dibuat.",
    },
    {
      key: "krs",
      label: "Isi KRS",
      href: "/dashboard/krs",
      status: getStepStatus(Boolean(krsStatus), canSubmitKrs && !krsStatus, !canSubmitKrs),
      description: krsStatus ? `Status ${krsStatus}` : krsLockedReason ?? "KRS siap diisi.",
    },
    {
      key: "approval",
      label: "Approval KRS",
      href: "/dashboard/krs",
      status: getStepStatus(krsApproved, krsStatus === "Diajukan", !krsStatus || krsStatus === "Ditolak"),
      description: krsApproved ? "KRS sudah disetujui." : krsStatus === "Diajukan" ? "Menunggu approval." : "Belum ada KRS disetujui.",
    },
    {
      key: "lms",
      label: "Akses LMS",
      href: "/dashboard/akademik/lms",
      status: getStepStatus(krsApproved && lmsClassesCount > 0, krsApproved && lmsClassesCount === 0, !krsApproved),
      description: krsApproved ? `${lmsClassesCount} kelas LMS` : "LMS aktif setelah KRS disetujui.",
    },
  ];

  return {
    mahasiswa,
    activeYear,
    ledger,
    registrasi,
    currentKrs: currentKrs
      ? {
          id: currentKrs.id,
          status: currentKrs.status,
          total_sks: currentKrs.total_sks,
        }
      : null,
    lmsClassesCount,
    canSubmitKrs,
    krsLockedReason,
    nextAction,
    steps,
    summary: {
      ipk: mahasiswa?.ipk ?? null,
      ips: mahasiswa?.ips ?? null,
      outstanding: getActiveOutstanding(ledger),
      activeBills,
      overdueBills: ledger?.summary.overdueBills ?? 0,
      paidBills: ledger?.summary.paidBills ?? 0,
      registrasiStatus: registrasi?.status ?? "BELUM",
      krsStatus: krsStatus ?? "BELUM ISI",
      totalSks: Number(currentKrs?.total_sks ?? 0),
      lmsClasses: lmsClassesCount,
    },
  };
}
