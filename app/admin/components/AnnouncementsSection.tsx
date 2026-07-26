"use client";

import { FormEvent } from "react";
import type { Announcement } from "../types";

export default function AnnouncementsSection({ announcements, saving, onCreate, onRemove }: {
  announcements: Announcement[]; saving: boolean;
  onCreate: (event: FormEvent<HTMLFormElement>) => void; onRemove: (id: string) => void;
}) {
  return <section id="announcements" className="adminColumns eventAdminColumns">
    <div className="adminCard"><div className="cardHead"><div><small>DUYURU YAYINLA</small><h2>Yeni duyuru ekle</h2></div></div><form className="adminForm" onSubmit={onCreate}><label>Duyuru başlığı<input name="title" required placeholder="Örn. Yaz Okulumuz Başlıyor" /></label><label>Geniş açıklama<textarea name="body" rows={7} required placeholder="Duyurunun tüm detaylarını yazın…" /></label><label>Duyuru fotoğrafı <span className="optionalLabel">(isteğe bağlı)</span><input className="fileInput" name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>Fotoğraf eklenirse ana sayfada metnin sağında küçük gösterilir.</small></label><button className="adminPrimary" disabled={saving}>{saving ? "Yükleniyor…" : "Duyuruyu yayınla →"}</button></form></div>
    <div className="adminCard"><div className="cardHead"><div><small>YAYINDAKİ DUYURULAR</small><h2>Son duyurular</h2></div></div><div className="eventAdminList">{announcements.length === 0 ? <div className="adminEmpty"><b>Henüz duyuru yok.</b><span>İlk duyurunuzu soldaki formdan yayınlayın.</span></div> : announcements.map(item => <article key={item.id}>{item.image_url ? <img src={item.image_url} alt={item.title} /> : <div className="eventPlaceholder">!</div>}<div><time>{new Date(item.created_at).toLocaleDateString("tr-TR")}</time><b>{item.title}</b><span>{item.body}</span></div><button onClick={() => onRemove(item.id)}>Sil</button></article>)}</div></div>
  </section>;
}
