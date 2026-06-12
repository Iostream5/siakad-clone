import "client-only";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumnDef<T> = {
  header: string;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => string | number;
};

export type PdfExportOptions<T> = {
  title: string;
  data: T[];
  columns: ExportColumnDef<T>[];
  fileName: string;
  filters?: { label: string; value: string }[];
};

export function exportToPdf<T>({ title, data, columns, fileName, filters }: PdfExportOptions<T>) {
  const doc = new jsPDF("p", "mm", "a4");

  // Add Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);

  let startY = 30;

  // Add Filters if available
  if (filters && filters.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    filters.forEach((filter, index) => {
      doc.text(`${filter.label}: ${filter.value}`, 14, startY + index * 5);
    });
    startY += filters.length * 5 + 5;
  }

  // Generate Table
  const head = [columns.map((col) => col.header)];
  const body = data.map((row) =>
    columns.map((col) => {
      if (col.accessorFn) {
        return col.accessorFn(row);
      }
      if (col.accessorKey) {
        const val = (row as any)[col.accessorKey];
        return val !== null && val !== undefined ? String(val) : "-";
      }
      return "-";
    })
  );

  autoTable(doc, {
    startY,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: [63, 81, 181] }, // Indigo color
    styles: { fontSize: 9 },
  });

  // Save the PDF
  doc.save(`${fileName}.pdf`);
}
