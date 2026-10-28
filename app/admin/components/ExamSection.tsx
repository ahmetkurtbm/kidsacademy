"use client";

import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { blankFor, hasMismatch, NET_RULES, netOf, NetRule, suggestedScore, totalsOf } from "@/lib/exam-score";
import type { Exam, Parent, SubjectDraft } from "../types";

/**
 * Tek öğrenci için deneme girişi. Soru sayısı girilirse boş otomatik hesaplanır
 * ve toplamı tutmayan ders kaydı engeller; net ve önerilen puan canlı görünür.
 */
export default function ExamSection({ parents, exams, subjects, setSubjects, editingExamId, editingExam, onSave, onCancelEdit, onStartEdit, onRemove }: {
  parents: Parent[]; exams: Exam[]; subjects: SubjectDraft[]; setSubjects: Dispatch<SetStateAction<SubjectDraft[]>>;
  editingExamId: string | null; editingExam: Exam | undefined;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; onCancelEdit: () => void; onStartEdit: (exam: Exam) => void; onRemove: (id: string) => void;
}) {
  return <>
    <section id="new-exam" className="adminCard">
      <div className="cardHead"><div><small>Deneme sonucu</small><h2>{editingExamId ? "Denemeyi düzenle" : "Tek öğrenci için sonuç ekle"}</h2></div><p>Soru sayısını girerseniz boşlar kendiliğinden hesaplanır ve tutmayan satırlar işaretlenir.</p></div>
      <ExamForm key={editingExamId ?? "new"} parents={parents} subjects={subjects} setSubjects={setSubjects} editingExamId={editingExamId} editingExam={editingExam} onSave={onSave} onCancelEdit={onCancelEdit} />
    </section>
    <section className="adminCard"><div className="cardHead"><div><small>Kayıtlar</small><h2>Son denemeler</h2></div></div><div className="examAdminList">{exams.map((e) => <article key={e.id}><div><b>{e.title}</b><span>{parents.find((p) => p.id === e.parent_id)?.student_name} · {new Date(e.exam_date).toLocaleDateString("tr-TR")}</span></div><strong>{e.score}</strong><button onClick={() => onStartEdit(e)}>Düzenle</button><button onClick={() => onRemove(e.id)}>Sil</button></article>)}</div></section>
  </>;
}

function ExamForm({ parents, subjects, setSubjects, editingExamId, editingExam, onSave, onCancelEdit }: {
  parents: Parent[]; subjects: SubjectDraft[]; setSubjects: Dispatch<SetStateAction<SubjectDraft[]>>;
  editingExamId: string | null; editingExam: Exam | undefined;
  onSave: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; onCancelEdit: () => void;
}) {
  const [rule, setRule] = useState<NetRule>(3);
  const [score, setScore] = useState(editingExam ? String(editingExam.score) : "");
  const [error, setError] = useState("");
  const totals = totalsOf(subjects, rule);
  const suggestion = suggestedScore(subjects, rule);
  const mismatched = subjects.filter(hasMismatch).map((s) => s.name);

  function update(index: number, field: "questions" | "correct" | "wrong" | "blank" | "topics", raw: string) {
    setSubjects((all) => all.map((s, i) => {
      if (i !== index) return s;
      const next = { ...s, [field]: field === "topics" ? raw : Math.max(0, Number(raw) || 0) };
      // Soru sayısı biliniyorsa boş elle girilmez; doğru ve yanlıştan hesaplanır.
      if (field !== "topics" && field !== "blank" && next.questions) next.blank = blankFor(next);
      return next;
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    if (mismatched.length) {
      event.preventDefault();
      setError(`Toplamı soru sayısını tutmayan dersler: ${mismatched.join(", ")}.`);
      return;
    }
    setError("");
    if (await onSave(event)) setScore("");
  }

  return <form onSubmit={submit} className="adminForm">
    <div className="formGrid four">
      <label>Öğrenci<select name="parentId" required defaultValue={editingExam?.parent_id ?? ""}><option value="" disabled>Öğrenci seçin</option>{parents.map((p) => <option key={p.id} value={p.id}>{p.student_name} · {p.slug}</option>)}</select></label>
      <label>Deneme adı<input name="title" required defaultValue={editingExam?.title} placeholder="Türkiye Geneli Deneme 3" /></label>
      <label>Tarih<input name="examDate" type="date" required defaultValue={editingExam?.exam_date} /></label>
      <label>Net hesabı<select value={rule} onChange={(e) => setRule(Number(e.target.value) as NetRule)}>{NET_RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
    </div>

    <div className="subjectEditor scoreEditor">
      <div className="subjectHeader"><span>Ders</span><span>Soru</span><span>Doğru</span><span>Yanlış</span><span>Boş</span><span>Net</span><span>Yanlış / boş bırakılan konular</span></div>
      {subjects.map((s, i) => {
        const bad = hasMismatch(s);
        return <div className={`subjectRow${bad ? " hasError" : ""}`} key={s.name}>
          <b>{s.name}</b>
          <input aria-label={`${s.name} soru sayısı`} type="number" min="0" placeholder="—" value={s.questions || ""} onChange={(e) => update(i, "questions", e.target.value)} />
          <input aria-label={`${s.name} doğru`} type="number" min="0" value={s.correct} onChange={(e) => update(i, "correct", e.target.value)} />
          <input aria-label={`${s.name} yanlış`} type="number" min="0" value={s.wrong} onChange={(e) => update(i, "wrong", e.target.value)} />
          <input aria-label={`${s.name} boş`} type="number" min="0" value={s.blank} readOnly={Boolean(s.questions)} title={s.questions ? "Soru sayısından hesaplanır" : undefined} onChange={(e) => update(i, "blank", e.target.value)} />
          <output aria-label={`${s.name} net`}>{netOf(s.correct, s.wrong, rule)}</output>
          <input aria-label={`${s.name} konular`} placeholder="Örn. Sözcükte anlam, yazım kuralları" value={s.topics} onChange={(e) => update(i, "topics", e.target.value)} />
        </div>;
      })}
      <div className="subjectRow totalsRow"><b>Toplam</b><span>{totals.questions || "—"}</span><span>{totals.correct}</span><span>{totals.wrong}</span><span>{totals.blank}</span><span>{totals.net}</span><span /></div>
    </div>

    <div className="scoreLine">
      <label>Puan (0–100)<input name="score" type="number" min="0" max="100" step="0.01" required value={score} onChange={(e) => setScore(e.target.value)} placeholder={suggestion !== null ? String(suggestion) : ""} /></label>
      {suggestion !== null && <p>Önerilen puan: <b>{suggestion}</b> (net {totals.net} / {totals.questions} soru)<button type="button" onClick={() => setScore(String(suggestion))}>Önerileni kullan</button></p>}
    </div>

    <label>Genel öğretmen notu<textarea name="note" rows={3} defaultValue={editingExam?.note} placeholder="İsteğe bağlı kısa değerlendirme" /></label>
    {error && <div className="inlineError" role="alert">{error}</div>}
    <div className="formActions">
      {editingExamId && <button type="button" className="secondaryButton" onClick={onCancelEdit}>Vazgeç</button>}
      <button className="adminPrimary">{editingExamId ? "Değişiklikleri kaydet" : "Sonucu kaydet"}</button>
    </div>
  </form>;
}
