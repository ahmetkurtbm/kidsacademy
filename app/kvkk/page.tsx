import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Kids Academy",
  description: "Kids Academy'nin kişisel verileri hangi amaçla işlediği, kimlerle paylaştığı ve haklarınız.",
};

// Veri sorumlusunun resmî bilgileri. Unvan ve vergi/MERSİS bilgisi kurumun
// belgelerindekiyle aynı yazılmalı; metin yayından önce bir hukukçuya okutulmalı.
const CONTROLLER = {
  name: "Kids Academy",
  address: "Raufbey Mahallesi, 9552 Sokak No:18/B, Osmaniye 80010",
  phone: "+90 552 415 01 66",
  updated: "29 Ekim 2026",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Veri sorumlusu",
    body: <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu {CONTROLLER.name}&apos;dir ({CONTROLLER.address}). Bu metin; velilerin, öğrencilerin, web sitesi ziyaretçilerinin ve kurum çalışanlarının kişisel verilerinin nasıl işlendiğini açıklar.</p>,
  },
  {
    title: "2. İşlenen kişisel veriler",
    body: <ul>
      <li><b>Kimlik ve iletişim:</b> veli adı soyadı, öğrenci adı soyadı, veli telefon numarası.</li>
      <li><b>Eğitim bilgileri:</b> deneme sınavı puanları; ders bazında doğru, yanlış ve boş sayıları; çalışılması önerilen konular ve öğretmen notları.</li>
      <li><b>Görsel kayıtlar:</b> etkinliklerde çekilen ve öğrencinin yer alabileceği fotoğraflar.</li>
      <li><b>Hesap ve güvenlik bilgileri:</b> veli paneli kullanıcı adı, şifrenin geri çevrilemez özeti (şifrenin kendisi saklanmaz), giriş denemelerinin IP adresi ve zamanı.</li>
      <li><b>Çalışan bilgileri:</b> yönetim paneli kullanan personelin adı soyadı, kullanıcı adı ve son giriş zamanı.</li>
    </ul>,
  },
  {
    title: "3. İşleme amaçları ve hukuki sebepler",
    body: <ul>
      <li>Kayıt, eğitim hizmetinin yürütülmesi ve öğrencinin gelişiminin veliyle paylaşılması: <i>sözleşmenin kurulması ve ifası</i> (KVKK m. 5/2-c).</li>
      <li>Deneme sonucu ve etkinlik bildirimlerinin WhatsApp üzerinden veliye iletilmesi: <i>sözleşmenin ifası</i> ve <i>meşru menfaat</i> (m. 5/2-c, f).</li>
      <li>Hesap güvenliği, yetkisiz girişlerin engellenmesi ve hataların giderilmesi: <i>meşru menfaat</i> (m. 5/2-f).</li>
      <li>Yasal yükümlülüklerin yerine getirilmesi ve resmî makamların taleplerine cevap verilmesi: <i>hukuki yükümlülük</i> (m. 5/2-ç).</li>
      <li>Öğrencinin yer aldığı fotoğrafların web sitesinde veya sosyal medyada herkese açık paylaşılması: yalnızca velinin <i>açık rızasıyla</i> (m. 5/1). Rıza vermemek eğitim hizmetini etkilemez ve her zaman geri alınabilir.</li>
    </ul>,
  },
  {
    title: "4. Verilerin aktarıldığı taraflar",
    body: <>
      <p>Kişisel veriler satılmaz ve reklam amacıyla kullanılmaz. Hizmetin çalışması için aşağıdaki hizmet sağlayıcılardan yararlanılır:</p>
      <ul>
        <li><b>Supabase:</b> veritabanı ve fotoğraf depolama.</li>
        <li><b>Vercel:</b> web sitesinin barındırılması.</li>
        <li><b>GitHub:</b> şifrelenmiş aylık veritabanı yedeklerinin saklanması.</li>
        <li><b>WhatsApp (Meta):</b> bilgi formu ve bildirim mesajları. Mesajlar sizin ya da kurumun WhatsApp hesabından gönderilir.</li>
      </ul>
      <p>Bu sağlayıcıların sunucuları yurt dışında bulunabilir. Yurt dışına aktarım KVKK m. 9&apos;daki güvencelere uygun olarak yapılır. Kanunen yetkili kamu kurumlarına yalnızca talep halinde ve gerektiği ölçüde bilgi verilir.</p>
    </>,
  },
  {
    title: "5. Toplama yöntemi",
    body: <p>Veriler kayıt sırasında veliden, eğitim süresince öğretmenlerden ve yönetim paneline girilen bilgilerden elektronik ortamda toplanır. Web sitesindeki bilgi formu verileri sunucularımıza kaydetmez; yazdıklarınız WhatsApp&apos;ta hazır bir mesaja dönüştürülür ve yalnızca siz gönderirseniz bize ulaşır.</p>,
  },
  {
    title: "6. Saklama süresi",
    body: <ul>
      <li>Veli hesabı ve deneme sonuçları, öğrencinin kurumla ilişkisi sürdüğü müddetçe ve sona ermesinden itibaren en fazla 2 yıl saklanır; ardından silinir veya anonim hale getirilir.</li>
      <li>Giriş denemesi kayıtları en fazla 90 gün saklanır.</li>
      <li>Kanunen daha uzun saklanması gereken kayıtlar bu süre boyunca tutulur.</li>
    </ul>,
  },
  {
    title: "7. Güvenlik",
    body: <p>Veriler yalnızca yetkili personelin kişisel hesabıyla erişebildiği yönetim panelinde tutulur. Her veli yalnızca kendi çocuğunun sonuçlarını görür. Şifreler geri çevrilemez biçimde saklanır, art arda hatalı girişler geçici olarak engellenir ve veritabanı düzenli olarak yedeklenir.</p>,
  },
  {
    title: "8. Haklarınız",
    body: <>
      <p>KVKK m. 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, işleme amacını ve aktarılan tarafları öğrenme, eksik ya da yanlış verilerin düzeltilmesini, silinmesini veya yok edilmesini isteme, bunların aktarıldığı taraflara bildirilmesini isteme, otomatik analiz sonucu aleyhinize bir sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz.</p>
      <p>Başvurunuzu kimliğinizi doğrulayan bilgilerle birlikte yazılı olarak {CONTROLLER.address} adresine iletebilir veya kurumumuzla {CONTROLLER.phone} numarasından iletişime geçebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz sonuçlandırılır.</p>
    </>,
  },
];

export default function KvkkPage() {
  return <div className="ka ka-legal">
    <header className="ka-wrap ka-legal-head">
      <Link className="ka-brand" href="/"><img src="/kids-academy-logo.jpeg" alt="" width={44} height={44} /><span><b>Kids Academy</b></span></Link>
      <Link href="/">← Ana sayfaya dön</Link>
    </header>
    <main className="ka-wrap ka-legal-body">
      <h1>Kişisel Verilerin Korunması Aydınlatma Metni</h1>
      <p className="ka-legal-updated">Son güncelleme: {CONTROLLER.updated}</p>
      {sections.map((s) => <section key={s.title}><h2>{s.title}</h2>{s.body}</section>)}
    </main>
  </div>;
}
