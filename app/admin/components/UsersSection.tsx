"use client";

import { FormEvent, useState } from "react";
import type { AdminMe, AdminUser } from "../types";

type Send = (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => Promise<boolean>;

const ROLE_LABEL = { owner: "Kurum sahibi", staff: "Personel" } as const;
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "Henüz girmedi");

/**
 * Yönetici hesapları. Kurum sahibi hesap açar, pasifleştirir ve şifre sıfırlar;
 * personel yalnızca kendi şifresini değiştirir. Kurtarma şifresiyle girildiyse
 * önce kişisel bir sahip hesabı açılması istenir.
 */
export default function UsersSection({ me, users, setupRequired, onSend, onError }: { me: AdminMe; users: AdminUser[]; setupRequired: boolean; onSend: Send; onError: (text: string) => void }) {
  const [resetting, setResetting] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await onSend("POST", { username: form.get("username"), displayName: form.get("displayName"), password: form.get("password"), role: form.get("role") });
    if (ok) formElement.reset();
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (await onSend("PATCH", { id, password: form.get("password") })) setResetting(null);
  }

  async function changeOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("password") !== form.get("confirm")) return onError("Yeni şifreler birbiriyle aynı değil.");
    if (await onSend("PATCH", { id: me.id, currentPassword: form.get("currentPassword"), password: form.get("password") })) formElement.reset();
  }

  const ownPassword = !me.recovery && <div className="adminCard">
    <div className="cardHead"><div><small>Hesabım</small><h2>Şifremi değiştir</h2></div><p>{me.name} · {ROLE_LABEL[me.level]}</p></div>
    <form className="adminForm" onSubmit={changeOwnPassword}>
      <label>Mevcut şifre<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
      <label>Yeni şifre<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="En az 8 karakter" /></label>
      <label>Yeni şifre (tekrar)<input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
      <button className="adminPrimary">Şifreyi değiştir</button>
    </form>
  </div>;

  if (me.level !== "owner") return <section id="users" className="adminColumns">{ownPassword}</section>;

  return <section id="users" className="adminColumns">
    {setupRequired
      ? <div className="adminCard"><div className="cardHead"><div><small>Kullanıcılar</small><h2>Kurulum gerekli</h2></div></div><p className="usersNotice">Kişisel yönetici hesapları için Supabase SQL Editor&apos;da <code>supabase/migrations/20261029_add_admin_users.sql</code> dosyasını bir kez çalıştırın, sonra bu sayfayı yenileyin.</p></div>
      : <div className="adminCard">
        <div className="cardHead"><div><small>Kullanıcılar</small><h2>Yeni yönetici hesabı</h2></div><p>Her çalışana ayrı hesap açın; ortak şifre paylaşmayın.</p></div>
        {me.recovery && <p className="usersNotice">Kurtarma şifresiyle girdiniz. Önce kendinize <b>Kurum sahibi</b> rolünde bir hesap açın ve günlük girişleri onunla yapın.</p>}
        <form className="adminForm" onSubmit={create}>
          <label>Ad soyad<input name="displayName" required placeholder="Ayşe Yılmaz" /></label>
          <label>Kullanıcı adı<input name="username" required pattern="[a-z0-9._\-]{3,32}" title="3-32 karakter: küçük harf, rakam, nokta, tire, alt çizgi" placeholder="ayse.yilmaz" autoCapitalize="none" spellCheck={false} /></label>
          <label>İlk şifre<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="En az 8 karakter" /></label>
          <label>Yetki<select name="role" defaultValue={me.recovery && users.length === 0 ? "owner" : "staff"}><option value="staff">Personel: içerik, deneme ve veli işlemleri</option><option value="owner">Kurum sahibi: personel hesaplarını da yönetir</option></select></label>
          <button className="adminPrimary">Hesabı oluştur →</button>
        </form>
      </div>}

    {!setupRequired && <div className="adminCard">
      <div className="cardHead"><div><small>Hesaplar</small><h2>Yöneticiler</h2></div></div>
      <div className="accountList">{users.length === 0 ? <p>Henüz kişisel hesap yok.</p> : users.map((u) => <article key={u.id}>
        {resetting === u.id
          ? <form onSubmit={(e) => resetPassword(e, u.id)}><label>{u.display_name} için yeni şifre<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="En az 8 karakter" autoFocus /></label><button className="adminPrimary">Şifreyi kaydet</button><button type="button" onClick={() => setResetting(null)}>Vazgeç</button></form>
          : <>
            <div><b>{u.display_name}{u.id === me.id && " (siz)"}</b><span>@{u.username} · {ROLE_LABEL[u.role]}{!u.active && " · pasif"} · Son giriş: {formatDate(u.last_login_at)}</span></div>
            {u.id !== me.id && <button onClick={() => onSend("PATCH", { id: u.id, active: !u.active })}>{u.active ? "Pasifleştir" : "Aktifleştir"}</button>}
            {u.id !== me.id && <button onClick={() => setResetting(u.id)}>Şifre sıfırla</button>}
            {u.id !== me.id && <button onClick={() => { if (confirm(`${u.display_name} hesabı silinsin mi?`)) onSend("DELETE", { id: u.id }); }}>Sil</button>}
          </>}
      </article>)}</div>
    </div>}
    {ownPassword}
  </section>;
}
