---
description: SOP implementasi dan penanganan payment gateway untuk SIAKAD. Mencakup alur checkout Midtrans, webhook handling, idempotency, mapping status, cara debug transaksi bermasalah, dan checklist keamanan payment.
---

# SOP Payment Gateway — SIAKAD STAI Al-Ittihad

## Tujuan

Payment gateway adalah titik paling kritis di sistem — uang beneran diproses di sini. Satu bug bisa menyebabkan pembayaran tidak tercatat, transaksi dobel, atau webhook palsu diterima. SOP ini memastikan implementasi payment gateway dilakukan dengan benar, aman, dan dapat di-debug saat ada masalah.

---

## FASE 1: ARSITEKTUR PAYMENT GATEWAY

### Langkah-langkah

STEP 1: Pahami dua konteks payment di SIAKAD.

**PMB Payment** — untuk biaya pendaftaran calon mahasiswa:
```
Tabel: pmb_pembayaran
Action: requestPmbPaymentGatewayAction
Webhook: /api/payment-gateway/midtrans/pmb
Status update: pmb_pendaftaran.status_pembayaran
```

**Finance Payment** — untuk tagihan mahasiswa aktif (SPP, praktikum, dll):
```
Tabel: pembayaran
Action: requestFinancePaymentGatewayAction
Webhook: /api/payment-gateway/midtrans/finance
Status update: tagihan.status
```

STEP 2: Pahami alur pembayaran end-to-end.

```
1. User klik "Bayar" di UI
2. Server Action membuat order_id unik
3. Server Action request Snap token ke Midtrans API
4. Client redirect ke Midtrans Snap popup/page
5. User selesaikan pembayaran di Midtrans
6. Midtrans kirim webhook ke /api/payment-gateway/midtrans/[konteks]
7. Webhook handler validasi signature
8. Webhook handler update status pembayaran
9. Webhook handler update status PMB atau tagihan
10. Webhook handler catat arus kas (hanya sekali)
11. Webhook handler return HTTP 200 ke Midtrans
```

STEP 3: Tentukan environment yang dipakai.

```typescript
// Jangan pernah campur sandbox dan production
const isMidtransProduction =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

const midtransBaseUrl = isMidtransProduction
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const serverKey = isMidtransProduction
  ? process.env.MIDTRANS_SERVER_KEY_PRODUCTION!
  : process.env.MIDTRANS_SERVER_KEY_SANDBOX!;
```

### Checklist

- [ ] Dua konteks payment (PMB dan Finance) dipahami dan terpisah
- [ ] Alur end-to-end dipahami sebelum implementasi
- [ ] Environment sandbox vs production dipisahkan dengan env var

---

## FASE 2: IMPLEMENTASI CHECKOUT

### Langkah-langkah

STEP 1: Generate order_id yang unik dan traceable.

```typescript
// ✅ BENAR — order_id yang unik dan traceable
function generateOrderId(konteks: "pmb" | "finance", referenceId: string): string {
  const timestamp = Date.now();
  return `${konteks.toUpperCase()}-${referenceId.slice(0, 8)}-${timestamp}`;
  // Contoh: PMB-abc12345-1717123456789
  // Contoh: FINANCE-def67890-1717123456790
}

// ❌ SALAH — order_id yang bisa dobel atau tidak traceable
const orderId = Math.random().toString(); // bisa dobel
const orderId = "order-123"; // tidak traceable, pasti dobel
```

STEP 2: Template request Snap token.

