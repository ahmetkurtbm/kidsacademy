"use client";

import { FormEvent } from "react";
import type { Parent } from "../types";

export default function ParentsSection({ parents, editingParentId, setEditingParentId, resettingPasswordId, setResettingPasswordId, onCreate, onUpdate, onResetPassword, onRemove }: {
  parents: Parent[]; editingParentId: string | null; setEditingParentId: (id: string | null) => void;
  resettingPasswordId: string | null; setResettingPasswordId: (id: string | null) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>, id: string) => void;
  onResetPassword: (event: FormEvent<HTMLFormElement>, id: string) => void;
  onRemove: (type: "parent", id: string) => void;
}) {
  return <section id="parents" className="adminColumns">
    <div className="adminCard"><div className="cardHead"><div><small>VELİ HESABI</small><h2>Yeni hesap oluştur</h2></div></div><form className="adminForm" onSubmit={onCreate}><label>Veli adı<input name="parentName" required placeholder="Ahmet Kurt" /></label><label>Öğrenci adı<input name="studentName" required placeholder="Ece Kurt" /></label><label>Sayfa adresi<input name="slug" required placeholder="ahmetkurt" /></label><label>Telefon <span className="optionalLabel">(isteğe bağlı, WhatsApp bildirimi için)</span><input name="phone" type="tel" placeholder="905551234567" /></label><label>Veli şifresi<input name="password" required minLength={6} placeholder="En az 6 karakter" /></label><button className="adminPrimary">Hesabı oluştur →</button></form></div>
    <div className="adminCard"><div className="cardHead"><div><small>AKTİF HESAPLAR</small><h2>Veliler</h2></div></div><div className="accountList">{parents.length === 0 ? <p>Henüz veli hesabı yok.</p> : parents.map(p => <article key={p.id}>{editingParentId === p.id ? <form onSubmit={e => onUpdate(e, p.id)}><label>Veli adı<input name="parentName" required defaultValue={p.parent_name} /></label><label>Öğrenci adı<input name="studentName" required defaultValue={p.student_name} /></label><label>Sayfa adresi<input name="slug" required defaultValue={p.slug} /></label><label>Telefon <span className="optionalLabel">(isteğe bağlı)</span><input name="phone" type="tel" defaultValue={p.phone ?? ""} placeholder="905551234567" /></label><label><input type="checkbox" name="active" defaultChecked={p.active} /> Hesap aktif</label><button className="adminPrimary">Kaydet</button><button type="button" onClick={() => setEditingParentId(null)}>Vazgeç</button></form> : resettingPasswordId === p.id ? <form onSubmit={e => onResetPassword(e, p.id)}><label>Yeni şifre<input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" autoFocus /></label><button className="adminPrimary">Şifreyi kaydet</button><button type="button" onClick={() => setResettingPasswordId(null)}>Vazgeç</button></form> : <><div><b>{p.student_name}</b><span>{p.parent_name} · /veli/{p.slug}{p.phone && ` · ${p.phone}`}{!p.active && " · pasif"}</span></div><button onClick={() => setEditingParentId(p.id)}>Düzenle</button><button onClick={() => setResettingPasswordId(p.id)}>Şifre sıfırla</button><button onClick={() => onRemove("parent", p.id)}>Sil</button></>}</article>)}</div></div>
  </section>;
}
