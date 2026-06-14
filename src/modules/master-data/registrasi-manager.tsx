"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, FileText, CheckCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrasiRow } from "@/lib/admin/registrasi";
import { generateRegistrasiAction, verifyRegistrasiAction, grantDispensasiAction } from "@/actions/registrasi";

export function RegistrasiManager({
  registrasiData,
  userRole,
  tahunAkademikList,
  prodiList
}: {
  registrasiData: RegistrasiRow[],
  userRole: string,
  tahunAkademikList: { id: string; nama: string; kode: string }[],
  prodiList: { id: string; nama: string; kode: string }[]
}) {
  const [activeTab, setActiveTab] = useState("mahasiswa");
  const [search, setSearch] = useState("");
  const [filterProdi, setFilterProdi] = useState("ALL");
  const [filterTahunAkademik, setFilterTahunAkademik] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = registrasiData.filter(item => {
    if (filterProdi !== "ALL" && item.mahasiswa?.program_studi?.nama !== filterProdi) return false;
    if (filterTahunAkademik !== "ALL" && item.tahun_akademik_id !== filterTahunAkademik) return false;
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.mahasiswa?.users?.full_name?.toLowerCase().includes(q);
      const matchNim = item.mahasiswa?.nim?.toLowerCase().includes(q);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  const handleVerify = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin memverifikasi pembayaran ini?")) return;
    setIsSubmitting(true);
    try {
      const res = await verifyRegistrasiAction({ registrasiId: id });
      if (res.error) alert(res.error);
      else alert("Registrasi berhasil diverifikasi");
    } catch (e) {
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispensasi = async (id: string) => {
    const catatan = prompt("Masukkan alasan dispensasi (wajib):");
    if (!catatan) return;
    setIsSubmitting(true);
    try {
      const res = await grantDispensasiAction({ registrasiId: id, catatan });
      if (res.error) alert(res.error);
      else alert("Dispensasi berhasil diberikan");
    } catch (e) {
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrasi Semester</h1>
        <p className="text-slate-500">Kelola daftar ulang mahasiswa berdasarkan pembayaran semester</p>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="mahasiswa">Daftar Mahasiswa</TabsTrigger>
              <TabsTrigger value="verifikasi">Verifikasi (Keuangan)</TabsTrigger>
              <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Cari nama / NIM..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={filterTahunAkademik} onValueChange={setFilterTahunAkademik}>
                <SelectTrigger><SelectValue placeholder="Tahun Akademik" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tahun Akademik</SelectItem>
                  {tahunAkademikList.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterProdi} onValueChange={setFilterProdi}>
                <SelectTrigger><SelectValue placeholder="Program Studi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Prodi</SelectItem>
                  {prodiList.map(p => (
                    <SelectItem key={p.id} value={p.nama}>{p.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="BELUM">Belum Daftar Ulang</SelectItem>
                  <SelectItem value="MENUNGGU">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="LUNAS">Lunas</SelectItem>
                  <SelectItem value="DISPENSASI">Dispensasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(userRole === "Admin" || userRole === "Keuangan") && (
              <div className="flex-1 md:text-right">
                <Button onClick={async () => {
                  if (filterTahunAkademik === "ALL") {
                    alert("Pilih Tahun Akademik terlebih dahulu untuk generate massal");
                    return;
                  }
                  if (!confirm("Generate daftar ulang massal untuk data yang difilter?")) return;

                  const mahasiswaIds = filteredData
                    .filter(d => !d.status || d.status === "BELUM")
                    .map(d => d.mahasiswa_id);

                  if (mahasiswaIds.length === 0) {
                    alert("Tidak ada data mahasiswa baru/belum daftar ulang untuk digenerate pada filter ini");
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    const res = await generateRegistrasiAction({
                      mahasiswaIds,
                      tahunAkademikId: filterTahunAkademik
                    });
                    if (res.error) alert(res.error);
                    else alert("Generate massal berhasil");
                  } catch (e) {
                    alert("Terjadi kesalahan");
                  } finally {
                    setIsSubmitting(false);
                  }
                }} disabled={isSubmitting}>
                  Generate Massal
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="mahasiswa" className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Mahasiswa</TH>
                    <TH>NIM</TH>
                    <TH>Prodi</TH>
                    <TH>Tahun Akademik</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredData.map(item => (
                    <TR key={item.id}>
                      <TD className="font-medium text-slate-900">{item.mahasiswa?.users?.full_name ?? "-"}</TD>
                      <TD>{item.mahasiswa?.nim ?? "-"}</TD>
                      <TD>{item.mahasiswa?.program_studi?.nama ?? "-"}</TD>
                      <TD>{item.tahun_akademik?.nama ?? "-"}</TD>
                      <TD>
                        <Badge
                          variant={
                            item.status === "LUNAS" ? "default" :
                            item.status === "DISPENSASI" ? "secondary" :
                            item.status === "MENUNGGU" ? "outline" : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="verifikasi" className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Mahasiswa</TH>
                    <TH>Tagihan</TH>
                    <TH>Status</TH>
                    <TH>Aksi</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredData.filter(d => d.status === "MENUNGGU" || d.status === "BELUM").map(item => (
                    <TR key={item.id}>
                      <TD>
                        <p className="font-medium text-slate-900">{item.mahasiswa?.users?.full_name}</p>
                        <p className="text-sm text-slate-500">{item.mahasiswa?.nim}</p>
                      </TD>
                      <TD>
                        {item.tagihan ? (
                          <div className="text-sm">
                            <p>Nominal: Rp {item.tagihan.nominal.toLocaleString("id-ID")}</p>
                            <p>Status: {item.tagihan.status}</p>
                          </div>
                        ) : "-"}
                      </TD>
                      <TD>
                        <Badge variant={item.status === "MENUNGGU" ? "outline" : "destructive"}>{item.status}</Badge>
                      </TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleVerify(item.id)} disabled={isSubmitting}>
                            <CheckCircle className="mr-1 h-4 w-4" /> Verifikasi
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDispensasi(item.id)} disabled={isSubmitting}>
                            <XCircle className="mr-1 h-4 w-4" /> Dispensasi
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="riwayat" className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Mahasiswa</TH>
                    <TH>Tahun Akademik</TH>
                    <TH>Status</TH>
                    <TH>Diverifikasi Oleh</TH>
                    <TH>Tanggal</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredData.filter(d => d.status === "LUNAS" || d.status === "DISPENSASI").map(item => (
                    <TR key={item.id}>
                      <TD>
                        <p className="font-medium text-slate-900">{item.mahasiswa?.users?.full_name}</p>
                        <p className="text-sm text-slate-500">{item.mahasiswa?.nim}</p>
                      </TD>
                      <TD>{item.tahun_akademik?.nama ?? "-"}</TD>
                      <TD>
                        <Badge variant={item.status === "LUNAS" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                        {item.catatan && <p className="text-xs text-slate-500 mt-1">Catatan: {item.catatan}</p>}
                      </TD>
                      <TD>{item.verifier?.full_name ?? "-"}</TD>
                      <TD>{item.verified_at ? format(new Date(item.verified_at), "dd MMM yyyy HH:mm", { locale: id }) : "-"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </TabsContent>

        </Tabs>
      </Card>
    </div>
  );
}
