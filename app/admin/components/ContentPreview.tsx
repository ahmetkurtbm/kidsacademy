"use client";

import { useEffect, useState } from "react";

/** Seçilen fotoğrafın geçici önizleme adresi; bileşen kapanınca serbest bırakılır. */
export function useFilePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

/**
 * Kaydetmeden önce kartın sitede nasıl görüneceği. Ana sayfadaki duyuru ve
 * etkinlik kartlarıyla aynı yapı (home-v3.css'teki ka-card).
 */
export default function ContentPreview({ label, date, title, text, imageUrl }: {
  label: string; date: string; title: string; text: string; imageUrl: string | null;
}) {
  return <div className="contentPreview" aria-live="polite">
    <small>{label}</small>
    <article>
      {imageUrl && <img src={imageUrl} alt="" />}
      <div>
        <time>{date}</time>
        <h3>{title || "Başlık burada görünecek"}</h3>
        <p>{text || "Açıklama burada görünecek."}</p>
      </div>
    </article>
  </div>;
}

/** Kayıt listesindeki yayın durumu rozeti ve değiştirme düğmesi. */
export function PublishControls({ published, onToggle }: { published: boolean; onToggle: () => void }) {
  return <>
    <em className={`statusBadge ${published ? "live" : "draft"}`}>{published ? "Yayında" : "Taslak"}</em>
    <button type="button" className="toggleButton" onClick={onToggle}>{published ? "Yayından kaldır" : "Yayınla"}</button>
  </>;
}
