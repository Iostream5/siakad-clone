"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgePercent, Banknote, Calculator, CalendarDays, ChevronRight, CreditCard, Landmark, Network, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";

import { deleteFinanceSetupAction, saveFinanceSetupAction, setActiveAcademicYearAction } from "@/actions/finance-setup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type MasterBiayaItem = {
  id: string;
  nama: string;
  nominal: number | string;
  angkatan?: number | null;
  tingkat_kelas?: string[] | null;
  jurusan?: string[] | null;
  gelombang?: string | null;
  jalur?: string | null;
  status?: boolean | null;
  program_studi?: { nama?: string | null } | null;
  tahun_akademik?: { nama?: string | null } | null;
};

type AcademicYearOption = {
  id: string;
  kode?: string | null;
  nama: string;
  semester?: string | null;
  is_aktif?: boolean | null;
};

type StudyProgramOption = {
  id: string;
  nama: string;
};

type SetupRecord = Record<string, any>;

type FinanceSetupData = {
  coa: SetupRecord[];
  bankAccounts: SetupRecord[];
  bankIntegrations: SetupRecord[];
  paymentMethods: SetupRecord[];
  scholarships: SetupRecord[];
  categories: SetupRecord[];
};

interface TabSetupProps {
  masterBiayaList: MasterBiayaItem[];
  tahunAkademikList: AcademicYearOption[];
  prodiList: StudyProgramOption[];
  setupData: FinanceSetupData;
  onAddMaster: () => void;
  onBulkTagihan: (id: string) => void;
  onEditMaster: (id: string) => void;
  onDeleteMaster: (id: string) => void;
}

type SetupKey = "periode" | "tarif" | "beasiswa" | "integrasi" | "metode" | "kategori" | "coa" | "rekening";

const setupMenuItems: Array<{ id: SetupKey; label: string; icon: typeof Calculator }> = [
  { id: "periode", label: "Periode Akademik", icon: CalendarDays },
  { id: "tarif", label: "Tarif Biaya Kuliah", icon: Calculator },
  { id: "beasiswa", label: "Beasiswa / Diskon", icon: BadgePercent },
  { id: "integrasi", label: "Integrasi VA Bank", icon: Network },
  { id: "metode", label: "Metode Pembayaran", icon: CreditCard },
  { id: "kategori", label: "Komponen Biaya", icon: ReceiptText },
  { id: "coa", label: "Chart of Accounts", icon: Banknote },
  { id: "rekening", label: "Rekening Kampus", icon: Landmark },
];

function DeleteSetupButton({ kind, id }: { kind: string; id: string }) {
  return (
    <form action={deleteFinanceSetupAction}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Button size="sm" variant="ghost" className="h-8 w-8 rounded-none text-rose-500 hover:bg-rose-50">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

function ActiveToggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
      <input type="checkbox" name="isActive" defaultChecked={defaultChecked} /> Aktif
    </label>
  );
}

