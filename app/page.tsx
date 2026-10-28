import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  ChartLine,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  MapPin,
  Palette,
  Phone,
  Puzzle,
  ShieldCheck,
  Sigma,
  Sun,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ContactWhatsAppForm from "./components/contact-whatsapp-form";
import { getSupabaseAdmin } from "@/lib/supabase";

export const revalidate = 60;

type PublicEvent = { id: string; title: string; event_date: string; summary: string; details?: string | null; image_url?: string | null };
type PublicAnnouncement = { id: string; title: string; body: string; image_url?: string | null; created_at: string };

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const { data, error } = await getSupabaseAdmin().from("events").select("id,title,event_date,summary,details,image_url").eq("published", true).eq("share_scope", "site").order("event_date", { ascending: false }).order("created_at", { ascending: false }).limit(6);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

async function getAnnouncements(): Promise<PublicAnnouncement[]> {
  try {
    const { data, error } = await getSupabaseAdmin().from("announcements").select("id,title,body,image_url,created_at").eq("published", true).order("created_at", { ascending: false }).limit(3);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

const PHONE = "+905524150166";
const PHONE_LABEL = "0552 415 01 66";
const ADDRESS = "Raufbey Mah. 9552 Sok. No:18/B, Osmaniye";
const MAPS = "https://maps.google.com/?q=Raufbey+Mahallesi+9552+Sokak+No+18B+Osmaniye+80010";

/** Programa özel hazır WhatsApp mesajı: veli tek dokunuşla doğru konuyla yazar. */
const whatsapp = (program?: string) =>
  `https://wa.me/905524150166?text=${encodeURIComponent(
    program
      ? `Merhaba Kids Academy, ${program} programı hakkında bilgi alabilir miyim?`
      : "Merhaba Kids Academy, programlarınız hakkında bilgi alabilir miyim?",
  )}`;

const WhatsAppIcon = () => <svg viewBox="0 0 32 32" aria-hidden="true" className="ka-wa"><path fill="currentColor" d="M16 3a12.7 12.7 0 0 0-11 19l-2 7 7.2-1.9A12.8 12.8 0 1 0 16 3Zm0 22.8c-2 0-3.8-.5-5.4-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A9.8 9.8 0 1 1 16 25.8Zm5.4-7.3c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-1.8-.9-3-1.7-4-3.7-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2 1 3.1 1 4.2.8 1.3-.2 2.3-1 2.6-2 .3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.6-.3Z"/></svg>;

const programs: { name: string; text: string; icon: LucideIcon; tone: string }[] = [
  { name: "Ödev Takip", text: "Okul sonrası planlı çalışma, günlük ödev kontrolü ve düzenli çalışma alışkanlığı.", icon: ClipboardList, tone: "blue" },
  { name: "Konu Anlatımı", text: "Eksik kazanımlara yönelik anlaşılır anlatım, tekrar, pekiştirme ve soru çözümü.", icon: Sigma, tone: "coral" },
  { name: "Okul Öncesi Etkinlik", text: "Oyun, sanat ve keşifle yaşa uygun gelişim çalışmaları.", icon: Puzzle, tone: "yellow" },
  { name: "Yaz Okulu", text: "Akademik destek, hareket ve eğlenceli atölyeler bir arada.", icon: Sun, tone: "green" },
  { name: "Atölye & Etkinlikler", text: "Sanat, bilim ve üretim atölyeleriyle merak ve sosyal gelişim.", icon: Palette, tone: "purple" },
];

const benefits: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Planlı çalışma", text: "Her gün aynı düzende ödev ve tekrar; çocuk kendi çalışma alışkanlığını kurar.", icon: Target },
  { title: "Bireysel takip", text: "Eksik konular tek tek belirlenir, çalışma buna göre şekillenir.", icon: HeartHandshake },
  { title: "Aktif öğrenme", text: "Akademik çalışma hareket, sanat ve atölyelerle dengelenir.", icon: BookOpenCheck },
  { title: "Veli paneli", text: "Deneme sonuçları, ders analizi ve çalışılacak konular size özel sayfada.", icon: ChartLine },
];

const weekly = [
  ["Hafta içi", "Ödev Takip", "Okul sonrası planlı çalışma ve ödev kontrolü"],
  ["Hafta içi", "Konu Anlatımı", "İhtiyaca göre tekrar, pekiştirme ve soru çözümü"],
  ["Belirlenen günler", "Okul Öncesi Etkinlik", "Oyun, sanat ve yaşa uygun gelişim çalışmaları"],
  ["Hafta sonu", "Atölye & Etkinlik", "Sanat, bilim, üretim ve sosyal etkinlikler"],
  ["Yaz dönemi", "Yaz Okulu", "Akademik destek, hareket ve eğlenceli atölyeler"],
];

const faqs = [
  ["Nasıl kayıt olabilirim?", "Aşağıdaki formu doldurmanız ya da WhatsApp'tan yazmanız yeterli. Çocuğunuzun ihtiyacını konuşup uygun programı birlikte belirliyoruz."],
  ["Hangi programlar var?", "Ödev takip, konu anlatımı, okul öncesi etkinlik, yaz okulu ve atölye & etkinlikler. Programlar çocuğun ihtiyacına göre birlikte planlanır."],
  ["Çocuğumun gelişimini nasıl takip ederim?", "Size özel veli paneli hesabı açılır. Deneme sonuçlarını, ders ders analizi, gelişim grafiğini ve öğretmenin önerdiği çalışma konularını buradan görürsünüz."],
  ["Etkinlik ve duyuruları nereden öğrenirim?", "Duyurular ve etkinlikler bu sayfada ve Instagram hesabımızda paylaşılır; yalnızca sizi ilgilendiren etkinlikler veli panelinize gelir."],
  ["Merkez nerede?", "Raufbey Mahallesi, 9552 Sokak No:18/B, Osmaniye. Haritada açmak için iletişim bölümündeki adrese dokunabilirsiniz."],
];

const formatDate = (value: string) => new Date(value).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

export default async function Home() {
  const [events, announcements] = await Promise.all([getEvents(), getAnnouncements()]);

  return <div className="ka">
    <div className="ka-util">
      <div className="ka-wrap ka-util-in">
        <a href={`tel:${PHONE}`}><Phone aria-hidden size={15} /> {PHONE_LABEL}</a>
        <a href={MAPS} target="_blank" rel="noreferrer" className="ka-hide-sm"><MapPin aria-hidden size={15} /> {ADDRESS}</a>
        <Link href="/veli" className="ka-util-login">Veli girişi</Link>
      </div>
    </div>

    <header className="ka-header">
      <div className="ka-wrap ka-header-in">
        <a href="#" className="ka-brand" aria-label="Kids Academy ana sayfa">
          <img src="/kids-academy-logo.jpeg" alt="" width={48} height={48} />
          <span><b>Kids Academy</b><small>Eğitim & Aktivite Merkezi</small></span>
        </a>
        <nav className="ka-nav" aria-label="Ana menü">
          <a href="#programlar">Programlar</a>
          <a href="#haftalik">Haftalık akış</a>
          {(announcements.length > 0 || events.length > 0) && <a href="#duyurular">Duyurular</a>}
          <a href="#veli-paneli">Veli paneli</a>
          <a href="#sss">SSS</a>
          <a href="#iletisim">İletişim</a>
        </nav>
        <a className="ka-btn ka-btn-wa ka-header-cta" href={whatsapp()} target="_blank" rel="noreferrer"><WhatsAppIcon /> Bilgi al</a>
      </div>
    </header>

    <main>
      <section className="ka-hero">
        <div className="ka-wrap ka-hero-in">
          <div className="ka-hero-copy">
            <h1>Öğrenirken güçlen, <span>keşfederken büyü.</span></h1>
            <p className="ka-lead">Osmaniye&apos;de ödev takibi, konu anlatımı, okul öncesi etkinlikler, yaz okulu ve atölyelerle çocuğunuzun hem akademik hem sosyal gelişimini destekliyoruz.</p>
            <div className="ka-actions">
              <a className="ka-btn ka-btn-wa ka-btn-lg" href={whatsapp()} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp&apos;tan bilgi al</a>
              <a className="ka-btn ka-btn-ghost ka-btn-lg" href={`tel:${PHONE}`}><Phone aria-hidden size={18} /> Hemen ara</a>
            </div>
            <ul className="ka-checks">
              {["Ödev takibi", "Konu anlatımı", "Okul öncesi", "Yaz okulu & atölye"].map((item) => <li key={item}><CheckCircle2 aria-hidden size={18} /> {item}</li>)}
            </ul>
          </div>
          <div className="ka-hero-media">
            <img src="/hero-academy.png" alt="Kids Academy'de çocuklar masa başında ödev yapıyor" width={1717} height={916} />
            <div className="ka-hero-badge">
              <ShieldCheck aria-hidden size={22} />
              <span><b>Size özel veli paneli</b>Deneme sonuçları ve ders analizi</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ka-benefits" aria-label="Neden Kids Academy">
        <div className="ka-wrap ka-benefit-grid">
          {benefits.map(({ title, text, icon: Icon }) => <article key={title} className="ka-benefit">
            <span className="ka-icon"><Icon aria-hidden size={22} /></span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>)}
        </div>
      </section>

      <section id="programlar" className="ka-section">
        <div className="ka-wrap">
          <div className="ka-head">
            <h2>Programlarımız</h2>
            <p>Akademik desteği hareket ve üretimle birleştiren, çocuğun ihtiyacına göre şekillenen beş program.</p>
          </div>
          <div className="ka-program-grid">
            {programs.map(({ name, text, icon: Icon, tone }) => <article key={name} className={`ka-program ka-tone-${tone}`}>
              <span className="ka-icon ka-icon-lg"><Icon aria-hidden size={26} /></span>
              <h3>{name}</h3>
              <p>{text}</p>
              <a href={whatsapp(name)} target="_blank" rel="noreferrer" className="ka-link">Bu program için bilgi al <ArrowRight aria-hidden size={16} /></a>
            </article>)}
          </div>
        </div>
      </section>

      {(announcements.length > 0 || events.length > 0) && <section id="duyurular" className="ka-section ka-soft">
        <div className="ka-wrap">
          <div className="ka-head">
            <h2>Duyurular ve etkinlikler</h2>
            <p>Merkezimizden en yeni haberler, atölyeler ve çocukların ürettiği güzel anlar.</p>
          </div>
          {announcements.length > 0 && <div className="ka-news">
            {announcements.map((item) => <article key={item.id} className="ka-card ka-news-item">
              {item.image_url && <img src={item.image_url} alt="" loading="lazy" />}
              <div>
                <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>)}
          </div>}
          {events.length > 0 && <div className="ka-events">
            {events.map((event) => <article key={event.id} className="ka-card ka-event">
              {event.image_url ? <img src={event.image_url} alt="" loading="lazy" /> : <div className="ka-event-fallback"><CalendarDays aria-hidden size={30} /></div>}
              <div className="ka-event-body">
                <time dateTime={event.event_date}>{formatDate(`${event.event_date}T12:00:00`)}</time>
                <h3>{event.title}</h3>
                <p>{event.summary}</p>
              </div>
            </article>)}
          </div>}
        </div>
      </section>}

      <section id="haftalik" className="ka-section">
        <div className="ka-wrap ka-split">
          <div className="ka-head ka-head-left">
            <h2>Haftalık akış</h2>
            <p>Program akışımız düzenli devam eder; özel atölye ve etkinlik duyuruları ayrıca paylaşılır.</p>
            <a className="ka-btn ka-btn-primary" href={whatsapp()} target="_blank" rel="noreferrer">Uygun günleri sorun <ArrowRight aria-hidden size={18} /></a>
          </div>
          <ol className="ka-week">
            {weekly.map(([when, name, text]) => <li key={name}>
              <span className="ka-week-when">{when}</span>
              <div><b>{name}</b><p>{text}</p></div>
            </li>)}
          </ol>
        </div>
      </section>

      <section id="veli-paneli" className="ka-section ka-panel">
        <div className="ka-wrap ka-split">
          <div className="ka-panel-media">
            <img src="/hero.png" alt="Kids Academy çalışma alanı" loading="lazy" />
          </div>
          <div>
            <h2>Gelişimi birlikte izleyelim</h2>
            <p className="ka-lead">Her veliye özel bir panel açıyoruz. Çocuğunuzun deneme sonuçlarını yalnızca siz görürsünüz.</p>
            <ul className="ka-feature-list">
              <li><ChartLine aria-hidden size={20} /> Deneme puanları ve gelişim grafiği</li>
              <li><BookOpenCheck aria-hidden size={20} /> Ders ders doğru, yanlış ve boş analizi</li>
              <li><Target aria-hidden size={20} /> Öğretmenin önerdiği çalışma konuları</li>
              <li><CalendarDays aria-hidden size={20} /> Size özel etkinlik bildirimleri</li>
            </ul>
            <Link className="ka-btn ka-btn-primary" href="/veli">Veli paneline gir <ArrowRight aria-hidden size={18} /></Link>
          </div>
        </div>
      </section>

      <section id="sss" className="ka-section ka-soft">
        <div className="ka-wrap ka-faq-wrap">
          <div className="ka-head ka-head-left">
            <h2>Sık sorulan sorular</h2>
            <p>Aradığınız cevap yoksa bize yazın, hemen yanıtlayalım.</p>
          </div>
          <div className="ka-faq">
            {faqs.map(([q, a]) => <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>)}
          </div>
        </div>
      </section>

      <section id="iletisim" className="ka-section">
        <div className="ka-wrap ka-contact">
          <div>
            <h2>Çocuğunuz için doğru programı bulalım</h2>
            <p className="ka-lead">Formu doldurun; bilgileriniz WhatsApp&apos;ta hazır bir mesaja dönüşsün ve doğrudan bize ulaşsın.</p>
            <ul className="ka-contact-list">
              <li><a href={`tel:${PHONE}`}><span className="ka-icon"><Phone aria-hidden size={20} /></span><span><small>Telefon / WhatsApp</small>{PHONE_LABEL}</span></a></li>
              <li><a href={MAPS} target="_blank" rel="noreferrer"><span className="ka-icon"><MapPin aria-hidden size={20} /></span><span><small>Adres</small>Raufbey Mahallesi, 9552 Sokak No:18/B, Osmaniye 80010</span></a></li>
            </ul>
          </div>
          <div className="ka-card ka-form-card">
            <h3>Bilgi formu</h3>
            <ContactWhatsAppForm />
          </div>
        </div>
      </section>
    </main>

    <footer className="ka-footer">
      <div className="ka-wrap ka-footer-in">
        <div className="ka-brand ka-brand-footer">
          <img src="/kids-academy-logo.jpeg" alt="" width={44} height={44} />
          <span><b>Kids Academy</b><small>Öğren, hareket et, keşfet.</small></span>
        </div>
        <nav aria-label="Alt menü">
          <a href="#programlar">Programlar</a>
          <a href="#haftalik">Haftalık akış</a>
          <a href="#sss">SSS</a>
          <a href="https://www.instagram.com/kidsacademy80/" target="_blank" rel="noreferrer">Instagram</a>
          <Link href="/veli">Veli girişi</Link>
          <Link href="/admin">Yönetim</Link>
        </nav>
        <p>© {new Date().getFullYear()} Kids Academy · {ADDRESS}</p>
      </div>
    </footer>

    {/* Telefonda her an erişilebilen iki eylem: ara ve WhatsApp. */}
    <div className="ka-mobilebar">
      <a href={`tel:${PHONE}`} className="ka-btn ka-btn-ghost"><Phone aria-hidden size={18} /> Ara</a>
      <a href={whatsapp()} target="_blank" rel="noreferrer" className="ka-btn ka-btn-wa"><WhatsAppIcon /> WhatsApp</a>
    </div>
  </div>;
}
