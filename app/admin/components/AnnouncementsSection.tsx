"use client";

import { FormEvent, useState } from "react";
import type { Announcement } from "../types";
import ContentPreview, { PublishControls, useFilePreview } from "./ContentPreview";

export default function AnnouncementsSection({ announcements, saving, onCreate, onRemove, onTogglePublished }: {
  announcements: Announcement[]; saving: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>; onRemove: (id: string) => void;
  onTogglePublished: (id: string, published: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState(false);
  const imageUrl = useFilePreview(file);

  async function submit(event: FormEvent<HTMLFormElement>) {
    if (!(await onCreate(event))) return;
    setTitle(""); setBody(""); setFile(null); setDraft(false);
  }

  return <section id="announcements" className="adminColumns eventAdminColumns">
    <div className="adminCard">
      <div className="cardHead"><div><small>Duyuru</small><h2>Yeni duyuru ekle</h2></div></div>
      <form className="adminForm" onSubmit={submit}>
        <label>Duyuru başlığı<input name="title" required placeholder="Örn. Yaz Okulumuz Başlıyor" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Açıklama<textarea name="body" rows={6} required placeholder="Duyurunun tüm detaylarını yazın…" value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <label>Fotoğraf <span className="optionalLabel">(isteğe bağlı)</span><input className="fileInput" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><small>JPG, PNG veya WebP · En fazla 4 MB</small></label>
        <ContentPreview label="Sitede böyle görünecek" date={new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} title={title} text={body} imageUrl={imageUrl} />
        <label className="checkLine"><input type="checkbox" name="draft" checked={draft} onChange={(e) => setDraft(e.target.checked)} /> Taslak olarak kaydet <small>(sitede görünmez, sonra yayınlayabilirsiniz)</small></label>
        <button className="adminPrimary" disabled={saving}>{saving ? "Kaydediliyor…" : draft ? "Taslağı kaydet" : "Duyuruyu yayınla"}</button>
      </form>
    </div>
    <div className="adminCard">
      <div className="cardHead"><div><small>Kayıtlar</small><h2>Duyurular</h2></div></div>
      <div className="eventAdminList">
        {announcements.length === 0
          ? <div className="adminEmpty"><b>Henüz duyuru yok.</b><span>İlk duyurunuzu soldaki formdan ekleyin.</span></div>
          : announcements.map((item) => <article key={item.id} className={item.published ? "" : "isDraft"}>
            {item.image_url ? <img src={item.image_url} alt="" /> : <div className="eventPlaceholder">!</div>}
            <div><time>{new Date(item.created_at).toLocaleDateString("tr-TR")}</time><b>{item.title}</b><span>{item.body}</span></div>
            <div className="rowActions">
              <PublishControls published={item.published} onToggle={() => onTogglePublished(item.id, !item.published)} />
              <button type="button" onClick={() => onRemove(item.id)}>Sil</button>
            </div>
          </article>)}
      </div>
    </div>
  </section>;
}
