import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  GraduationCap, 
  ShieldCheck, 
  University, 
  BookOpen, 
  Users, 
  Award,
  Globe,
  Clock,
  MapPin,
  Mail,
  Phone
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Mahasiswa Aktif", value: "1,200+", icon: Users },
  { label: "Program Studi", value: "8", icon: BookOpen },
  { label: "Dosen Profesional", value: "45+", icon: Award },
  { label: "Akreditasi", value: "Baik Sekali", icon: ShieldCheck },
];

const features = [
  {
    title: "Pendaftaran Online",
    desc: "Proses PMB yang mudah, cepat, dan transparan dari mana saja.",
    link: "/pmb/daftar",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100"
  },
  {
    title: "Sistem Akademik",
    desc: "Kelola KRS, lihat Nilai, dan pantau progres studi dalam satu dashboard.",
    link: "/login",
    color: "bg-blue-50 text-blue-700 border-blue-100"
  },
  {
    title: "Layanan Keuangan",
    desc: "Pembayaran UKT dan biaya pendidikan yang terintegrasi.",
    link: "/dashboard/keuangan",
    color: "bg-amber-50 text-amber-700 border-amber-100"
  }
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar Premium */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <Image 
                src="/logostai.png" 
                alt="Logo STAI" 
                fill 
                className="object-contain"
              />
            </div>
            <div>
              <span className="block text-lg font-bold leading-none text-slate-900">SIAKAD</span>
              <span className="text-xs font-medium tracking-widest text-emerald-600 uppercase">STAI AL-ITTIHAD</span>
            </div>
          </div>
          
          <div className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-600">
            <Link href="/" className="text-emerald-600">Beranda</Link>
            <Link href="/pmb" className="hover:text-emerald-600 transition-colors">PMB</Link>
            <Link href="#" className="hover:text-emerald-600 transition-colors">Akademik</Link>
            <Link href="#" className="hover:text-emerald-600 transition-colors">Tentang Kami</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
            </Link>
            <Link href="/pmb/daftar">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(16,185,129,0.08)_0%,transparent_100%)]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                PMB Tahun Akademik 2026/2027 Telah Dibuka
              </div>
              <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                Wujudkan Masa Depan <span className="text-emerald-600 italic">Gemilang</span> Bersama Kami
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl">
                Sistem Informasi Akademik STAI AL-ITTIHAD hadir untuk memberikan kemudahan akses informasi, 
                pendaftaran, dan manajemen perkuliahan yang modern, transparan, dan terintegrasi.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/pmb/daftar">
                  <Button size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                    Daftar Mahasiswa Baru
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-200">
                    Portal Akademik
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xl">
                <div className="aspect-[4/3] relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-transparent mix-blend-overlay" />
                  {/* Ganti dengan image real kampus jika ada */}
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
                    <University className="h-20 w-20 opacity-20" />
                  </div>
                </div>
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 hidden sm:block">
                <Card className="p-4 shadow-xl border-emerald-100 bg-white/90 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Beasiswa Tersedia</p>
                      <p className="text-xs text-slate-500">Hingga 100% biaya kuliah</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-16 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm mb-4">
                  <stat.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-base font-semibold leading-7 text-emerald-600">Layanan Terpadu</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Segala Kebutuhan Akademik Dalam Satu Pintu
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className={`p-8 border-2 transition-all hover:shadow-xl ${feature.color}`}>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm leading-relaxed opacity-80 mb-6">
                  {feature.desc}
                </p>
                <Link href={feature.link}>
                  <Button variant="ghost" className="group p-0 hover:bg-transparent font-bold">
                    Selengkapnya 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 mb-24">
        <div className="relative isolate overflow-hidden bg-slate-900 px-6 pt-16 shadow-2xl rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
            aria-hidden="true"
          >
            <circle cx={512} cy={512} r={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                <stop stopColor="#10b981" />
                <stop offset={1} stopColor="#065f46" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Siap Bergabung Menjadi Bagian Dari Kami?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Jangan lewatkan kesempatan untuk mendapatkan pendidikan berkualitas dengan fasilitas modern.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link href="/pmb/daftar">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Daftar Sekarang
                </Button>
              </Link>
              <Link href="#" className="text-sm font-semibold leading-6 text-white">
                Pelajari Alur Pendaftaran <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-10">
                  <Image src="/logostai.png" alt="Logo STAI" fill className="object-contain" />
                </div>
                <span className="font-bold text-slate-900 tracking-tight">STAI AL-ITTIHAD</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Mencetak generasi rabbani yang unggul dalam ilmu pengetahuan dan berakhlak mulia.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors">
                  <Globe className="h-4 w-4" />
                </Link>
                {/* Tambahkan social media lain jika ada */}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Link Cepat</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link></li>
                <li><Link href="/pmb" className="hover:text-emerald-600 transition-colors">PMB Online</Link></li>
                <li><Link href="/login" className="hover:text-emerald-600 transition-colors">Portal Mahasiswa</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Portal Dosen</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Akademik</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Program Studi</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Kalender Akademik</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Perpustakaan</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">E-Learning</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Kontak Kami</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Jl. Raya Cianjur - Bandung, Jawa Barat, Indonesia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>(0263) 123456</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>info@stai-alittihad.ac.id</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
            <p>© 2026 STAI AL-ITTIHAD. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-slate-900">Kebijakan Privasi</Link>
              <Link href="#" className="hover:text-slate-900">Syarat & Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
