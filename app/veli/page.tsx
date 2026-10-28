"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth-shell";

const HELP = `https://wa.me/905524150166?text=${encodeURIComponent("Merhaba Kids Academy, veli paneli kullanıcı adımı / şifremi öğrenmek istiyorum.")}`;

export default function ParentLanding() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const raw = String(form.get("slug") || "").trim();
    const slug = raw.replace(/^https?:\/\/[^/]+\/veli\//i, "").replace(/^\/?veli\//i, "").replace(/^\/+|\/+$/g, "").toLowerCase();
    try {
      const response = await fetch("/api/veli/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, password: form.get("password") }) });
      // Sunucu hatasında yanıt JSON olmayabilir; o durumda genel mesaj gösterilir.
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || "Giriş yapılamadı. Lütfen tekrar deneyin."); setBusy(false); return; }
      router.push(`/veli/${slug}`);
    } catch {
      setError("Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.");
      setBusy(false);
    }
  }

  return <AuthShell
    badge="Veli paneli"
    title="Gelişimi birlikte izleyelim."
    text="Çocuğunuzun deneme sonuçları yalnızca size özel bu panelde."
    points={["Deneme puanları ve gelişim grafiği", "Ders ders doğru, yanlış ve boş analizi", "Öğretmenin önerdiği çalışma konuları"]}
  >
    <form className="ka-auth-card" onSubmit={go}>
      <h2>Veli girişi</h2>
      <p>Kurumumuzun verdiği kullanıcı adını ve şifrenizi girin.</p>
      <label>Kullanıcı adı<input name="slug" required placeholder="Örn. ahmetece" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus /></label>
      <label>Şifre<input name="password" type="password" required placeholder="Veli şifreniz" autoComplete="current-password" /></label>
      {error && <div className="ka-auth-error" role="alert">{error}</div>}
      <button disabled={busy}>{busy ? "Giriş yapılıyor…" : "Sonuçlarımı görüntüle"}</button>
      <a className="ka-auth-help" href={HELP} target="_blank" rel="noreferrer">Kullanıcı adınızı veya şifrenizi mi unuttunuz? WhatsApp&apos;tan yazın</a>
    </form>
  </AuthShell>;
}
