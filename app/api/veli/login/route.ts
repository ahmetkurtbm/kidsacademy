import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, sessionCookie, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, recordAttempt } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { slug, password } = await request.json();
    const db = getSupabaseAdmin();
    const ip = getClientIp(request);
    const accountKey = String(slug || "").toLowerCase();
    const { blocked } = await checkRateLimit(db, "parent", ip, accountKey);
    if (blocked) return NextResponse.json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." }, { status: 429 });
    const { data } = await db.from("parent_accounts").select("id,slug,password_hash,active").eq("slug", accountKey).maybeSingle();
    const success = Boolean(data?.active) && typeof password === "string" && verifyPassword(password, data!.password_hash);
    await recordAttempt(db, "parent", ip, accountKey, success);
    if (!success) return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
    (await cookies()).set("ka_parent", createSession({ role: "parent", parentId: data!.id, slug: data!.slug }), sessionCookie);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Giriş şu anda yapılamıyor." }, { status: 500 }); }
}
