"use client";

import { FormEvent } from "react";
import Link from "next/link";

export default function AdminLogin({ onSubmit, message }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; message: string }) {
  return <main className="portalCenter"><form className="loginCard" onSubmit={onSubmit}><Link className="portalLogo" href="/">KA <b>Kids Academy</b></Link><span>YÖNETİM PANELİ</span><h1>Hoş geldiniz.</h1><p>İçerikleri yönetmek için admin şifrenizi girin.</p><label>Admin şifresi<input name="password" type="password" required autoFocus /></label><button>Panele giriş yap →</button>{message && <div className="formMessage error">{message}</div>}</form></main>;
}