```typescript
export async function requestMidtransSnap(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
  callbackUrl: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const baseUrl = process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
      },
      item_details: params.itemDetails,
      callbacks: { finish: params.callbackUrl },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Midtrans request failed: ${error}`);
  }

  const data = await response.json();
  return data.token as string; // Snap token
}
```

STEP 3: Simpan provider_reference setelah checkout dibuat.

```typescript
// Setelah dapat Snap token, simpan ke database
await supabase.from("pembayaran").update({
  provider: "midtrans",
  provider_reference: orderId,  // simpan order_id
  checkout_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`,
  status: "Menunggu",
}).eq("id", pembayaranId);
```

### Checklist

- [ ] Order ID unik, traceable, dan mengandung konteks (PMB/FINANCE)
- [ ] Server key diambil dari env, bukan hardcode
- [ ] Environment sandbox/production dikontrol via env var
- [ ] Provider reference (order_id) disimpan ke database setelah checkout dibuat
- [ ] Checkout URL disimpan agar bisa ditampilkan ulang jika user belum bayar

---

## FASE 3: IMPLEMENTASI WEBHOOK HANDLER

### Langkah-langkah

STEP 1: Template webhook handler yang aman.

```typescript
// src/app/api/payment-gateway/midtrans/[konteks]/route.ts
import crypto from "crypto";

export async function POST(request: Request) {
  // 1. Baca body sebagai text untuk validasi signature
  const rawBody = await request.text();
  let payload: Record<string, string>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Validasi signature WAJIB sebelum proses apapun
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(
      payload.order_id +
      payload.status_code +
      payload.gross_amount +
      serverKey
    )
    .digest("hex");

  if (payload.signature_key !== expectedSignature) {
    console.warn("[Webhook] Invalid signature for order:", payload.order_id);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Proses berdasarkan transaction_status
  try {
    await processPaymentWebhook(payload);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

STEP 2: Template processPaymentWebhook yang idempoten.

```typescript
async function processPaymentWebhook(payload: Record<string, string>) {
  const { order_id, transaction_status, fraud_status } = payload;

  // Cari pembayaran berdasarkan order_id
  const pembayaran = await getPembayaranByProviderReference(order_id);
  if (!pembayaran) return; // Tidak ditemukan, return tanpa error

  // IDEMPOTENCY — jika sudah selesai, skip
  if (pembayaran.status === "Terverifikasi") return;

  // Mapping status
  const internalStatus = mapMidtransStatus(transaction_status, fraud_status);
  if (!internalStatus) return;

  // Update status pembayaran
  await updatePembayaranStatus(pembayaran.id, internalStatus);

  // Jika settlement, update tagihan dan catat arus kas
  if (internalStatus === "Terverifikasi") {
    await updateTagihanLunas(pembayaran.tagihan_id);
    await createArusKasMasuk({
      pembayaranId: pembayaran.id,
      nominal: pembayaran.nominal,
      keterangan: `Pembayaran via Midtrans - ${order_id}`,
    });
    // createArusKasMasuk harus idempoten — cek pembayaranId dulu
  }
}
```

STEP 3: Mapping status Midtrans yang benar.

```typescript
function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): string | null {
  switch (transactionStatus) {
    case "settlement":
      return "Terverifikasi";
    case "capture":
      return fraudStatus === "accept" ? "Terverifikasi" : "Menunggu";
    case "pending":
      return "Menunggu";
    case "expire":
      return "Kadaluarsa";
    case "cancel":
    case "deny":
    case "failure":
      return "Gagal";
    default:
      return null; // Status lain diabaikan
  }
}
```

### Checklist

- [ ] Body dibaca sebagai text sebelum di-parse JSON
- [ ] Signature divalidasi dengan SHA-512 sebelum proses apapun
- [ ] Idempotency check ada sebelum update database
- [ ] Mapping status Midtrans lengkap dan benar
- [ ] Arus kas hanya dibuat sekali per transaksi (idempoten)
- [ ] Error logging ada tapi tidak bocor ke response

---

## FASE 4: DEBUGGING TRANSAKSI BERMASALAH

### Langkah-langkah

STEP 1: Langkah debug jika pembayaran tidak ter-update.

```
1. Cek tabel pembayaran — apakah provider_reference (order_id) tersimpan?
   SELECT * FROM pembayaran WHERE provider_reference = 'ORDER-ID-DISINI';

2. Cek apakah webhook pernah masuk — lihat log Vercel atau Supabase
   (jika ada tabel api_logs, cari path webhook)

3. Cek Midtrans dashboard — apakah transaksi statusnya settlement di sana?

4. Jika webhook tidak masuk: cek URL callback di Midtrans dashboard sudah benar?
   Format: https://domain.com/api/payment-gateway/midtrans/finance

5. Simulasi webhook manual via Midtrans Sandbox dashboard
   → Trigger "Settlement" untuk order_id tersebut
```

STEP 2: Langkah debug jika arus kas dobel.

```sql
-- Cek duplikasi arus kas
SELECT pembayaran_id, COUNT(*) as jumlah
FROM arus_kas WHERE tipe = 'Masuk'
GROUP BY pembayaran_id HAVING COUNT(*) > 1;

-- Hapus yang dobel (simpan yang pertama)
DELETE FROM arus_kas WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY pembayaran_id ORDER BY created_at ASC) as rn
    FROM arus_kas WHERE pembayaran_id = 'ID-YANG-DOBEL'
  ) x WHERE rn > 1
);
```

STEP 3: Langkah debug webhook signature invalid.

```typescript
// Debug signature secara manual
const crypto = require("crypto");

