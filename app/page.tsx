import Link from "next/link";
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

const Arrow = () => <span aria-hidden>↗</span>;
const WhatsAppIcon = () => <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3a12.7 12.7 0 0 0-11 19l-2 7 7.2-1.9A12.8 12.8 0 1 0 16 3Zm0 22.8c-2 0-3.8-.5-5.4-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A9.8 9.8 0 1 1 16 25.8Zm5.4-7.3c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-1.8-.9-3-1.7-4-3.7-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2 1 3.1 1 4.2.8 1.3-.2 2.3-1 2.6-2 .3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.6-.3Z"/></svg>;

const programs = [
  ["01", "✎", "Ödev Takip", "Düzenli çalışma alışkanlığı ve günlük ödev desteği", "coral"],
  ["02", "∑", "Konu Anlatımı", "Eksik kazanımlara yönelik anlaşılır akademik destek", "blue"],
  ["03", "★", "Okul Öncesi Etkinlik", "Oyun, keşif ve yaşa uygun gelişim çalışmaları", "yellow"],
  ["04", "☀", "Yaz Okulu", "Öğrenme, hareket ve eğlenceyi birleştiren yaz programı", "green"],
  ["05", "✦", "Atölye & Etkinlikler", "Üretmeyi, merakı ve sosyal gelişimi destekleyen buluşmalar", "purple"],
];

const weekly = [
  ["HAFTA İÇİ", "Ödev Takip", "Okul sonrası planlı çalışma ve ödev kontrolü"],
  ["HAFTA İÇİ", "Konu Anlatımı", "İhtiyaca göre tekrar, pekiştirme ve soru çözümü"],
  ["BELİRLENEN GÜNLER", "Okul Öncesi Etkinlik", "Oyun, sanat ve yaşa uygun gelişim çalışmaları"],
  ["HAFTA SONU", "Atölye & Etkinlik", "Sanat, bilim, üretim ve sosyal etkinlikler"],
  ["YAZ DÖNEMİ", "Yaz Okulu", "Akademik destek, hareket ve eğlenceli atölyeler"],
];

const stars = [
  ["1. SINIF", "Ece K.", "96", "Harika bir başlangıç!"],
  ["2. SINIF", "Mert A.", "94", "Azminle gurur duyuyoruz!"],
  ["3. SINIF", "Defne Y.", "92", "Muhteşem bir ilerleme!"],
  ["4. SINIF", "Arda D.", "90", "Tebrikler, böyle devam!"],
];

