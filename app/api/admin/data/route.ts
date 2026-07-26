import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword, readSession } from "@/lib/auth";
import { normalizeSlug } from "@/lib/slug";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizePhone } from "@/lib/whatsapp";

async function authorized() {
  const session = readSession((await cookies()).get("ka_admin")?.value);
  return session?.role === "admin";
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const db = getSupabaseAdmin();
    let { data: parents, error: pError } = await db.from("parent_accounts").select("id,slug,parent_name,student_name,phone,active,created_at").order("student_name");
    let phoneSetupRequired = false;
    if (pError) {
      const fallback = await db.from("parent_accounts").select("id,slug,parent_name,student_name,active,created_at").order("student_name");
      if (fallback.error) throw fallback.error;
      parents = fallback.data?.map((p) => ({ ...p, phone: null }));
      phoneSetupRequired = true;
    }
    const [{ data: exams, error: eError }, { data: events, error: eventError }, { data: announcements, error: announcementError }] = await Promise.all([
      db.from("exams").select("id,parent_id,title,exam_date,score,note,exam_subjects(id,subject_name,correct_count,wrong_count,blank_count,review_topics)").order("exam_date", { ascending: false }),
      db.from("events").select("id,title,event_date,summary,details,image_path,image_url,published,share_scope,parent_id,created_at").order("event_date", { ascending: false }).order("created_at", { ascending: false }),
      db.from("announcements").select("id,title,body,image_path,image_url,published,created_at").order("created_at", { ascending: false }),
    ]);
    if (eError) throw eError;
    return NextResponse.json({ parents, exams, events: eventError ? [] : events, announcements: announcementError ? [] : announcements, contentSetupRequired: Boolean(eventError || announcementError || phoneSetupRequired) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Veriler alınamadı." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const body = await request.json();
    const db = getSupabaseAdmin();
    if (body.type === "parent") {
      const slug = normalizeSlug(body.slug);
      if (slug.length < 3 || String(body.password || "").length < 6 || !body.parentName || !body.studentName) {
        return NextResponse.json({ error: "Veli bilgileri eksik; şifre en az 6 karakter olmalı." }, { status: 400 });
      }
      const { error } = await db.from("parent_accounts").insert({ slug, parent_name: body.parentName, student_name: body.studentName, phone: normalizePhone(body.phone) || null, password_hash: hashPassword(body.password) });
      if (error) throw error;
    } else if (body.type === "exam") {
      if (!body.parentId || !body.title || !body.examDate || !Number.isFinite(Number(body.score)) || !Array.isArray(body.subjects)) {
        return NextResponse.json({ error: "Deneme bilgileri eksik." }, { status: 400 });
      }
      const { data: exam, error } = await db.from("exams").insert({ parent_id: body.parentId, title: body.title, exam_date: body.examDate, score: Number(body.score), note: body.note || null }).select("id").single();
      if (error) throw error;
      const subjects = body.subjects.filter((s: { name?: string }) => s.name?.trim()).map((s: { name: string; correct: number; wrong: number; blank: number; topics?: string }) => ({
        exam_id: exam.id, subject_name: s.name.trim(), correct_count: Math.max(0, Number(s.correct) || 0), wrong_count: Math.max(0, Number(s.wrong) || 0), blank_count: Math.max(0, Number(s.blank) || 0), review_topics: s.topics?.trim() || null,
      }));
      if (subjects.length) {
        const { error: subjectError } = await db.from("exam_subjects").insert(subjects);
        if (subjectError) { await db.from("exams").delete().eq("id", exam.id); throw subjectError; }
      }
    } else return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kayıt başarısız." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  try {
    const body = await request.json();
    const db = getSupabaseAdmin();
    if (!body.id) return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    if (body.type === "parent") {
      const slug = normalizeSlug(body.slug);
      if (slug.length < 3 || !body.parentName || !body.studentName) {
        return NextResponse.json({ error: "Veli bilgileri eksik." }, { status: 400 });
      }
      const { error } = await db.from("parent_accounts").update({ slug, parent_name: body.parentName, student_name: body.studentName, phone: normalizePhone(body.phone) || null, active: Boolean(body.active) }).eq("id", body.id);
      if (error) throw error;
    } else if (body.type === "parent-password") {
      if (String(body.password || "").length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
      }
      const { error } = await db.from("parent_accounts").update({ password_hash: hashPassword(body.password) }).eq("id", body.id);
      if (error) throw error;
    } else if (body.type === "exam") {
      if (!body.parentId || !body.title || !body.examDate || !Number.isFinite(Number(body.score)) || !Array.isArray(body.subjects)) {
        return NextResponse.json({ error: "Deneme bilgileri eksik." }, { status: 400 });
      }
      const { error } = await db.from("exams").update({ parent_id: body.parentId, title: body.title, exam_date: body.examDate, score: Number(body.score), note: body.note || null }).eq("id", body.id);
      if (error) throw error;
      const { error: deleteError } = await db.from("exam_subjects").delete().eq("exam_id", body.id);
      if (deleteError) throw deleteError;
      const subjects = body.subjects.filter((s: { name?: string }) => s.name?.trim()).map((s: { name: string; correct: number; wrong: number; blank: number; topics?: string }) => ({
        exam_id: body.id, subject_name: s.name.trim(), correct_count: Math.max(0, Number(s.correct) || 0), wrong_count: Math.max(0, Number(s.wrong) || 0), blank_count: Math.max(0, Number(s.blank) || 0), review_topics: s.topics?.trim() || null,
      }));
      if (subjects.length) {
        const { error: subjectError } = await db.from("exam_subjects").insert(subjects);
        if (subjectError) throw subjectError;
      }
    } else return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Güncelleme başarısız." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const { type, id } = await request.json();
  if (!id || !["exam", "parent"].includes(type)) return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  const table = type === "exam" ? "exams" : "parent_accounts";
  const { error } = await getSupabaseAdmin().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
