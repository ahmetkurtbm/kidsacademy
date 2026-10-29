import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const USERNAME = /^[a-z0-9._-]{3,32}$/;
const MIN_PASSWORD = 8;
const COLUMNS = "id,username,display_name,role,active,created_at,last_login_at";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * Hesap kaldırılır, pasifleşir ya da personele düşürülürse geriye aktif bir
 * sahip kalıyor mu? Hedef zaten aktif sahip değilse sorun yoktur.
 */
async function leavesAnOwner(db: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data: target } = await db.from("admin_users").select("role,active").eq("id", id).maybeSingle();
  if (!target || target.role !== "owner" || !target.active) return true;
  const { count } = await db.from("admin_users").select("id", { count: "exact", head: true }).eq("role", "owner").eq("active", true).neq("id", id);
  return (count ?? 0) > 0;
}

export async function GET() {
  const me = await getAdminSession();
  if (!me) return fail("Yetkisiz.", 401);
  if (me.level !== "owner") return NextResponse.json({ me, users: [] });
  const { data, error } = await getSupabaseAdmin().from("admin_users").select(COLUMNS).order("created_at");
  if (error) return NextResponse.json({ me, users: [], setupRequired: true });
  return NextResponse.json({ me, users: data });
}

export async function POST(request: Request) {
  const me = await getAdminSession();
  if (!me) return fail("Yetkisiz.", 401);
  if (me.level !== "owner") return fail("Yalnızca kurum sahibi hesap açabilir.", 403);
  const body = await request.json();
  const username = String(body.username || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  const role = body.role === "owner" ? "owner" : "staff";
  if (!USERNAME.test(username)) return fail("Kullanıcı adı 3-32 karakter olmalı; küçük harf, rakam, nokta, tire ve alt çizgi kullanılabilir.");
  if (!displayName) return fail("Ad soyad zorunludur.");
  if (password.length < MIN_PASSWORD) return fail(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);

  const { error } = await getSupabaseAdmin().from("admin_users").insert({ username, display_name: displayName, password_hash: hashPassword(password), role });
  if (error) return fail(error.code === "23505" ? "Bu kullanıcı adı zaten kullanılıyor." : "Hesap oluşturulamadı. Veritabanı güncellemesi yapıldı mı?", error.code === "23505" ? 409 : 500);
  return NextResponse.json({ ok: true });
}

/**
 * Sahip her hesabın adını, rolünü, durumunu ve şifresini değiştirebilir.
 * Personel yalnızca kendi şifresini, mevcut şifresini doğrulayarak değiştirir.
 */
export async function PATCH(request: Request) {
  const me = await getAdminSession();
  if (!me) return fail("Yetkisiz.", 401);
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return fail("Hesap seçilmedi.");
  const db = getSupabaseAdmin();
  const self = id === me.id;
  if (me.level !== "owner" && !self) return fail("Bu işlem için yetkiniz yok.", 403);

  const change: Record<string, unknown> = {};
  if (body.password !== undefined) {
    const password = String(body.password);
    if (password.length < MIN_PASSWORD) return fail(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);
    if (self) {
      const { data } = await db.from("admin_users").select("password_hash").eq("id", id).maybeSingle();
      if (!data || !verifyPassword(String(body.currentPassword || ""), data.password_hash)) return fail("Mevcut şifre hatalı.", 401);
    }
    change.password_hash = hashPassword(password);
  }
  if (me.level === "owner") {
    if (body.displayName !== undefined) {
      const displayName = String(body.displayName).trim();
      if (!displayName) return fail("Ad soyad zorunludur.");
      change.display_name = displayName;
    }
    if (body.role !== undefined) change.role = body.role === "owner" ? "owner" : "staff";
    if (body.active !== undefined) change.active = Boolean(body.active);
    if (self && (change.active === false || change.role === "staff")) return fail("Kendi hesabınızı pasifleştiremez ya da yetkinizi düşüremezsiniz.");
    if ((change.active === false || change.role === "staff") && !(await leavesAnOwner(db, id))) return fail("En az bir aktif kurum sahibi hesabı kalmalı.");
  }
  if (!Object.keys(change).length) return fail("Değişiklik yok.");

  const { error } = await db.from("admin_users").update(change).eq("id", id);
  if (error) return fail("Hesap güncellenemedi.", 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const me = await getAdminSession();
  if (!me) return fail("Yetkisiz.", 401);
  if (me.level !== "owner") return fail("Yalnızca kurum sahibi hesap silebilir.", 403);
  const { id } = await request.json();
  if (!id) return fail("Hesap seçilmedi.");
  if (id === me.id) return fail("Kendi hesabınızı silemezsiniz.");
  const db = getSupabaseAdmin();
  if (!(await leavesAnOwner(db, id))) return fail("En az bir aktif kurum sahibi hesabı kalmalı.");
  const { error } = await db.from("admin_users").delete().eq("id", id);
  if (error) return fail("Hesap silinemedi.", 500);
  return NextResponse.json({ ok: true });
}
