import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const financeRows = [
  {
    invoice: "INV-2026-0417-01",
    student: "Nadia Putri",
    amount: 2250000,
    status: "Menunggu verifikasi",
  },
  {
    invoice: "INV-2026-0417-02",
    student: "Rizky Ramadhan",
    amount: 1750000,
    status: "Lunas",
  },
  {
    invoice: "INV-2026-0417-03",
    student: "Aisyah Mufidah",
    amount: 350000,
    status: "Dispensasi",
  },
];

export function FinancePanel() {
  return (
    <Card>
      <p className="text-sm text-slate-500">Keuangan</p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Tagihan, pembayaran, dan piutang</h3>

      <div className="mt-6 overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Invoice</TH>
              <TH>Mahasiswa</TH>
              <TH>Nominal</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {financeRows.map((row) => (
              <TR key={row.invoice}>
                <TD className="font-medium text-slate-900">{row.invoice}</TD>
                <TD>{row.student}</TD>
                <TD>{formatCurrency(row.amount)}</TD>
                <TD>{row.status}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
