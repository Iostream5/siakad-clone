export async function GET() {
  const body = "kode,nama,jumlah_lantai,keterangan,is_active\n" + "G-01,Gedung A,3,Gedung Utama,1\n" + "G-02,Gedung B,2,Gedung Perkuliahan,1\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-gedung.csv"',
    },
  });
}
