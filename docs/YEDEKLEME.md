# Yedekleme ve geri yükleme

Kids Academy'nin bütün verisi Supabase'te durur: veli hesapları, deneme sonuçları, duyurular,
etkinlikler, yönetici hesapları ve etkinlik fotoğrafları. Kod GitHub'da olduğu için kaybolmaz;
kaybolabilecek olan **veridir**. Bu belge verinin nasıl yedekleneceğini ve geri yükleneceğini anlatır.

## Supabase'in kendi yedekleri

| Plan | Otomatik yedek | Not |
|---|---|---|
| Free | Yok | 7 gün hiç kullanılmayan proje **duraklatılır**; aşağıdaki aylık yedek bu yüzden var |
| Pro | Günlük, 7 gün geriye | Panelden tek tıkla geri yüklenir |
| Pro + PITR eklentisi | Saniye hassasiyetinde | Ek ücretli |

Kurum ücretli bir müşteriye dönüşürse Pro plana geçmek en kolay güvencedir. Pro planda bile
aşağıdaki aylık yedek önemlidir: yanlışlıkla silinen bir kaydı fark etmek bazen 7 günden uzun sürer.

## Otomatik aylık yedek

Her ayın 1'inde gizli `ahmetkurtbm/yedekler` deposundaki GitHub Actions iş akışı bu projenin bütün
tablolarını ve fotoğraflarını indirir, AES-256 ile şifreli bir 7z arşivine koyar ve 90 gün saklar.
Kimsenin bir şey yapması gerekmez; başarısız olursa GitHub e-postayla haber verir. Yedeği indirme
ve açma adımları o deponun README dosyasında.

Kod açık depoda, yedek gizli depoda ve şifreli durur; çocuk verisi açık depoya hiç yazılmaz.

## Elle yedek alma (gerektiğinde)

Büyük bir değişiklikten önce ya da aylık yedeği beklemeden almak için:

```bash
npm run backup
```

Komut `.env` dosyasındaki bağlantı bilgilerini kullanır ve `backups/<tarih_saat>/` klasörüne şunları yazar:

- Her tablo için bir JSON dosyası (`parent_accounts.json`, `exams.json`, `exam_subjects.json`, `events.json`, `announcements.json`, `admin_users.json`)
- `event-images/` klasöründe bütün etkinlik ve duyuru fotoğrafları
- `ozet.json`: hangi tablodan kaç kayıt alındığı

Giriş denemesi kayıtları (`login_attempts`) yedeklenmez; 90 gün sonra zaten silinirler.

### Yedeği nerede saklamalı

- **GitHub'a asla yüklemeyin.** `backups/` klasörü `.gitignore` içinde, yanlışlıkla gitmez.
- Yedek çocuklara ait kişisel veri içerir. Şifreli bir diske ya da kurumun kendi bulut hesabına kopyalayın.
- Proje klasörü OneDrive içindeyse `backups/` klasörü de OneDrive'a eşitlenir. Bu, kişisel hesabınızda kurum verisi tutmak demektir; yedeği oradan taşımanız daha doğru olur.
- İşi biten elle yedeği silin; düzenli yedek zaten otomatik alınıyor.

## Geri yükleme

### Tek bir kaydı geri getirmek (en sık durum)

Örneğin yanlışlıkla silinen bir deneme:

1. Son yedekteki `exams.json` dosyasını açın, silinen kaydı bulun (`id`, `title`, `exam_date`).
2. Supabase → Table Editor → `exams` → **Insert row** ile kaydı aynı değerlerle ekleyin.
3. O denemenin ders satırlarını `exam_subjects.json` içinde `exam_id` ile bulup aynı şekilde ekleyin.

Veli silindiyse ona bağlı denemeler ve ders satırları da silinmiştir (veritabanı zinciri böyle
kurulu). Önce `parent_accounts`, sonra `exams`, en son `exam_subjects` geri eklenir.

### Bütün veritabanını geri yüklemek (proje silindi ya da bozuldu)

1. Yeni bir Supabase projesi açın.
2. SQL Editor'da `supabase/schema.sql` dosyasının tamamını çalıştırın.
3. Table Editor'da her tabloya sırasıyla JSON yedeğini içe aktarın: `parent_accounts` → `exams` →
   `exam_subjects` → `events` → `announcements` → `admin_users`. (JSON'u CSV'ye çevirmek gerekirse
   bunu bir tablo programıyla yapabilirsiniz.)
4. Storage → `event-images` kovasına `backups/<tarih>/event-images/` içindeki dosyaları yükleyin.
5. Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` değerlerini yeni projeninkilerle
   değiştirin ve **Redeploy** edin.

Geri yüklemeyi gerçek bir sorun yaşanmadan önce bir kez deneme projesinde denemek, o gün
geldiğinde paniği önler.

## Saklama süreleri (KVKK metnindeki sözler)

`/kvkk` sayfası şu süreleri vaat ediyor; bunları uygulamak kurumun sorumluluğundadır:

- **Giriş denemesi kayıtları:** 90 gün. Uygulama her girişte eski kayıtları kendisi siler.
- **Ayrılan öğrencinin verisi:** ilişki bittikten sonra en fazla 2 yıl. Yılda bir kez veli
  listesini gözden geçirip 2 yılı dolan pasif hesapları panelden silin.
