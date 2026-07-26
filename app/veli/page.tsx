"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ParentLanding() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function go(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const raw = String(form.get("slug") || "").trim();
    const slug = raw.replace(/^https?:\/\/[^/]+\/veli\//i, "").replace(/^\/?veli\//i, "").replace(/^\/+|\/+$/g, "").toLowerCase();
    const response = await fetch("/api/veli/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, password: form.get("password") }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Giriş yapılamadı.");
    router.push(`/veli/${slug}`);
  }
  return <main className="portalCenter parentWelcome"><form className="loginCard" onSubmit={go}><Link className="portalLogo" href="/">KA <b>Kids Academy</b></Link><span>VELİ SONUÇ SİSTEMİ</span><h1>Gelişimi birlikte izleyelim.</h1><p>Kurumumuzun verdiği kullanıcı adını ve şifrenizi girin.</p><label>Kullanıcı adı<input name="slug" required placeholder="Örn. ahmetece" autoFocus /></label><label>Şifre<input name="password" type="password" required placeholder="Veli şifreniz" /></label><button>Sonuçlarımı görüntüle →</button>{error&&<div className="formMessage error">{error}</div>}<Link className="backHome" href="/">← Ana sayfaya dön</Link></form></main>;
}
