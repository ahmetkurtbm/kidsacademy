"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminLogin from "./components/AdminLogin";
import AnnouncementsSection from "./components/AnnouncementsSection";
import EventsSection from "./components/EventsSection";
import ExamSection from "./components/ExamSection";
import Overview from "./components/Overview";
import ParentsSection from "./components/ParentsSection";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Announcement, emptySubjects, Exam, EventItem, Parent } from "./types";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState<{ url: string; label: string } | null>(null);
  const [subjects, setSubjects] = useState(emptySubjects);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [shareScope, setShareScope] = useState<"site" | "parent">("site");
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const editingExam = exams.find((e) => e.id === editingExamId);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/data", { cache: "no-store" });
    if (response.status === 401) { setLoggedIn(false); setReady(true); return; }
    const data = await response.json();
    if (!response.ok) { setMessage(data.error); setReady(true); return; }
    setParents(data.parents || []); setExams(data.exams || []); setEvents(data.events || []); setAnnouncements(data.announcements || []); if (data.contentSetupRequired) setMessage("Bazı özellikler için Supabase SQL Editor'da supabase/migrations klasöründeki eksik migration dosyalarını çalıştırın (20260630_add_announcements_and_private_events.sql, 20260726_add_parent_phone.sql)."); setLoggedIn(true); setReady(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    await load();
  }

  async function createParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setNotify(null); const formElement = event.currentTarget; const form = new FormData(formElement);
    const response = await fetch("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "parent", parentName: form.get("parentName"), studentName: form.get("studentName"), slug: form.get("slug"), phone: form.get("phone"), password: form.get("password") }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error);
    formElement.reset(); setMessage("Veli hesabı oluşturuldu."); await load();
  }

  async function saveExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setNotify(null); const formElement = event.currentTarget; const form = new FormData(formElement);
    const parentId = String(form.get("parentId") || "");
    const title = String(form.get("title") || "");
    const score = Number(form.get("score"));
    const payload = { type: "exam", parentId, title, examDate: form.get("examDate"), score, note: form.get("note"), subjects };
    const response = editingExamId
      ? await fetch("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id: editingExamId }) })
      : await fetch("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error);
    formElement.reset(); setSubjects(emptySubjects());
    setMessage(editingExamId ? "Deneme sonucu güncellendi." : "Deneme sonucu kaydedildi.");
    const parent = parents.find((p) => p.id === parentId);
    if (parent?.phone) {
      setNotify({
        url: buildWhatsAppLink(parent.phone, `Merhaba ${parent.parent_name}, ${parent.student_name} için yeni bir deneme sonucu paylaşıldı: ${title} (${score} puan). Detaylar: ${window.location.origin}/veli/${parent.slug}`),
        label: `${parent.student_name} velisine WhatsApp ile bildir`,
      });
    }
    setEditingExamId(null); await load();
  }

  function startEditExam(exam: Exam) {
    setEditingExamId(exam.id);
    setSubjects(emptySubjects().map((draft) => {
      const found = exam.exam_subjects.find((s) => s.subject_name === draft.name);
      return found ? { name: draft.name, correct: found.correct_count, wrong: found.wrong_count, blank: found.blank_count, topics: found.review_topics || "" } : draft;
    }));
    document.getElementById("new-exam")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEditExam() {
    setEditingExamId(null); setSubjects(emptySubjects());
  }

  async function updateParent(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setMessage(""); setNotify(null); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "parent", id, parentName: form.get("parentName"), studentName: form.get("studentName"), slug: form.get("slug"), phone: form.get("phone"), active: form.get("active") === "on" }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error);
    setEditingParentId(null); setMessage("Veli hesabı güncellendi."); await load();
  }

  async function resetParentPassword(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); setMessage(""); setNotify(null); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/data", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "parent-password", id, password: form.get("password") }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error);
    setResettingPasswordId(null); setMessage("Şifre güncellendi."); await load();
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setNotify(null); setSavingEvent(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parentId = String(form.get("parentId") || "");
    const title = String(form.get("title") || "");
    try {
      const response = await fetch("/api/admin/events", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error);
      formElement.reset();
      setMessage(shareScope === "parent" ? "Etkinlik seçilen veliyle paylaşıldı." : "Etkinlik sitede yayınlandı.");
      if (shareScope === "parent") {
        const parent = parents.find((p) => p.id === parentId);
        if (parent?.phone) {
          setNotify({
            url: buildWhatsAppLink(parent.phone, `Merhaba ${parent.parent_name}, ${parent.student_name} için yeni bir etkinlik paylaşıldı: ${title}. Detaylar: ${window.location.origin}/veli/${parent.slug}`),
            label: `${parent.student_name} velisine WhatsApp ile bildir`,
          });
        }
      }
      setShareScope("site"); await load();
    } finally { setSavingEvent(false); }
  }

  async function createAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setNotify(null); setSavingAnnouncement(true);
    const formElement = event.currentTarget;
    try {
      const response = await fetch("/api/admin/announcements", { method: "POST", body: new FormData(formElement) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error);
      formElement.reset(); setMessage("Duyuru yayınlandı."); await load();
    } finally { setSavingAnnouncement(false); }
  }

  async function removeAnnouncement(id: string) {
    if (!confirm("Bu duyuru ve fotoğrafı silinsin mi?")) return;
    const response = await fetch("/api/admin/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error); setMessage("Duyuru silindi."); await load();
  }

  async function removeEvent(id: string) {
    if (!confirm("Bu etkinlik ve fotoğrafı silinsin mi?")) return;
    const response = await fetch("/api/admin/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error); setMessage("Etkinlik silindi."); await load();
  }

  async function remove(type: "exam" | "parent", id: string) {
    if (!confirm(type === "exam" ? "Bu deneme silinsin mi?" : "Veli ve tüm sonuçları silinsin mi?")) return;
    const response = await fetch("/api/admin/data", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error); await load();
  }

  if (!ready) return <main className="portalCenter"><p>Yükleniyor…</p></main>;
  if (!loggedIn) return <AdminLogin onSubmit={login} message={message} />;

  return <main className="adminShell">
    <aside className="adminSidebar"><Link className="portalLogo inversePortal" href="/">KA <b>Kids Academy</b></Link><nav><a href="#overview">Genel Bakış</a><a href="#announcements">Duyurular</a><a href="#events">Etkinlikler</a><a href="#new-exam">Deneme Girişi</a><a href="#parents">Veli Hesapları</a></nav><button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); location.reload(); }}>Çıkış yap</button></aside>
    <div className="adminMain">
      <header><div><small>YÖNETİM PANELİ</small><h1>Merhaba 👋</h1></div><Link href="/" target="_blank">Siteyi görüntüle ↗</Link></header>
      {message && <div className="formMessage">{message}</div>}
      {notify && <div className="formMessage"><a href={notify.url} target="_blank" rel="noreferrer">{notify.label} ↗</a></div>}
      <Overview parents={parents} exams={exams} announcements={announcements} events={events} />
      <AnnouncementsSection announcements={announcements} saving={savingAnnouncement} onCreate={createAnnouncement} onRemove={removeAnnouncement} />
      <EventsSection parents={parents} events={events} shareScope={shareScope} setShareScope={setShareScope} saving={savingEvent} onCreate={createEvent} onRemove={removeEvent} />
      <ExamSection parents={parents} exams={exams} subjects={subjects} setSubjects={setSubjects} editingExamId={editingExamId} editingExam={editingExam} onSave={saveExam} onCancelEdit={cancelEditExam} onStartEdit={startEditExam} onRemove={(id) => remove("exam", id)} />
      <ParentsSection parents={parents} editingParentId={editingParentId} setEditingParentId={setEditingParentId} resettingPasswordId={resettingPasswordId} setResettingPasswordId={setResettingPasswordId} onCreate={createParent} onUpdate={updateParent} onResetPassword={resetParentPassword} onRemove={remove} />
    </div>
  </main>;
}
