"use client";

import { FormEvent, useState } from "react";
import type { EventItem, Parent } from "../types";
import ContentPreview, { PublishControls, useFilePreview } from "./ContentPreview";

export default function EventsSection({ parents, events, shareScope, setShareScope, saving, onCreate, onRemove, onTogglePublished }: {
  parents: Parent[]; events: EventItem[]; shareScope: "site" | "parent"; setShareScope: (value: "site" | "parent") => void; saving: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; onRemove: (id: string) => void;
  onTogglePublished: (id: string, published: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState(false);
  const imageUrl = useFilePreview(file);
  const previewDate = date ? new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "Tarih";

  async function submit(event: FormEvent<HTMLFormElement>) {
    if (!(await onCreate(event))) return;
    setTitle(""); setDate(""); setSummary(""); setFile(null); setDraft(false);
  }

  return <section id="events" className="adminColumns eventAdminColumns">
    <div className="adminCard">
      <div className="cardHead"><div><small>Etkinlik</small><h2>Yeni etkinlik ekle</h2></div></div>
      <form className="adminForm" onSubmit={submit}>
        <label>Etkinlik başlığı<input name="title" required placeholder="Örn. Renkli Bilim Atölyesi" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Etkinlik tarihi<input name="eventDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <fieldset className="shareChooser"><legend>Paylaşım yeri</legend>
          <label className={shareScope === "site" ? "selected" : ""}><input type="radio" name="shareScope" value="site" checked={shareScope === "site"} onChange={() => setShareScope("site")} /><b>Siteye paylaşım</b><span>Etkinlik ana sayfada herkese görünür.</span></label>
          <label className={shareScope === "parent" ? "selected" : ""}><input type="radio" name="shareScope" value="parent" checked={shareScope === "parent"} onChange={() => setShareScope("parent")} /><b>Veliyle paylaşım</b><span>Yalnızca seçilen öğrencinin veli panelinde görünür.</span></label>
        </fieldset>
        {shareScope === "parent" && <label>Öğrenci<select name="parentId" required defaultValue=""><option value="" disabled>Öğrenci seçin</option>{parents.map((p) => <option key={p.id} value={p.id}>{p.student_name} · {p.parent_name}</option>)}</select></label>}
        <label>Kısa açıklama<textarea name="summary" rows={2} required maxLength={220} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={shareScope === "site" ? "Ana sayfada görünecek kısa açıklama" : "Veli panelinde görünecek kısa açıklama"} /></label>
        <label>Detaylar<textarea name="details" rows={4} placeholder="Etkinliğin içeriği, kazanımları ve diğer bilgiler" /></label>
        <label>Etkinlik fotoğrafı<input className="fileInput" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><small>JPG, PNG veya WebP · En fazla 4 MB</small></label>
        <ContentPreview label={shareScope === "site" ? "Ana sayfada böyle görünecek" : "Veli panelinde böyle görünecek"} date={previewDate} title={title} text={summary} imageUrl={imageUrl} />
        <label className="checkLine"><input type="checkbox" name="draft" checked={draft} onChange={(e) => setDraft(e.target.checked)} /> Taslak olarak kaydet <small>(görünmez, sonra yayınlayabilirsiniz)</small></label>
        <button className="adminPrimary" disabled={saving}>{saving ? "Kaydediliyor…" : draft ? "Taslağı kaydet" : shareScope === "site" ? "Sitede yayınla" : "Veliyle paylaş"}</button>
      </form>
    </div>
    <div className="adminCard">
      <div className="cardHead"><div><small>Kayıtlar</small><h2>Etkinlikler</h2></div></div>
      <div className="eventAdminList">
        {events.length === 0
          ? <div className="adminEmpty"><b>Henüz etkinlik yok.</b><span>İlk etkinliğinizi soldaki formdan ekleyin.</span></div>
          : events.map((item) => <article key={item.id} className={item.published ? "" : "isDraft"}>
            {item.image_url ? <img src={item.image_url} alt="" /> : <div className="eventPlaceholder">✦</div>}
            <div><time>{new Date(item.event_date).toLocaleDateString("tr-TR")} · <em className={`scopeBadge ${item.share_scope}`}>{item.share_scope === "parent" ? "Veli" : "Site"}</em></time><b>{item.title}</b><span>{item.share_scope === "parent" ? `${parents.find((p) => p.id === item.parent_id)?.student_name || "Öğrenci"} · ${item.summary}` : item.summary}</span></div>
            <div className="rowActions">
              <PublishControls published={item.published} onToggle={() => onTogglePublished(item.id, !item.published)} />
              <button type="button" onClick={() => onRemove(item.id)}>Sil</button>
            </div>
          </article>)}
      </div>
    </div>
  </section>;
}
