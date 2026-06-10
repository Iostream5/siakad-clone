import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { offeredCourses, studentBilling } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export function KrsPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">KRS Wizard</p>
            <h3 className="text-xl font-semibold text-slate-900">Validasi jadwal, kapasitas, dan prasyarat</h3>
          </div>
          <Badge>IPS 3.72 • Batas 24 SKS</Badge>
        </div>

        <div className="mt-6 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Mata Kuliah</TH>
                <TH>Kelas</TH>
                <TH>Jadwal</TH>
                <TH>Kapasitas</TH>
              </TR>
            </THead>
            <TBody>
              {offeredCourses.map((course) => (
                <TR key={course.code}>
                  <TD>
                    <p className="font-medium text-slate-900">{course.code}</p>
                    <p className="text-slate-500">{course.name}</p>
                  </TD>
                  <TD>
                    {course.className} • {course.sks} SKS
                  </TD>
                  <TD>
                    <p>{course.schedule}</p>
                    <p className="text-slate-500">{course.room}</p>
                  </TD>
                  <TD>
                    {course.seatsLeft} kursi
                    {course.prerequisite ? (
                      <p className="text-xs text-slate-500">Prasyarat {course.prerequisite}</p>
                    ) : null}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-slate-500">Blocking Rules</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">Syarat pengisian KRS</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Status mahasiswa aktif: valid</div>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            Tunggakan terdeteksi:
            <div className="mt-2 space-y-2 text-slate-700">
              {studentBilling.map((bill) => (
                <div key={bill.id} className="rounded-xl bg-white p-3">
                  <p className="font-medium">{bill.name}</p>
                  <p>{formatCurrency(bill.amount)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            Approval dosen wali dan periode aktif dikontrol pada server action dan SQL policy.
          </div>
        </div>
      </Card>
    </div>
  );
}
