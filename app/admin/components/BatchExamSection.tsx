"use client";

import { FormEvent, useMemo, useState } from "react";
import { blankFor, hasMismatch, NET_RULES, NetRule, suggestedScore } from "@/lib/exam-score";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { subjectNames, type Exam, type Parent } from "../types";

type Row = { include: boolean; score: string; marks: { correct: number; wrong: number }[] };

/**
 * Aynı denemeyi sınıfın tamamı için tek ekranda girme. Sınav adı, tarih ve ders
 * başına soru sayısı bir kez girilir; her öğrenci için yalnızca doğru ve yanlış
 * yazılır, boş ve önerilen puan hesaplanır. Kayıt mevcut deneme API'sine
 * öğrenci başına bir istek olarak gider.
 */
export default function BatchExamSection({ parents, exams, onSaved }: {
  parents: Parent[]; exams: Exam[];
  onSaved: (message: string) => Promise<void>;
}) {
  const students = useMemo(() => parents.filter((p) => p.active), [parents]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [rule, setRule] = useState<NetRule>(3);
  const [questions, setQuestions] = useState<number[]>(subjectNames.map(() => 0));
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<{ label: string; url: string }[]>([]);

  const rowOf = (id: string): Row => rows[id] ?? { include: false, score: "", marks: subjectNames.map(() => ({ correct: 0, wrong: 0 })) };
  const subjectsOf = (row: Row) => subjectNames.map((name, i) => {
    const base = { correct: row.marks[i].correct, wrong: row.marks[i].wrong, blank: 0, questions: questions[i] };
    return { name, ...base, blank: blankFor(base) };
  });

  function setRow(id: string, change: (row: Row) => Row) {
    setRows((all) => ({ ...all, [id]: change(rowOf(id)) }));
  }

  function setMark(id: string, subject: number, field: "correct" | "wrong", raw: string) {
    setRow(id, (row) => ({
      ...row,
      include: true,
      marks: row.marks.map((m, i) => (i === subject ? { ...m, [field]: Math.max(0, Number(raw) || 0) } : m)),
    }));
  }

  /** Son denemenin adını ve ders başına soru sayılarını getirir. */
  function copyLast() {
    const last = [...exams].sort((a, b) => b.exam_date.localeCompare(a.exam_date))[0];
    if (!last) return;
    setTitle(last.title);
    setQuestions(subjectNames.map((name) => {
      const s = last.exam_subjects.find((x) => x.subject_name === name);
      return s ? s.correct_count + s.wrong_count + s.blank_count : 0;
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotifications([]);
    const chosen = students.filter((p) => rowOf(p.id).include);
    if (!chosen.length) return setError("En az bir öğrencinin sonucunu girin.");
    for (const p of chosen) {
      const bad = subjectsOf(rowOf(p.id)).filter(hasMismatch).map((s) => s.name);
      if (bad.length) return setError(`${p.student_name}: doğru + yanlış soru sayısını aşıyor (${bad.join(", ")}).`);
    }

    setSaving(true);
    const failed: string[] = [];
    const sent: { label: string; url: string }[] = [];
    try {
      for (const p of chosen) {
        const row = rowOf(p.id);
        const subjects = subjectsOf(row).map((s) => ({ name: s.name, correct: s.correct, wrong: s.wrong, blank: s.blank, topics: "" }));
        const score = row.score !== "" ? Number(row.score) : suggestedScore(subjectsOf(row), rule) ?? 0;
        const response = await fetch("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "exam", parentId: p.id, title, examDate: date, score, note: "", subjects }) });
        if (!response.ok) { failed.push(p.student_name); continue; }
        if (p.phone) sent.push({ label: `${p.student_name} velisine bildir`, url: buildWhatsAppLink(p.phone, `Merhaba ${p.parent_name}, ${p.student_name} için yeni bir deneme sonucu paylaşıldı: ${title} (${score} puan). Detaylar: ${window.location.origin}/veli/${p.slug}`) });
      }
    } finally {
      setSaving(false);
    }
    const ok = chosen.length - failed.length;
    if (failed.length) setError(`Kaydedilemeyenler: ${failed.join(", ")}. Tekrar deneyebilirsiniz.`);
    // Yalnızca kaydedilen satırlar temizlenir; hatalılar düzeltilmek üzere kalır.
    setRows((all) => Object.fromEntries(Object.entries(all).filter(([id]) => failed.includes(students.find((p) => p.id === id)?.student_name ?? ""))));
    setNotifications(sent);
    if (ok) await onSaved(`${ok} öğrencinin sonucu kaydedildi.`);
  }

  return <section id="batch-exam" className="adminCard">
    <div className="cardHead"><div><small>Toplu giriş</small><h2>Sınıfın tamamı için deneme sonucu</h2></div><p>Ayarları bir kez girin; her öğrenci için yalnızca doğru ve yanlış sayısını yazın. Satıra yazmaya başladığınızda öğrenci kayda eklenir.</p></div>
    <form className="adminForm" onSubmit={save}>
      <div className="formGrid four">
        <label>Deneme adı<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Türkiye Geneli Deneme 3" /></label>
        <label>Tarih<input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Net hesabı<select value={rule} onChange={(e) => setRule(Number(e.target.value) as NetRule)}>{NET_RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
        <label>&nbsp;<button type="button" className="secondaryButton" onClick={copyLast} disabled={!exams.length}>Son denemeden kopyala</button></label>
      </div>

      <div className="batchQuestions">
        <b>Soru sayısı</b>
        {subjectNames.map((name, i) => <label key={name}>{name}<input type="number" min="0" placeholder="—" value={questions[i] || ""} onChange={(e) => setQuestions((q) => q.map((v, j) => (j === i ? Math.max(0, Number(e.target.value) || 0) : v)))} /></label>)}
      </div>

      {students.length === 0
        ? <div className="adminEmpty"><b>Aktif öğrenci yok.</b><span>Önce aşağıdan veli hesabı oluşturun.</span></div>
        : <div className="batchTable" role="table" aria-label="Öğrenci sonuçları">
          <div className="batchRow batchHead" role="row">
            <span role="columnheader">Öğrenci</span>
            {subjectNames.map((name) => <span role="columnheader" key={name}>{name}<small>D · Y</small></span>)}
            <span role="columnheader">Puan</span>
          </div>
          {students.map((p) => {
            const row = rowOf(p.id);
            const subjects = subjectsOf(row);
            const suggestion = suggestedScore(subjects, rule);
            const bad = subjects.some(hasMismatch);
            return <div className={`batchRow${row.include ? " isIncluded" : ""}${bad ? " hasError" : ""}`} role="row" key={p.id}>
              <label className="batchStudent" role="cell"><input type="checkbox" checked={row.include} onChange={(e) => setRow(p.id, (r) => ({ ...r, include: e.target.checked }))} /> {p.student_name}</label>
              {subjectNames.map((name, i) => <span className="batchPair" role="cell" key={name}>
                <input aria-label={`${p.student_name} ${name} doğru`} type="number" min="0" value={row.marks[i].correct || ""} placeholder="D" onChange={(e) => setMark(p.id, i, "correct", e.target.value)} />
                <input aria-label={`${p.student_name} ${name} yanlış`} type="number" min="0" value={row.marks[i].wrong || ""} placeholder="Y" onChange={(e) => setMark(p.id, i, "wrong", e.target.value)} />
              </span>)}
              <span role="cell"><input aria-label={`${p.student_name} puan`} type="number" min="0" max="100" step="0.01" value={row.score} placeholder={suggestion !== null ? String(suggestion) : "—"} onChange={(e) => setRow(p.id, (r) => ({ ...r, include: true, score: e.target.value }))} /></span>
            </div>;
          })}
        </div>}

      <p className="batchHint">Puan boş bırakılırsa gri yazan önerilen puan kaydedilir. Soru sayısı girildiyse boşlar otomatik hesaplanır.</p>
      {error && <div className="inlineError" role="alert">{error}</div>}
      <button className="adminPrimary" disabled={saving || students.length === 0}>{saving ? "Kaydediliyor…" : "Seçili öğrencilerin sonuçlarını kaydet"}</button>
      {notifications.length > 0 && <div className="notifyList"><b>Velilere WhatsApp ile bildirin</b>{notifications.map((n) => <a key={n.url} href={n.url} target="_blank" rel="noreferrer">{n.label} ↗</a>)}</div>}
    </form>
  </section>;
}
