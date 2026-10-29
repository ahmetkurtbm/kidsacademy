import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MINUTES = 15;
const MAX_IP_FAILURES = 10;
const MAX_ACCOUNT_FAILURES = 5;
/** KVKK aydınlatma metninde söz verilen saklama süresi. */
const RETENTION_DAYS = 90;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0].trim() || "unknown";
}

export async function checkRateLimit(db: SupabaseClient, scope: "admin" | "parent", ip: string, accountKey: string): Promise<{ blocked: boolean }> {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const [{ count: ipFailures }, { count: accountFailures }] = await Promise.all([
    db.from("login_attempts").select("id", { count: "exact", head: true }).eq("scope", scope).eq("ip", ip).eq("success", false).gte("created_at", cutoff),
    db.from("login_attempts").select("id", { count: "exact", head: true }).eq("scope", scope).eq("account_key", accountKey).eq("success", false).gte("created_at", cutoff),
  ]);
  return { blocked: (ipFailures ?? 0) >= MAX_IP_FAILURES || (accountFailures ?? 0) >= MAX_ACCOUNT_FAILURES };
}

export async function recordAttempt(db: SupabaseClient, scope: "admin" | "parent", ip: string, accountKey: string, success: boolean): Promise<void> {
  await db.from("login_attempts").insert({ scope, ip, account_key: accountKey, success });
  // Süresi dolan kayıtlar ayrı bir zamanlanmış iş gerektirmeden girişlerde temizlenir.
  const expired = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.from("login_attempts").delete().lt("created_at", expired);
}
