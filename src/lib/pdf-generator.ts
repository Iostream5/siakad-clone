import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface KHSData {
  studentName: string;
  nim: string;
  prodi: string;
  academicYear: string;
  semester: string;
  grades: Array<{
    code: string;
    course: string;
    sks: number;
    score: number | string;
    grade: string;
    point: number;
  }>;
  gpa: number;
}

export function generateKHSPDF(data: KHSData) {
  const doc = new jsPDF();

  // 1. Header (Kop Surat)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("STAI AL-ITTIHAD CIANJUR", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Raya Bandung No.03, Bojong, Karangtengah, Kabupaten Cianjur, Jawa Barat 43281", 105, 26, { align: "center" });
  doc.line(20, 32, 190, 32); // Horizontal Line

  // 2. Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("KARTU HASIL STUDI (KHS)", 105, 42, { align: "center" });

  // 3. Student Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  // Left Column
  doc.text("Nama Mahasiswa", 20, 52);
  doc.text(`: ${data.studentName}`, 55, 52);
  doc.text("NIM", 20, 57);
  doc.text(`: ${data.nim}`, 55, 57);
  doc.text("Program Studi", 20, 62);
  doc.text(`: ${data.prodi}`, 55, 62);

  // Right Column
  doc.text("Tahun Akademik", 130, 52);
  doc.text(`: ${data.academicYear}`, 160, 52);
  doc.text("Semester", 130, 57);
  doc.text(`: ${data.semester}`, 160, 57);

  // 4. Grades Table
  const tableData = data.grades.map((g, index) => [
    index + 1,
    g.code,
    g.course,
    g.sks,
    g.grade,
    g.point,
    g.point * g.sks
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['No', 'Kode', 'Mata Kuliah', 'SKS', 'Nilai', 'Bobot', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], halign: 'center' }, // Indigo color
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    styles: { fontSize: 8 }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // 5. Summary Info
  const totalSks = data.grades.reduce((acc, g) => acc + g.sks, 0);
  const totalPoints = data.grades.reduce((acc, g) => acc + (g.point * g.sks), 0);

  doc.setFont("helvetica", "bold");
  doc.text(`Total SKS: ${totalSks}`, 20, finalY + 10);
  doc.text(`Indeks Prestasi Semester (IPS): ${data.gpa.toFixed(2)}`, 20, finalY + 15);

  // 6. Signature Area
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont("helvetica", "normal");
  doc.text(`Cianjur, ${date}`, 140, finalY + 25);
  doc.text("Ketua Program Studi,", 140, 30 + finalY + 5);
  
  doc.text("( ___________________________ )", 140, finalY + 60);

  // Save the PDF
  doc.save(`KHS_${data.nim}_${data.academicYear.replace('/', '-')}.pdf`);
}
