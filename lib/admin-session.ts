import { cookies } from "next/headers";
import { readSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export type AdminLevel = "owner" | "staff";
export type AdminSession = { id: string; name: string; level: AdminLevel; recovery: boolean };

/** Kurtarma şifresiyle (ADMIN_PASSWORD) açılan oturumun kimliği. */
export const RECOVERY_ID = "recovery";

/**
 * Yönetici oturumunu çerezden okur. Kişisel hesapla açılan oturumlarda hesabın
 * hâlâ aktif olduğu veritabanından doğrulanır; böylece pasifleştirilen hesap
 * çerezin süresini beklemeden dışarıda kalır. Eski çerezlerde kimlik yoksa
 * oturum kurtarma girişi sayılır (önceden tek giriş yolu oydu).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = readSession((await cookies()).get("ka_admin")?.value);
  if (session?.role !== "admin") return null;
  const id = session.sub || RECOVERY_ID;
  if (id === RECOVERY_ID) return { id, name: "Kurtarma girişi", level: "owner", recovery: true };

  const { data, error } = await getSupabaseAdmin().from("admin_users").select("display_name,role,active").eq("id", id).maybeSingle();
  if (error || !data?.active) return null;
  return { id, name: data.display_name, level: data.role === "owner" ? "owner" : "staff", recovery: false };
}
