export type Parent = { id: string; slug: string; parent_name: string; student_name: string; phone?: string | null; active: boolean };
export type Subject = { id?: string; subject_name: string; correct_count: number; wrong_count: number; blank_count: number; review_topics?: string };
export type Exam = { id: string; parent_id: string; title: string; exam_date: string; score: number; note?: string; exam_subjects: Subject[] };
export type EventItem = { id: string; title: string; event_date: string; summary: string; details?: string; image_path?: string; image_url?: string; published: boolean; share_scope: "site" | "parent"; parent_id?: string };
export type Announcement = { id: string; title: string; body: string; image_path?: string; image_url?: string; published: boolean; created_at: string };
/** `questions` yalnızca girişte doğrulama içindir, veritabanına yazılmaz (0 = belirtilmedi). */
export type SubjectDraft = { name: string; questions: number; correct: number; wrong: number; blank: number; topics: string };

export const subjectNames = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce"];
export const emptySubjects = (): SubjectDraft[] => subjectNames.map((name) => ({ name, questions: 0, correct: 0, wrong: 0, blank: 0, topics: "" }));
