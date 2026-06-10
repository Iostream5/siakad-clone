import { handleMidtransPmbNotification } from "@/lib/admin/pmb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await handleMidtransPmbNotification(payload);

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        received: false,
        error: error instanceof Error ? error.message : "Gagal memproses notifikasi Midtrans.",
      },
      { status: 400 },
    );
  }
}
