import type { Announcement, Exam, EventItem, Parent } from "../types";

export default function Overview({ parents, exams, announcements, events }: { parents: Parent[]; exams: Exam[]; announcements: Announcement[]; events: EventItem[] }) {
  return <section id="overview" className="stats statsFive"><article><small>VELİ HESABI</small><b>{parents.length}</b></article><article><small>TOPLAM DENEME</small><b>{exams.length}</b></article><article><small>DUYURU</small><b>{announcements.length}</b></article><article><small>ETKİNLİK</small><b>{events.length}</b></article><article><small>SON DENEME</small><b className="smallStat">{exams[0]?.exam_date ? new Date(exams[0].exam_date).toLocaleDateString("tr-TR") : "—"}</b></article></section>;
}
