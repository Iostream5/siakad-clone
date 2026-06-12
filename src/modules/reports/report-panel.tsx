import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportAkademik } from "@/modules/reports/report-akademik";
import { ReportPMB } from "@/modules/reports/report-pmb";
import { ReportKeuangan } from "@/modules/reports/report-keuangan";

export function ReportPanel({
  akademikData,
  pmbData,
  keuanganData,
  prodiList,
  tahunAkademikList
}: {
  akademikData: any[];
  pmbData: any[];
  keuanganData: any[];
  prodiList: any[];
  tahunAkademikList: any[];
}) {
  return (
    <Tabs defaultValue="akademik" className="space-y-6">
      <TabsList className="bg-white border border-slate-200 h-14 w-full justify-start overflow-x-auto">
        <TabsTrigger value="akademik" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Laporan Akademik</TabsTrigger>
        <TabsTrigger value="pmb" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Laporan PMB</TabsTrigger>
        <TabsTrigger value="keuangan" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Laporan Keuangan</TabsTrigger>
      </TabsList>

      <TabsContent value="akademik" className="mt-0 outline-none">
        <ReportAkademik data={akademikData} prodiList={prodiList} tahunAkademikList={tahunAkademikList} />
      </TabsContent>

      <TabsContent value="pmb" className="mt-0 outline-none">
        <ReportPMB data={pmbData} prodiList={prodiList} tahunAkademikList={tahunAkademikList} />
      </TabsContent>

      <TabsContent value="keuangan" className="mt-0 outline-none">
        <ReportKeuangan data={keuanganData} tahunAkademikList={tahunAkademikList} />
      </TabsContent>
    </Tabs>
  );
}
