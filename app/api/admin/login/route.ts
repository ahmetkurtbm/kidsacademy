import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp, recordAttempt } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const { password } = await request.json();
  const db = getSupabaseAdmin();
  const ip = getClientIp(request);
  const accountKey = "admin";
  const { blocked } = await checkRateLimit(db, "admin", ip, accountKey);
  if (blocked) return NextResponse.json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." }, { status: 429 });
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Admin şifresi yapılandırılmamış." }, { status: 503 });
  const success = typeof password === "string" && password === process.env.ADMIN_PASSWORD;
  await recordAttempt(db, "admin", ip, accountKey, success);
  if (!success) return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  (await cookies()).set("ka_admin", createSession({ role: "admin" }), sessionCookie);
  return NextResponse.json({ ok: true });
}
