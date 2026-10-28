"use client";

import { FormEvent, useState } from "react";
import AuthShell from "../../components/auth-shell";

export default function AdminLogin({ onSubmit, message }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>; message: string }) {
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    setBusy(true);
    try { await onSubmit(event); } finally { setBusy(false); }
  }

  return <AuthShell
    badge="Yönetim paneli"
    title="Hoş geldiniz."
    text="Duyuruları, etkinlikleri, deneme sonuçlarını ve veli hesaplarını buradan yönetin."
    points={["Duyuru ve etkinlik yayınlama", "Deneme sonucu girişi", "Veli hesapları ve WhatsApp bildirimi"]}
  >
    <form className="ka-auth-card" onSubmit={submit}>
      <h2>Yönetici girişi</h2>
      <p>Devam etmek için yönetici şifrenizi girin.</p>
      <label>Yönetici şifresi<input name="password" type="password" required autoComplete="current-password" autoFocus /></label>
      {message && <div className="ka-auth-error" role="alert">{message}</div>}
      <button disabled={busy}>{busy ? "Giriş yapılıyor…" : "Panele giriş yap"}</button>
    </form>
  </AuthShell>;
}
