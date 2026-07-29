# Kids Academy

Bir eğitim kurumu için geliştirilmiş, yönetici tarafından yürütülen bir **admin paneli** ile velilerin çocuklarının deneme/sınav sonuçlarını takip edebildiği bir **veli portalı**ndan oluşan uygulama.

## Özellikler

- **Admin paneli** — duyuru, etkinlik, sınav ve veli hesabı yönetimi (`/admin`)
- **Veli portalı** — her veliye özel bağlantı (`/veli/[slug]`) üzerinden sınav sonuçları, ders bazlı kırılım ve el çizimi tarzı SVG ilerleme grafiği
- **İki ayrı yetki modeli** — ortak admin şifresi ile korunan yönetici erişimi, veli için slug + şifre tabanlı bireysel erişim
- **Dosya yükleme** — duyuru/etkinlik görselleri Supabase Storage üzerinde tutulur
- **Rate limiting** — veritabanı destekli giriş denemesi sınırlama (serverless ortamda kalıcı çalışır)

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | Next.js 16 (App Router), React 19, TypeScript |
| Veri & Depolama | Supabase (Postgres + Storage) |
| Kimlik | Elle yazılmış HMAC-SHA256 imzalı oturum + scrypt şifre hash'leme (harici kütüphane kullanılmaz) |
| Test | Vitest |

Tüm veritabanı erişimi sunucu tarafında `service role` ile yapılır; RLS her tabloda açık olduğundan tarayıcı Supabase'e doğrudan erişemez.

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` içine doldurulacak değişkenler: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` (≥24 karakter), `NEXT_PUBLIC_SITE_URL`.

Veritabanı şeması için `supabase/schema.sql` dosyasını Supabase SQL Editor'de çalıştırın.

```bash
npm run dev     # geliştirme sunucusu (Turbopack)
```

## Komutlar

```bash
npm run dev      # geliştirme sunucusu
npm run build    # production derlemesi
npm run lint     # eslint .
npm test         # vitest run
```

## Canlı Demo

[kids-academy-phi.vercel.app](https://kids-academy-phi.vercel.app/)
