import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "event-images";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function authorized() {
  return Boolean(await getAdminSession());
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const eventDate = String(form.get("eventDate") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const details = String(form.get("details") || "").trim();
    const shareScope = String(form.get("shareScope") || "site");
    const parentId = String(form.get("parentId") || "").trim();
    const image = form.get("image");
    const published = form.get("draft") !== "on";
    if (!title || !eventDate || !summary) return NextResponse.json({ error: "Başlık, tarih ve kısa açıklama zorunludur." }, { status: 400 });
    if (!['site', 'parent'].includes(shareScope)) return NextResponse.json({ error: "Geçersiz paylaşım hedefi." }, { status: 400 });
    if (shareScope === "parent" && !parentId) return NextResponse.json({ error: "Veliyle paylaşım için öğrenci seçin." }, { status: 400 });

    const db = getSupabaseAdmin();
    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      if (!ALLOWED_TYPES.has(image.type)) return NextResponse.json({ error: "Fotoğraf JPG, PNG veya WebP olmalı." }, { status: 400 });
      if (image.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Fotoğraf en fazla 4 MB olabilir." }, { status: 400 });
      const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
      imagePath = `${new Date().getFullYear()}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(imagePath, Buffer.from(await image.arrayBuffer()), { contentType: image.type, upsert: false });
      if (uploadError) throw uploadError;
      imageUrl = db.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
    }

    if (shareScope === "parent") {
      const { data: parent } = await db.from("parent_accounts").select("id").eq("id", parentId).eq("active", true).maybeSingle();
      if (!parent) {
        if (imagePath) await db.storage.from(BUCKET).remove([imagePath]);
        return NextResponse.json({ error: "Seçilen öğrenci hesabı bulunamadı." }, { status: 400 });
      }
    }

    const { error } = await db.from("events").insert({ title, event_date: eventDate, summary, details: details || null, image_path: imagePath, image_url: imageUrl, published, share_scope: shareScope, parent_id: shareScope === "parent" ? parentId : null });
    if (error) {
      if (imagePath) await db.storage.from(BUCKET).remove([imagePath]);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Etkinlik kaydedilemedi." }, { status: 500 });
  }
}

/** Yayın durumunu değiştirir: taslağı yayınlar ya da yayındakini gizler. */
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const { id, published } = await request.json();
    if (!id || typeof published !== "boolean") return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("events").update({ published }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Güncelleme başarısız." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Etkinlik kimliği eksik." }, { status: 400 });
    const db = getSupabaseAdmin();
    const { data: event } = await db.from("events").select("image_path").eq("id", id).maybeSingle();
    const { error } = await db.from("events").delete().eq("id", id);
    if (error) throw error;
    if (event?.image_path) await db.storage.from(BUCKET).remove([event.image_path]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Etkinlik silinemedi." }, { status: 500 });
  }
}