export default function TabSetup({
  masterBiayaList,
  tahunAkademikList,
  prodiList,
  setupData,
  onAddMaster,
  onBulkTagihan,
  onEditMaster,
  onDeleteMaster,
}: TabSetupProps) {
  const searchParams = useSearchParams();
  const initialSetup = (searchParams.get("setup") as SetupKey | null) || "tarif";
  const [activeSetup, setActiveSetup] = useState<SetupKey>(setupMenuItems.some((item) => item.id === initialSetup) ? initialSetup : "tarif");
  const [editItem, setEditItem] = useState<SetupRecord | null>(null);

  const activeTitle = useMemo(() => setupMenuItems.find((item) => item.id === activeSetup)?.label ?? "Setup", [activeSetup]);

  const renderTable = (rows: SetupRecord[], columns: Array<[string, string | ((row: SetupRecord) => string)]>, kind?: string) => (
    <Table>
      <THead className="bg-slate-50/50">
        <TR>
          {columns.map(([label]) => <TH key={label} className="text-[10px]">{label}</TH>)}
          {kind ? <TH className="pr-6 text-right text-[10px]">Aksi</TH> : null}
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
            {columns.map(([label, accessor]) => (
              <TD key={label} className="text-xs font-bold text-slate-700">
                {typeof accessor === "function" ? accessor(row) : row[accessor] ?? "-"}
              </TD>
            ))}
            {kind ? (
              <TD className="pr-6">
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 rounded-none text-blue-500 hover:bg-blue-50" onClick={() => setEditItem(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteSetupButton kind={kind} id={row.id} />
                </div>
              </TD>
            ) : null}
          </TR>
        ))}
      </TBody>
    </Table>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-3">
        <Card className="overflow-hidden rounded-none border-slate-100 bg-white p-4 shadow-sm">
          <h4 className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Setup Finance</h4>
          <nav className="space-y-1">
            {setupMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSetup(item.id)}
                className={activeSetup === item.id
                  ? "flex w-full items-center justify-between rounded-none border-l-4 border-emerald-600 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
                  : "flex w-full items-center justify-between rounded-none border-l-4 border-transparent px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"}
              >
                <span className="flex items-center gap-3"><item.icon className="h-4 w-4" />{item.label}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </nav>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-9">
        <Card className="min-h-[600px] overflow-hidden rounded-none border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-6">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900">{activeTitle}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Konfigurasi finance aktif.</p>
            </div>
            {activeSetup === "tarif" ? (
              <Button onClick={onAddMaster} className="h-10 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Tambah Tarif Kuliah
              </Button>
            ) : null}
          </div>

          {activeSetup === "periode" ? (
            <div className="p-0">
              {renderTable(
                tahunAkademikList,
                [
                  ["Kode", "kode"],
                  ["Nama", "nama"],
                  ["Semester", "semester"],
                  ["Status", (row) => row.is_aktif ? "Aktif" : "Nonaktif"],
                ],
              )}
              <div className="border-t border-slate-100 p-6">
                <form action={setActiveAcademicYearAction} className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">Set Periode Aktif</label>
                    <select name="id" className="h-11 w-full rounded-none border-2 border-slate-100 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-emerald-500">
                      {tahunAkademikList.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                    </select>
                  </div>
                  <Button className="h-11 rounded-none bg-emerald-600 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-emerald-700">Aktifkan</Button>
                </form>
              </div>
            </div>
          ) : null}

          {activeSetup === "tarif" ? (
            <div className="overflow-x-auto">
              <Table>
                <THead className="bg-slate-50/50">
                  <TR><TH className="pl-6 text-[10px]">Tahun Akademik</TH><TH className="text-[10px]">Semester / Angkatan</TH><TH className="text-[10px]">Program Studi</TH><TH className="text-[10px]">Jenis Biaya</TH><TH className="text-[10px]">Nominal</TH><TH className="text-[10px]">Status</TH><TH className="pr-6 text-right text-[10px]">Aksi</TH></TR>
                </THead>
                <TBody>
                  {masterBiayaList.map((mb) => (
                    <TR key={mb.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TD className="pl-6 text-[10px] font-black text-slate-700">{mb.tahun_akademik?.nama || "Semua"}</TD>
                      <TD><p className="text-[10px] font-black uppercase text-slate-900">{(mb.tingkat_kelas || []).join(", ") || "Semua Smt"}</p><p className="text-[9px] font-bold text-emerald-600">Angk. {mb.angkatan || "Semua"}</p></TD>
                      <TD className="text-[9px] font-bold uppercase text-slate-600">{mb.program_studi?.nama || (mb.jurusan || []).join(", ") || "Seluruh Prodi"}</TD>
                      <TD className="text-[10px] font-black text-slate-900">{mb.nama}</TD>
                      <TD className="whitespace-nowrap font-mono text-[11px] font-black text-slate-900">{formatCurrency(Number(mb.nominal))}</TD>
                      <TD><Badge variant={mb.status ? "success" : "secondary"} className="h-5 rounded-none px-2 text-[8px] font-black uppercase">{mb.status ? "Aktif" : "Nonaktif"}</Badge></TD>
                      <TD className="pr-6"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" className="h-8 w-8 rounded-none text-blue-500 hover:bg-blue-50" onClick={() => onEditMaster(mb.id)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 rounded-none text-emerald-600 hover:bg-emerald-50" onClick={() => onBulkTagihan(mb.id)}><Plus className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 rounded-none text-rose-500 hover:bg-rose-50" onClick={() => onDeleteMaster(mb.id)}><Trash2 className="h-4 w-4" /></Button></div></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : null}

          {activeSetup === "coa" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-5">
                <input type="hidden" name="kind" value="coa" />
                <Input name="kode" placeholder="1101" required className="rounded-none" />
                <Input name="nama" placeholder="Kas Kampus" required className="rounded-none" />
                <select name="tipe" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option>Aset</option><option>Kewajiban</option><option>Ekuitas</option><option>Pendapatan</option><option>Beban</option></select>
                <select name="parentId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">Tanpa Parent</option>{setupData.coa.map((item) => <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>)}</select>
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
                <Input name="deskripsi" placeholder="Deskripsi" className="rounded-none md:col-span-4" />
                <ActiveToggle />
              </form>
              {renderTable(setupData.coa, [["Kode", "kode"], ["Nama", "nama"], ["Tipe", "tipe"], ["Status", (row) => row.is_active ? "Aktif" : "Nonaktif"]], "coa")}
            </div>
          ) : null}

          {activeSetup === "rekening" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-4">
                <input type="hidden" name="kind" value="bank-account" />
                <Input name="bankName" placeholder="Bank Syariah" required className="rounded-none" />
                <Input name="accountNumber" placeholder="Nomor rekening" required className="rounded-none" />
                <Input name="accountName" placeholder="Nama rekening" required className="rounded-none" />
                <Input name="branch" placeholder="Cabang" className="rounded-none" />
                <select name="coaId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">COA Kas</option>{setupData.coa.map((item) => <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>)}</select>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><input type="checkbox" name="isDefault" /> Default</label>
                <ActiveToggle />
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
              </form>
              {renderTable(setupData.bankAccounts, [["Bank", "bank_name"], ["Nomor", "account_number"], ["Nama", "account_name"], ["Default", (row) => row.is_default ? "Ya" : "Tidak"]], "bank-account")}
            </div>
          ) : null}

          {activeSetup === "integrasi" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-4">
                <input type="hidden" name="kind" value="bank-integration" />
                <Input name="provider" placeholder="midtrans / bjb" required className="rounded-none" />
                <Input name="bankCode" placeholder="BJB" required className="rounded-none" />
                <Input name="bankName" placeholder="Bank BJB" required className="rounded-none" />
                <select name="mode" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="sandbox">Sandbox</option><option value="production">Production</option></select>
                <Input name="merchantId" placeholder="Merchant ID publik" className="rounded-none" />
                <Input name="callbackPath" placeholder="/api/webhooks/..." className="rounded-none" />
                <Input name="secretSettingKeys" placeholder="payment.bjb.secret_key" className="rounded-none" />
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
                <Input name="catatan" placeholder="Catatan tanpa secret mentah" className="rounded-none md:col-span-3" />
                <ActiveToggle />
              </form>
              {renderTable(setupData.bankIntegrations, [["Provider", "provider"], ["Bank", "bank_name"], ["Mode", "mode"], ["Status", (row) => row.is_active ? "Aktif" : "Nonaktif"]], "bank-integration")}
            </div>
          ) : null}

          {activeSetup === "metode" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-4">
                <input type="hidden" name="kind" value="payment-method" />
                <Input name="kode" placeholder="TRANSFER" required className="rounded-none" />
                <Input name="nama" placeholder="Transfer Bank" required className="rounded-none" />
                <select name="tipe" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option>Manual Transfer</option><option>Payment Gateway</option><option>VA Bank</option></select>
                <select name="feeType" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="none">Tanpa Fee</option><option value="fixed">Fixed</option><option value="percent">Persen</option></select>
                <Input name="feeAmount" type="number" min={0} defaultValue={0} className="rounded-none" />
                <select name="bankAccountId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">Rekening</option>{setupData.bankAccounts.map((item) => <option key={item.id} value={item.id}>{item.bank_name} - {item.account_number}</option>)}</select>
                <select name="integrationId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">Integrasi</option>{setupData.bankIntegrations.map((item) => <option key={item.id} value={item.id}>{item.provider} - {item.bank_code}</option>)}</select>
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
                <Input name="instruksi" placeholder="Instruksi pembayaran" className="rounded-none md:col-span-3" />
                <ActiveToggle />
              </form>
              {renderTable(setupData.paymentMethods, [["Kode", "kode"], ["Nama", "nama"], ["Tipe", "tipe"], ["Status", (row) => row.is_active ? "Aktif" : "Nonaktif"]], "payment-method")}
            </div>
          ) : null}

          {activeSetup === "beasiswa" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-4">
                <input type="hidden" name="kind" value="scholarship" />
                <Input name="kode" placeholder="BEA-TAHFIDZ" required className="rounded-none" />
                <Input name="nama" placeholder="Beasiswa Tahfidz" required className="rounded-none" />
                <select name="tipe" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option>Beasiswa</option><option>Diskon</option></select>
                <select name="satuan" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option>Nominal</option><option>Persen</option></select>
                <Input name="nilai" type="number" min={0} required placeholder="500000" className="rounded-none" />
                <select name="tahunAkademikId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">Semua TA</option>{tahunAkademikList.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select>
                <select name="prodiId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">Semua Prodi</option>{prodiList.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select>
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
                <Input name="angkatan" type="number" placeholder="Angkatan" className="rounded-none" />
                <Input name="kuota" type="number" placeholder="Kuota" className="rounded-none" />
                <Input name="keterangan" placeholder="Keterangan" className="rounded-none" />
                <ActiveToggle />
              </form>
              {renderTable(setupData.scholarships, [["Kode", "kode"], ["Nama", "nama"], ["Tipe", "tipe"], ["Nilai", (row) => row.satuan === "Persen" ? `${row.nilai}%` : formatCurrency(Number(row.nilai))]], "scholarship")}
            </div>
          ) : null}

          {activeSetup === "kategori" ? (
            <div>
              <form action={saveFinanceSetupAction} className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-4">
                <input type="hidden" name="kind" value="category" />
                <Input name="nama" placeholder="SPP / UKT Mahasiswa" required className="rounded-none" />
                <select name="tipe" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option>Pemasukan</option><option>Pengeluaran</option></select>
                <select name="coaId" className="h-10 rounded-none border border-slate-200 px-3 text-sm font-bold"><option value="">COA</option>{setupData.coa.map((item) => <option key={item.id} value={item.id}>{item.kode} - {item.nama}</option>)}</select>
                <Button className="rounded-none bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white">Simpan</Button>
                <Input name="deskripsi" placeholder="Deskripsi" className="rounded-none md:col-span-3" />
                <ActiveToggle />
              </form>
              {renderTable(setupData.categories, [["Nama", "nama"], ["Tipe", "tipe"], ["COA", (row) => row.coa ? `${row.coa.kode} - ${row.coa.nama}` : "-"], ["Status", (row) => row.is_active ? "Aktif" : "Nonaktif"]], "category")}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
