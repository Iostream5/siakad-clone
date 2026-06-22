import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type FinancePanelRow = {
  invoice: string;
  student: string;
  amount: number;
  status: string;
};

type FinancePanelProps = {
  rows: FinancePanelRow[];
};

export function FinancePanel({ rows }: FinancePanelProps) {
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
            {rows.map((row) => (
              <TR key={row.invoice}>
                <TD className="font-medium text-slate-900">{row.invoice}</TD>
                <TD>{row.student}</TD>
                <TD>{formatCurrency(row.amount)}</TD>
                <TD>{row.status}</TD>
              </TR>
            ))}
            {rows.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-sm font-semibold text-slate-400">
                  Belum ada data keuangan.
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