const orderId = "ORDER-ID";
const statusCode = "200";
const grossAmount = "250000.00"; // format Midtrans: string dengan 2 desimal
const serverKey = "SERVER-KEY-ANDA";

const expectedSig = crypto
  .createHash("sha512")
  .update(orderId + statusCode + grossAmount + serverKey)
  .digest("hex");

console.log("Expected:", expectedSig);
console.log("Received:", webhookPayload.signature_key);
// Jika tidak cocok: periksa grossAmount format dan server key yang dipakai
```

### Checklist

- [ ] Cara debug transaksi tidak ter-update sudah dipahami
- [ ] Query deteksi arus kas dobel tersedia untuk digunakan jika diperlukan
- [ ] Cara debug signature mismatch dipahami
- [ ] Webhook URL di Midtrans dashboard sudah diverifikasi benar

---

## FASE 5: CHECKLIST KEAMANAN PAYMENT

### Langkah-langkah

STEP 1: Verifikasi keamanan sebelum aktifkan payment gateway.

```
□ Server key tidak ada di client bundle (tidak pakai NEXT_PUBLIC_)
□ Server key disimpan di env var, tidak hardcode
□ Webhook memvalidasi signature SHA-512 sebelum proses
□ Order ID unik — tidak bisa dobel dalam satu hari
□ Idempotency check ada — settlement dua kali tidak dobel
□ Arus kas hanya dibuat untuk status settlement/verified
□ Webhook error tidak membocorkan detail ke Midtrans response
□ Sandbox mode aktif di development, production mode di production
□ Webhook URL di Midtrans dashboard sudah benar per environment
```

STEP 2: Test wajib sebelum aktifkan di production.

```
□ Test checkout — URL Snap berhasil dibuat
□ Test pembayaran sukses (sandbox settlement)
□ Test webhook signature invalid — ditolak 401
□ Test webhook berulang — tidak membuat arus kas dobel
□ Test pembayaran gagal/expired — status ter-update dengan benar
□ Test order_id tidak ditemukan — webhook return 200 tanpa error
```

### Checklist Akhir

```
□ Dua konteks payment (PMB dan Finance) terpisah sempurna
□ Checkout membuat order_id yang unik dan traceable
□ Provider reference tersimpan ke database
□ Webhook memvalidasi signature
□ Webhook idempoten — tidak proses ulang yang sudah settlement
□ Mapping status Midtrans lengkap
□ Arus kas hanya dibuat sekali per transaksi
□ Cara debug transaksi bermasalah sudah diketahui
□ Semua checklist keamanan payment dipenuhi
```

---

## Output yang Diharapkan

1. **Checkout berjalan** — Snap token berhasil dibuat dan disimpan.
2. **Webhook aman** — signature divalidasi, tidak bisa dipalsukan.
3. **Idempotent** — pembayaran tidak dobel meskipun webhook berulang.
4. **Traceable** — transaksi bisa ditelusuri dari order_id ke pembayaran ke arus kas.
5. **Debug-ready** — langkah debug terstruktur tersedia untuk troubleshooting.
