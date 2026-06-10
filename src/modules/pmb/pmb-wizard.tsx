import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "Pendaftaran",
    body: "Calon mahasiswa mengisi biodata, data orang tua, sekolah, dan berkas.",
  },
  {
    title: "Invoice PMB",
    body: "Sistem membuat invoice pendaftaran dan panitia menandai pembayaran terverifikasi.",
  },
  {
    title: "Seleksi",
    body: "Panitia mengisi skor, menentukan accepted atau rejected, lalu mengunci hasil seleksi.",
  },
  {
    title: "Registrasi",
    body: "Pendaftar accepted dikonversi menjadi mahasiswa aktif dengan NIM satu kali.",
  },
];

export function PmbWizard() {
  return (
    <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Wizard PMB</p>
          <h3 className="text-xl font-semibold text-slate-900">Alur penerimaan mahasiswa baru</h3>
        </div>
        <Link href="/pmb/daftar" target="_blank">
          <Button>
            Form PMB
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-lg bg-slate-50 p-5">
            <Badge>Step {index + 1}</Badge>
            <h4 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
