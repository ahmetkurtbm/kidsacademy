# Sık karşılaşılan sorunlar ve çözümleri

Kurumdan bir sorun geldiğinde önce buraya bakın. Her başlık: belirti → büyük olasılıkla neden → ne yapılır.

## Giriş sorunları

### Yönetici şifresini unuttu

- **Personel:** Kurum sahibi panelde **Kullanıcılar → Şifre sıfırla** ile yeni şifre verir.
- **Kurum sahibi:** Giriş ekranında kullanıcı adını boş bırakıp kurtarma şifresiyle (`ADMIN_PASSWORD`) girer, **Kullanıcılar** bölümünden kendi hesabının şifresini sıfırlar.
- **Kurtarma şifresi de bilinmiyor:** Vercel → proje → Settings → Environment Variables → `ADMIN_PASSWORD` değerine bakılır ya da değiştirilir. Değiştirdikten sonra Deployments → son sürüm → **Redeploy** şarttır; yoksa eski şifre geçerli kalır.

### Veli şifresini ya da kullanıcı adını unuttu

Panel → **Veli Hesapları** → ilgili veli → **Şifre sıfırla**. Kullanıcı adı listede `/veli/...` olarak görünür.
Velinin giriş ekranındaki WhatsApp bağlantısı bu talepleri kuruma iletir.

### "Çok fazla başarısız deneme" yazıyor

15 dakika içinde aynı hesaba 5, aynı ağdan 10 hatalı deneme yapılmış. 15 dakika beklemek yeterli.
Acilse Supabase → Table Editor → `login_attempts` tablosunda o hesabın son kayıtları silinebilir.

### "Kullanıcı adı veya şifre hatalı" ama şifre doğru

- Hesap **pasif** olabilir: kurum sahibi Kullanıcılar listesinde "pasif" etiketine bakar.
- Kullanıcı adının büyük/küçük harfi ve baştaki/sondaki boşluklar önemsizdir; harf hatası olup olmadığına Kullanıcılar listesinden bakılır.
- Kurtarma şifresi kişisel hesapta çalışmaz: kurtarma girişinde kullanıcı adı boş bırakılmalıdır.

### "Kişisel hesaplar henüz kurulmamış" yazıyor

`admin_users` tablosu yok. Supabase → SQL Editor'da `supabase/migrations/20261029_add_admin_users.sql` bir kez çalıştırılır.

### Giriş butonu uzun süre bekleyip hata veriyor

Uygulama veritabanına ulaşamıyor.

1. Supabase panelinde proje **Paused** görünüyorsa **Restore** ile açılır (Free planda 7 gün kullanılmayan proje duraklar).
2. Yerelde çalışırken oluyorsa `.env` dosyasındaki `NEXT_PUBLIC_SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` kontrol edilir.

## İçerik sorunları

### Eklenen duyuru veya etkinlik sitede görünmüyor

1. Panelde kaydın yanında **Taslak** yazıyorsa **Yayınla** denir.
2. Etkinlik "Veliyle paylaşım" seçilerek eklendiyse ana sayfada değil, o velinin panelinde görünür.
3. Ana sayfa en fazla 60 saniyede bir yenilenir; bir dakika bekleyip sayfayı yenileyin.

### Fotoğraf yüklenmiyor

Yalnızca JPG, PNG ve WEBP kabul edilir, en fazla 4 MB. Telefondan çekilen HEIC fotoğraflar önce
JPG'ye çevrilmeli (iPhone: Ayarlar → Kamera → Biçimler → En Uyumlu).

### Deneme kaydedilemiyor, satır kırmızı

Soru sayısı girilmiş ve doğru + yanlış + boş toplamı onu tutmuyor. Kırmızı satırdaki sayılar düzeltilir
ya da soru sayısı boş bırakılır.

### Velinin grafiği boş

O veliye henüz deneme girilmemiştir. Deneme başka bir öğrenciye kaydedilmiş olabilir; panelde
**Son denemeler** listesinde öğrenci adına bakılır, gerekirse **Düzenle** ile doğru öğrenci seçilir.

## Site sorunları

### Site hiç açılmıyor

1. vercel.com → proje → Deployments: son dağıtım **Error** ise bir önceki başarılı sürüme **Promote to Production** denir, sonra hata incelenir.
2. Supabase duraklatılmışsa ana sayfa açılır ama duyurular boş görünür, girişler çalışmaz.

### Ortam değişkenini değiştirdim ama bir şey değişmedi

Vercel'de ortam değişkeni değişikliği ancak **Redeploy** sonrası geçerli olur.

### Veri yanlışlıkla silindi

`docs/YEDEKLEME.md` → "Tek bir kaydı geri getirmek". Pro plandaysanız Supabase → Database → Backups'tan
o günün yedeğine dönülebilir (bütün veritabanı o güne döner, sonraki girişler kaybolur).

## KVKK talepleri

### Veli verilerinin silinmesini istiyor

Panel → Veli Hesapları → **Sil**. Velinin bütün denemeleri ve ona özel etkinlikler de silinir.
Talebe 30 gün içinde yazılı cevap verilmesi gerekir. Eski yedeklerde veri kalır; otomatik yedekler 90 gün
sonra kendiliğinden silindiği için bu süre sonunda temizlenir.

### Veli "hangi verimi tutuyorsunuz" diye soruyor

`/kvkk` sayfasındaki 2. madde listesi cevaptır. Velinin kendi kayıtları istenirse panelden veli
sayfası açılıp ekran görüntüsü ya da yazdırma ile verilebilir.
