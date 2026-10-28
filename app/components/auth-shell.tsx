import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Veli ve yönetim giriş ekranlarının ortak kabuğu: solda marka paneli,
 * sağda form kartı. Ana sayfanın (home-v3) renk ve yazı diliyle aynı.
 */
export default function AuthShell({
  badge,
  title,
  text,
  points,
  children,
}: {
  badge: string;
  title: string;
  text: string;
  points: string[];
  children: ReactNode;
}) {
  return <main className="ka-auth">
    <section className="ka-auth-brand">
      <Link href="/" className="ka-auth-logo" aria-label="Kids Academy ana sayfa">
        <img src="/kids-academy-logo.jpeg" alt="" width={52} height={52} />
        <span><b>Kids Academy</b><small>Eğitim & Aktivite Merkezi</small></span>
      </Link>
      <div className="ka-auth-pitch">
        <span className="ka-auth-badge">{badge}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <ul>
          {points.map((point) => <li key={point}><CheckCircle2 aria-hidden size={20} /> {point}</li>)}
        </ul>
      </div>
      <Link href="/" className="ka-auth-back">← Ana sayfaya dön</Link>
    </section>
    <section className="ka-auth-panel">
      {children}
    </section>
  </main>;
}
