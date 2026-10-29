import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RECOVERY_ID } from "@/lib/admin-session";
import { createSession, hashPassword, sessionCookie, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, recordAttempt } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

// Kullanıcı bulunamadığında da aynı sürede cevap vermek için sahte bir hash ile karşılaştırılır.
let dummyHash: string | undefined;

/**
 * Kullanıcı adı verilirse admin_users hesabıyla, verilmezse ADMIN_PASSWORD
 * kurtarma şifresiyle giriş yapılır. Kurtarma girişi ilk hesabı açmak ve
 * şifresini unutan sahibi içeri almak içindir.
 */
export async function POST(request: Request) {
  const { username, password } = await request.json();
  const name = typeof username === "string" ? username.trim().toLowerCase() : "";
  const db = getSupabaseAdmin();
  const ip = getClientIp(request);
  const accountKey = name ? `user:${name}` : "admin";
  const { blocked } = await checkRateLimit(db, "admin", ip, accountKey);
  if (blocked) return NextResponse.json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." }, { status: 429 });

  if (!name) {
    if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Admin şifresi yapılandırılmamış." }, { status: 503 });
    const success = typeof password === "string" && password === process.env.ADMIN_PASSWORD;
    await recordAttempt(db, "admin", ip, accountKey, success);
    if (!success) return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
    (await cookies()).set("ka_admin", createSession({ role: "admin", sub: RECOVERY_ID }), sessionCookie);
    return NextResponse.json({ ok: true });
  }

  const { data: user, error } = await db.from("admin_users").select("id,password_hash,active").eq("username", name).maybeSingle();
  if (error) return NextResponse.json({ error: "Kişisel hesaplar henüz kurulmamış. Kullanıcı adını boş bırakıp kurtarma şifresiyle girin." }, { status: 503 });
  dummyHash ??= hashPassword("dummy-password");
  const matches = typeof password === "string" && verifyPassword(password, user?.password_hash ?? dummyHash);
  const success = Boolean(user?.active) && matches;
  await recordAttempt(db, "admin", ip, accountKey, success);
  if (!success) return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  await db.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", user!.id);
  (await cookies()).set("ka_admin", createSession({ role: "admin", sub: user!.id }), sessionCookie);
  return NextResponse.json({ ok: true });
}
