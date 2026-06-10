import { requireAuthorizedUser } from "@/lib/auth";
import { getSystemSettings } from "@/lib/admin/phase1-admin";
import { PaymentGatewayManager } from "@/modules/payment-gateway/payment-gateway-manager";

export default async function PaymentGatewayConfigPage() {
  const user = await requireAuthorizedUser("pengaturan.settings", ["Admin"]);
  const settingsData = await getSystemSettings();
  
  // Filter only payment settings
  const paymentSettings = settingsData.rows.filter(row => row.category === 'payment');

  return (
    <div className="space-y-6">
      <PaymentGatewayManager initialSettings={paymentSettings} />
    </div>
  );
}
