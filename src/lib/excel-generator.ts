import "client-only";

import * as XLSX from "xlsx";

export type ExportColumnDef<T> = {
  header: string;
  accessorKey?: keyof T | string;
  accessorFn?: (row: T) => string | number;
};

export type ExcelExportOptions<T> = {
  title: string;
  data: T[];
  columns: ExportColumnDef<T>[];
  fileName: string;
};

export function exportToExcel<T>({ title, data, columns, fileName }: ExcelExportOptions<T>) {
  // Map data to match column headers
  const exportData = data.map((row) => {
    const rowData: Record<string, string | number> = {};
    columns.forEach((col) => {
      if (col.accessorFn) {
        rowData[col.header] = col.accessorFn(row);
      } else if (col.accessorKey) {
        const val = (row as any)[col.accessorKey];
        rowData[col.header] = val !== null && val !== undefined ? val : "-";
      } else {
        rowData[col.header] = "-";
      }
    });
    return rowData;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Add sheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31)); // Sheet name max 31 chars

  // Save the file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