export default async function Home() {
  const [events, announcements] = await Promise.all([getEvents(), getAnnouncements()]);
  return <main className="homeV2">
    <div className="topline"><div className="toplineInner"><span>Kids Academy · Eğitim & Aktivite Merkezi</span><div className="topAuth"><Link href="/veli">Veli Girişi</Link><Link href="/admin">Admin Girişi</Link></div></div></div>
    <nav className="nav shell"><a className="logo brandLogo" href="#" aria-label="Kids Academy ana sayfa"><img src="/kids-academy-logo.jpeg" alt="Kids Academy logosu" /></a><div className="links"><a href="#duyurular">Duyurular</a><a href="#etkinlikler">Etkinlikler</a><a href="#programlar">Programlar</a><a href="#haftalik-program">Haftalık Program</a></div><a className="navCta" href="#iletisim">İletişime geç <Arrow /></a></nav>

    <section className="hero shell"><div className="heroCopy"><div className="eyebrow"><i>●</i> Osmaniye&apos;de akademik destek ve aktivite bir arada</div><h1>Öğrenirken güçlen,<br/><em>keşfederken büyü.</em></h1><p>Ödev takibi, konu anlatımı, okul öncesi etkinlikler, yaz okulu ve zengin atölyelerle çocukların hem akademik hem sosyal gelişimini destekliyoruz.</p><div className="heroActions"><a className="primary" href="#programlar">Programları incele <Arrow /></a><a className="secondary" href="#iletisim">Bize ulaşın</a></div><div className="serviceTags"><span>✓ Planlı çalışma</span><span>✓ Bireysel takip</span><span>✓ Aktif öğrenme</span></div></div><div className="heroVisual"><div className="heroImage academyHero" role="img" aria-label="Kids Academy ödev ve etkinlik alanı"/><div className="floatCard available"><span>✎</span><div><small>Akademik destek</small><b>Ödev & konu anlatımı</b></div></div><div className="floatCard note"><span>★</span><div><small>Aktif gelişim</small><b>Okul öncesi & atölye</b></div></div></div></section>

    {announcements.length>0&&<section id="duyurular" className="announcementsSection"><div className="shell"><div className="announcementLabel"><span>DUYURULAR</span><b>Güncel gelişmeler</b></div><div className="announcementStack">{announcements.map((item,index)=><article className={index===0?"announcementCard latestAnnouncement":"announcementCard"} key={item.id}><div className="announcementCopy"><small>{index===0?"SON DUYURU":"DUYURU"} · {new Date(item.created_at).toLocaleDateString("tr-TR")}</small><h2>{item.title}</h2><p>{item.body}</p></div>{item.image_url&&<img src={item.image_url} alt={`${item.title} duyurusu`} />}</article>)}</div></div></section>}

    {events.length>0&&<section id="etkinlikler" className="eventsSection upperEvents"><div className="shell"><div className="sectionHead"><div><span className="sectionNo">ETKİNLİKLER</span><h2>Academy&apos;de<br/><em>neler oluyor?</em></h2></div><p>En yeni etkinlikler, atölyeler ve çocukların ürettiği güzel anlar.</p></div><div className="eventsGrid">{events.map((event,index)=><article className={`eventCard ${index===0?"featuredEvent":""}`} key={event.id}><div className="eventImage">{event.image_url?<img src={event.image_url} alt={`${event.title} etkinliği`} />:<div className="eventImageFallback">✦</div>}<span>{index===0?"SON ETKİNLİK":"ETKİNLİK"}</span></div><div className="eventContent"><time>{new Date(`${event.event_date}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</time><h3>{event.title}</h3><p>{event.summary}</p>{index===0&&event.details&&<small>{event.details}</small>}</div></article>)}</div></div></section>}

    <section id="hakkimizda" className="manifesto shell"><div><span className="sectionNo">01 — YAKLAŞIMIMIZ</span><h2>Her çocuk için<br/><em>doğru destek.</em></h2></div><div className="manifestoText"><p>Kids Academy, okul başarısını yalnızca ödev tamamlamak olarak görmez. Çocuğun konuyu anlamasını, kendi çalışma düzenini kurmasını ve özgüven kazanmasını önemser.</p><p>Akademik çalışmaları hareket, üretim ve sosyal etkinliklerle dengeler; çocukların potansiyellerini güvenli ve motive edici bir ortamda ortaya çıkarmalarına yardımcı olur.</p></div></section>

    <section id="programlar" className="programSection"><div className="shell"><div className="sectionHead"><div><span className="sectionNo">02 — PROGRAMLAR</span><h2>Başarıya giden<br/><em>beş güçlü adım.</em></h2></div><p>Akademik desteği hareket ve üretimle birleştiren, çocuğun ihtiyacına göre şekillenen programlar.</p></div><div className="programGrid programGridFive">{programs.map(p=><article className={`program ${p[4]}`} key={p[2]}><span>{p[0]}</span><div className="programIcon">{p[1]}</div><h3>{p[2]}</h3><p>{p[3]}</p><a href="#iletisim">Bilgi iste <Arrow /></a></article>)}</div></div></section>

    <section id="haftalik-program" className="daySection weeklySection"><div className="shell"><span className="sectionNo light">04 — HAFTALIK PROGRAM</span><h2>Her hafta düzenli,<br/><em>her gün amaçlı.</em></h2><p className="weeklyLead">Program akışımız düzenli devam eder; özel atölye ve etkinlik duyuruları ayrıca paylaşılır.</p><div className="timeline weeklyTimeline">{weekly.map((x,i)=><div className="time" key={x[1]}><span>{String(i+1).padStart(2,"0")}</span><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></div></section>

    <section id="tur" className="tour shell"><div className="sectionHead"><div><span className="sectionNo">04 — KURUM TURU</span><h2>Çalışmak, hareket etmek<br/>ve üretmek için <em>alan.</em></h2></div><p>Çocukların odaklanabileceği, rahatça hareket edebileceği ve yeni şeyler deneyebileceği ferah bir merkez.</p></div><div className="tourGrid"><div className="tourPhoto mainPhoto academyTour"><span>DERS & ÖDEV ALANI <b>↗</b></span></div><div className="tourPhoto classPhoto academyTour"><span>ATÖLYE ALANI <b>↗</b></span></div><div className="tourPhoto readingPhoto academyTour"><span>OKUL ÖNCESİ ETKİNLİK ALANI <b>↗</b></span></div></div></section>

    <section id="basarilar" className="achievementSection"><div className="shell"><div className="sectionHead"><div><span className="sectionNo">05 — HAFTANIN YILDIZLARI</span><h2>Emek verildi,<br/><em>başarı geldi.</em></h2></div><p>Her sınıfta gösterdiği gelişimle öne çıkan öğrencilerimizi kutluyoruz.</p></div><div className="starGrid">{stars.map((s,i)=><article className={`starCard star${i+1}`} key={s[0]}><span>{s[0]}</span><div className="starName"><i>★</i><b>{s[1]}</b></div><strong>{s[2]}<small> PUAN</small></strong><p>{s[3]}</p></article>)}</div><p className="privacyNote">* Kartlar örnek gösterimdir. Gerçek öğrenci bilgileri yalnızca veli onayıyla yayınlanmalıdır.</p><div className="resultsCta"><div><b>Detaylı deneme sonuçları veli panelinde</b><span>Ders analizi, çalışılacak konular ve gelişim grafiği.</span></div><Link className="primary" href="/veli">Veli paneline gir <Arrow /></Link></div></div></section>

    <section id="iletisim" className="contactSection"><div className="shell contactInner"><div className="contactCopy"><span className="sectionNo light">06 — İLETİŞİM</span><h2>Çocuğunuz için<br/><em>doğru programı bulalım.</em></h2><p>Bilgileri doldurun; WhatsApp&apos;ta size özel hazır mesaj oluşsun ve doğrudan bize ulaşsın.</p><div className="contactFacts"><a href="https://maps.google.com/?q=Raufbey+Mahallesi+9552+Sokak+No+18B+Osmaniye+80010" target="_blank" rel="noreferrer"><span>⌖</span><div><small>ADRES</small><b>Raufbey Mahallesi, 9552 Sokak No:18/B<br/>Osmaniye 80010</b></div></a><a href="tel:+905524150166"><span>☎</span><div><small>TELEFON / WHATSAPP</small><b>+90 552 415 01 66</b></div></a></div></div><ContactWhatsAppForm /></div></section>

    <footer><div className="shell footerTop"><a className="logo brandLogo footerBrandLogo" href="#" aria-label="Kids Academy ana sayfa"><img src="/kids-academy-logo.jpeg" alt="Kids Academy logosu" /></a><div><small>HIZLI MENÜ</small><a href="#programlar">Programlar</a><a href="#haftalik-program">Haftalık Program</a><a href="#basarilar">Başarılar</a></div><div><small>İLETİŞİM</small><p>Raufbey Mah. 9552 Sok. No:18/B</p><p>Osmaniye 80010</p><a href="tel:+905524150166">+90 552 415 01 66</a></div><div><small>SOSYAL</small><a href="https://www.instagram.com/kidsacademy80/" target="_blank" rel="noreferrer">Instagram ↗</a><Link href="/veli">Veli Girişi ↗</Link></div></div><div className="shell footerBottom"><span>© 2026 Kids Academy</span><span>Öğren, hareket et, keşfet.</span></div></footer>

    <a className="whatsapp" href="https://wa.me/905524150166?text=Merhaba%2C%20Kids%20Academy%20programlar%C4%B1%20hakk%C4%B1nda%20bilgi%20alabilir%20miyim%3F" target="_blank" rel="noreferrer" aria-label="WhatsApp ile bilgi alın"><b>WhatsApp</b><span><WhatsAppIcon/></span></a>
  </main>;
}
