import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "event-images";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function authorized() {
  const session = readSession((await cookies()).get("ka_admin")?.value);
  return session?.role === "admin";
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    const image = form.get("image");
    // "Taslak olarak kaydet" işaretliyse kayıt sitede görünmez; sonradan yayınlanabilir.
    const published = form.get("draft") !== "on";
    if (!title || !body) return NextResponse.json({ error: "Duyuru başlığı ve açıklaması zorunludur." }, { status: 400 });

    const db = getSupabaseAdmin();
    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      if (!ALLOWED_TYPES.has(image.type)) return NextResponse.json({ error: "Fotoğraf JPG, PNG veya WebP olmalı." }, { status: 400 });
      if (image.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Fotoğraf en fazla 4 MB olabilir." }, { status: 400 });
      const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
      imagePath = `announcements/${new Date().getFullYear()}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(imagePath, Buffer.from(await image.arrayBuffer()), { contentType: image.type, upsert: false });
      if (uploadError) throw uploadError;
      imageUrl = db.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
    }

    const { error } = await db.from("announcements").insert({ title, body, image_path: imagePath, image_url: imageUrl, published });
    if (error) {
      if (imagePath) await db.storage.from(BUCKET).remove([imagePath]);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Duyuru kaydedilemedi." }, { status: 500 });
  }
}

/** Yayın durumunu değiştirir: taslağı yayınlar ya da yayındakini gizler. */
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const { id, published } = await request.json();
    if (!id || typeof published !== "boolean") return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("announcements").update({ published }).eq("id", id);
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
    if (!id) return NextResponse.json({ error: "Duyuru kimliği eksik." }, { status: 400 });
    const db = getSupabaseAdmin();
    const { data: announcement } = await db.from("announcements").select("image_path").eq("id", id).maybeSingle();
    const { error } = await db.from("announcements").delete().eq("id", id);
    if (error) throw error;
    if (announcement?.image_path) await db.storage.from(BUCKET).remove([announcement.image_path]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Duyuru silinemedi." }, { status: 500 });
  }
}
