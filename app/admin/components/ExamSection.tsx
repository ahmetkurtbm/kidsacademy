"use client";

import { Dispatch, FormEvent, SetStateAction } from "react";
import type { Exam, Parent, SubjectDraft } from "../types";

export default function ExamSection({ parents, exams, subjects, setSubjects, editingExamId, editingExam, onSave, onCancelEdit, onStartEdit, onRemove }: {
  parents: Parent[]; exams: Exam[]; subjects: SubjectDraft[]; setSubjects: Dispatch<SetStateAction<SubjectDraft[]>>;
  editingExamId: string | null; editingExam: Exam | undefined;
  onSave: (event: FormEvent<HTMLFormElement>) => void; onCancelEdit: () => void; onStartEdit: (exam: Exam) => void; onRemove: (id: string) => void;
}) {
  return <>
    <section id="new-exam" className="adminCard"><div className="cardHead"><div><small>DENEME SONUCU</small><h2>{editingExamId ? "Denemeyi düzenle" : "Yeni sonuç ekle"}</h2></div><p>Her ders için doğru, yanlış, boş ve çalışılması gereken konuları yazın.</p></div>
      <form key={editingExamId ?? "new"} onSubmit={onSave} className="adminForm"><div className="formGrid four"><label>Öğrenci<select name="parentId" required defaultValue={editingExam?.parent_id ?? ""}><option value="" disabled>Öğrenci seçin</option>{parents.map(p => <option key={p.id} value={p.id}>{p.student_name} · {p.slug}</option>)}</select></label><label>Deneme adı<input name="title" required defaultValue={editingExam?.title} placeholder="Türkiye Geneli Deneme 3" /></label><label>Tarih<input name="examDate" type="date" required defaultValue={editingExam?.exam_date} /></label><label>Puan (0–100)<input name="score" type="number" min="0" max="100" step="0.01" required defaultValue={editingExam?.score} /></label></div>
        <div className="subjectEditor"><div className="subjectHeader"><span>Ders</span><span>Doğru</span><span>Yanlış</span><span>Boş</span><span>Yanlış / boş bırakılan konular</span></div>{subjects.map((s, i) => <div className="subjectRow" key={s.name}><b>{s.name}</b><input aria-label={`${s.name} doğru`} type="number" min="0" value={s.correct} onChange={e => setSubjects(v => v.map((x, j) => j === i ? { ...x, correct: Number(e.target.value) } : x))} /><input aria-label={`${s.name} yanlış`} type="number" min="0" value={s.wrong} onChange={e => setSubjects(v => v.map((x, j) => j === i ? { ...x, wrong: Number(e.target.value) } : x))} /><input aria-label={`${s.name} boş`} type="number" min="0" value={s.blank} onChange={e => setSubjects(v => v.map((x, j) => j === i ? { ...x, blank: Number(e.target.value) } : x))} /><input aria-label={`${s.name} konular`} placeholder="Örn. Sözcükte anlam, yazım kuralları" value={s.topics} onChange={e => setSubjects(v => v.map((x, j) => j === i ? { ...x, topics: e.target.value } : x))} /></div>)}</div>
        <label>Genel öğretmen notu<textarea name="note" rows={3} defaultValue={editingExam?.note} placeholder="İsteğe bağlı kısa değerlendirme" /></label><button className="adminPrimary">{editingExamId ? "Değişiklikleri kaydet →" : "Sonucu kaydet →"}</button>{editingExamId && <button type="button" onClick={onCancelEdit}>Vazgeç</button>}
      </form>
    </section>
    <section className="adminCard"><div className="cardHead"><div><small>KAYITLAR</small><h2>Son denemeler</h2></div></div><div className="examAdminList">{exams.map(e => <article key={e.id}><div><b>{e.title}</b><span>{parents.find(p => p.id === e.parent_id)?.student_name} · {new Date(e.exam_date).toLocaleDateString("tr-TR")}</span></div><strong>{e.score}</strong><button onClick={() => onStartEdit(e)}>Düzenle</button><button onClick={() => onRemove(e.id)}>Sil</button></article>)}</div></section>
  </>;
}
