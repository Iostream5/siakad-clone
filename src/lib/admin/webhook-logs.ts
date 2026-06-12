import "server-only";

import { createAdminClient } from "@/supabase/admin";

export type WebhookEventRow = {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: any;
  created_at: string;
};

export async function getWebhookLogs(limit = 100, provider?: string) {
  const supabase = createAdminClient();
  if (!supabase) return { rows: [], error: "Client error" };

  let query = supabase.from("webhook_events").select("*").order("created_at", { ascending: false }).limit(limit);

  if (provider && provider !== "all") {
    query = query.eq("provider", provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching webhook logs:", error);
    return { rows: [], error: error.message };
  }

  return { rows: (data || []) as WebhookEventRow[], error: null };
}
