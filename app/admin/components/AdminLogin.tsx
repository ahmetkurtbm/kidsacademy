"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
      <p>Size verilen kullanıcı adı ve şifreyle giriş yapın.</p>
      <label>Kullanıcı adı<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus /></label>
      <label>Şifre<input name="password" type="password" required autoComplete="current-password" /></label>
      {message && <div className="ka-auth-error" role="alert">{message}</div>}
      <button disabled={busy}>{busy ? "Giriş yapılıyor…" : "Panele giriş yap"}</button>
      <details className="ka-auth-help">
        <summary>İlk kurulum veya şifremi unuttum</summary>
        <p>Kurum sahibi, kullanıcı adını boş bırakıp kurtarma şifresiyle girebilir. Personel hesabının şifresini kurum sahibi sıfırlar.</p>
      </details>
      <p className="ka-auth-legal"><Link href="/kvkk">KVKK Aydınlatma Metni</Link></p>
    </form>
  </AuthShell>;
}
