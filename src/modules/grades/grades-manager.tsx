"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NotebookPen, GraduationCap, Search, FileDown, BookOpen, Users, Save, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { getClassGradesAction, updateGradeAction } from "@/actions/grades";
import { useToast } from "@/components/ui/toast-provider";
import { getGradePoint } from "@/lib/admin/grades";
import { cn } from "@/lib/utils";

export function GradesManager({ 
  role, 
  initialData = [], 
  lecturerClasses = [], 
  activeYear,
  studentProfile
}: { 
  role: string, 
  initialData?: any[],
  lecturerClasses?: any[],
  activeYear?: any,
  studentProfile?: any
}) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const { success, error } = useToast();

  const handleDownloadKHS = async () => {
    if (!studentProfile || initialData.length === 0) {
      error("Data tidak tersedia", "Belum ada nilai yang dipublish untuk diunduh.");
      return;
    }

    // Dynamic import of PDF generator only when needed
    const { exportToPdf } = await import("@/lib/pdf-generator");

    const pdfData = {
      studentName: studentProfile.users?.full_name || "Mahasiswa",
      nim: studentProfile.nim || "-",
      prodi: studentProfile.program_studi?.nama || "-",
      academicYear: activeYear?.nama || "-",
      semester: activeYear?.semester || "-",
      grades: initialData.map(item => ({
        code: item.jadwal?.mata_kuliah?.kode || "",
        course: item.jadwal?.mata_kuliah?.nama || "",
        sks: item.jadwal?.mata_kuliah?.sks || 0,
        score: item.nilai_angka || "-",
        grade: item.nilai_huruf || "-",
        point: getGradePoint(item.nilai_huruf || "")
      })),
      gpa: studentProfile.ips || 0
    };

    exportToPdf({
      title: "Kartu Hasil Studi (KHS)",
      fileName: `KHS_${pdfData.nim}_${pdfData.academicYear}`,
      data: pdfData.grades,
      columns: [
        { header: "Kode", accessorKey: "code" },
        { header: "Mata Kuliah", accessorKey: "course" },
        { header: "SKS", accessorKey: "sks" },
        { header: "Nilai Angka", accessorKey: "score" },
        { header: "Nilai Huruf", accessorKey: "grade" },
        { header: "Bobot", accessorKey: "point" }
      ],
      filters: [
        { label: "Nama Mahasiswa", value: pdfData.studentName },
        { label: "NIM", value: pdfData.nim },
        { label: "Program Studi", value: pdfData.prodi },
        { label: "Tahun Akademik", value: `${pdfData.academicYear} - ${pdfData.semester}` },
        { label: "IP Semester", value: String(pdfData.gpa) }
      ]
    });
    success("KHS Berhasil Diunduh", "File PDF sedang diproses oleh browser Anda.");
  };

  const handleSelectClass = async (id: string) => {
    setSelectedClass(id);
    startTransition(async () => {
      const result = await getClassGradesAction(id);
      if (result.success) {
        setClassStudents(result.data);
      } else {
        error("Gagal mengambil data", result.error);
      }
    });
  };

  const handleUpdateGrade = async (mahasiswaId: string, score: number) => {
    if (!selectedClass) return;
    
    const formData = new FormData();
    formData.append("mahasiswaId", mahasiswaId);
    formData.append("jadwalId", selectedClass);
    formData.append("score", score.toString());
    formData.append("publish", "on"); // Auto publish for now

    startTransition(async () => {
      const result = await updateGradeAction(formData);
      if (result.success) {
        success("Berhasil", "Nilai berhasil disimpan");
        // Refresh local data
        const refresh = await getClassGradesAction(selectedClass);
        if (refresh.success) setClassStudents(refresh.data);
      } else {
        error("Gagal menyimpan", result.error);
      }
    });
  };

  if (role === "Dosen") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Input Nilai Mahasiswa</h2>
            <p className="text-sm text-slate-500">Pilih mata kuliah untuk menginput nilai.</p>
          </div>
          <Badge variant="outline" className="bg-white border-slate-200 py-1.5 px-4 rounded-xl shadow-sm text-slate-600">
            {activeYear?.nama} - {activeYear?.semester}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="p-4 space-y-4 border-slate-200 shadow-sm bg-white/50 backdrop-blur">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Kelas Anda
            </h3>
            <div className="space-y-2">
              {lecturerClasses.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4">Tidak ada jadwal mengajar semester ini.</p>
              ) : lecturerClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all duration-200",
                    selectedClass === cls.id 
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 translate-x-1" 
                      : "bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/30"
                  )}
                >
                  <div className="font-bold leading-tight">{cls.mata_kuliah?.nama}</div>
                  <div className={cn("mt-1 text-xs font-medium", selectedClass === cls.id ? "text-indigo-100" : "text-slate-400")}>
                    {cls.mata_kuliah?.kode} • Kelas {cls.nama_kelas}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", selectedClass === cls.id ? "text-indigo-200" : "text-slate-500")}>
                      {cls.hari}, {cls.jam_mulai.slice(0,5)}
                    </span>
                    <span className={cn("flex items-center gap-1 text-[10px] font-bold", selectedClass === cls.id ? "text-white" : "text-indigo-600")}>
                      <Users className="h-3 w-3" /> {cls.peserta} Mhs
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-200 shadow-sm min-h-[400px]">
            {!selectedClass ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <NotebookPen className="h-16 w-16 opacity-10 mb-4" />
                <p className="text-lg font-medium text-slate-500">Silakan Pilih Kelas</p>
                <p className="text-sm max-w-xs mt-1">Daftar mahasiswa akan muncul di sini setelah Anda memilih mata kuliah.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Daftar Mahasiswa</h4>
                      <p className="text-xs text-slate-500">Input nilai angka (0-100)</p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <Table>
                    <THead>
                      <TR className="bg-slate-50/30">
                        <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500">Mahasiswa</TH>
                        <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500">Nilai Angka</TH>
                        <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500">Huruf</TH>
                        <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</TH>
                        <TH className="px-6 py-4 w-32 text-right">Aksi</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {classStudents.map((mhs) => (
                        <TR key={mhs.mahasiswa_id} className="hover:bg-slate-50/50 transition-colors">
                          <TD className="px-6 py-4">
                            <div className="font-bold text-slate-900">{mhs.full_name}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{mhs.nim}</div>
                          </TD>
                          <TD className="px-6 py-4">
                            <Input 
                              type="number" 
                              defaultValue={mhs.nilai_angka || ""} 
                              className="w-20 h-9 font-bold text-center bg-white border-slate-200 focus:ring-indigo-500"
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val !== mhs.nilai_angka) {
                                  handleUpdateGrade(mhs.mahasiswa_id, val);
                                }
                              }}
                            />
                          </TD>
                          <TD className="px-6 py-4">
                            <Badge variant={mhs.nilai_huruf === 'E' ? 'destructive' : 'secondary'} className="font-bold px-3 py-1">
                              {mhs.nilai_huruf || "-"}
                            </Badge>
                          </TD>
                          <TD className="px-6 py-4">
                            {mhs.published_at ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Published
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Draft</Badge>
                            )}
                          </TD>
                          <TD className="px-6 py-4 text-right">
                             <Button variant="ghost" size="sm" className="h-11 w-11 sm:h-8 sm:w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">
                                <Save className="h-4 w-4" />
                             </Button>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Mahasiswa View
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hasil Studi</h2>
          <p className="text-sm text-slate-500">Transkrip nilai Anda untuk semester ini.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             className="h-10 rounded-xl border-slate-200 shadow-sm bg-white hover:bg-slate-50"
             onClick={handleDownloadKHS}
           >
              <FileDown className="mr-2 h-4 w-4" /> Download KHS
           </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="p-0 overflow-hidden border-slate-200 shadow-sm bg-white/80 backdrop-blur">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari mata kuliah..." className="pl-10 h-10 bg-white border-slate-200 rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1.5 px-4 rounded-xl font-bold">
                 {activeYear?.nama} - {activeYear?.semester}
               </Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR className="bg-slate-50/30">
                  <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Mata Kuliah</TH>
                  <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">SKS</TH>
                  <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider text-center">Angka</TH>
                  <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider text-center">Huruf</TH>
                  <TH className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wider">Status</TH>
                </TR>
              </THead>
              <TBody>
                {initialData.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                          <NotebookPen className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="italic font-medium">Belum ada data nilai yang dipublish.</p>
                      </div>
                    </TD>
                  </TR>
                ) : initialData.map((item, idx) => (
                  <TR key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <TD className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.jadwal?.mata_kuliah?.nama}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{item.jadwal?.mata_kuliah?.kode}</p>
                    </TD>
                    <TD className="px-6 py-4 text-sm text-slate-600 font-bold">{item.jadwal?.mata_kuliah?.sks} SKS</TD>
                    <TD className="px-6 py-4 text-sm font-bold text-slate-900 text-center">{item.nilai_angka || "-"}</TD>
                    <TD className="px-6 py-4 text-center">
                      <Badge 
                        variant={item.nilai_huruf === 'E' ? 'destructive' : 'secondary'} 
                        className={cn(
                          "font-bold px-4 py-1 text-sm rounded-lg",
                          item.nilai_huruf === 'A' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""
                        )}
                      >
                        {item.nilai_huruf || "-"}
                      </Badge>
                    </TD>
                    <TD className="px-6 py-4">
                      {item.published_at ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Published
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Draft</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
