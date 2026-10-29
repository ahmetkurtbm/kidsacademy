// Veritabanı tablolarını ve etkinlik fotoğraflarını backups/<tarih>/ klasörüne indirir.
// Çalıştırma: npm run backup   (bağlantı bilgileri .env veya .env.local dosyasından okunur)
// Geri yükleme adımları için docs/YEDEKLEME.md dosyasına bakın.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Sıra önemlidir: geri yüklerken bağımlı tablolar (exams → parent_accounts) sonra gelir.
const TABLES = ["parent_accounts", "exams", "exam_subjects", "events", "announcements", "admin_users"];
const BUCKET = "event-images";
const PAGE = 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY bulunamadı (.env dosyasını kontrol edin).");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
const dir = join("backups", stamp);
await mkdir(join(dir, BUCKET), { recursive: true });

const summary = {};
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
    if (error) {
      // Henüz migration'ı çalıştırılmamış tablo yedeği durdurmaz.
      console.warn(`! ${table}: ${error.message}`);
      break;
    }
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  await writeFile(join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
  summary[table] = rows.length;
  console.log(`✓ ${table}: ${rows.length} kayıt`);
}

let files = 0;
const { data: objects, error: listError } = await db.storage.from(BUCKET).list("", { limit: 10000 });
if (listError) console.warn(`! ${BUCKET}: ${listError.message}`);
for (const object of objects ?? []) {
  if (!object.id) continue; // klasör
  const { data, error } = await db.storage.from(BUCKET).download(object.name);
  if (error) { console.warn(`! ${object.name}: ${error.message}`); continue; }
  await writeFile(join(dir, BUCKET, object.name), Buffer.from(await data.arrayBuffer()));
  files += 1;
}
summary[BUCKET] = files;
console.log(`✓ ${BUCKET}: ${files} dosya`);

await writeFile(join(dir, "ozet.json"), JSON.stringify({ createdAt: new Date().toISOString(), summary }, null, 2));
console.log(`\nYedek hazır: ${dir}\nBu klasör kişisel veri içerir; GitHub'a yüklemeyin, güvenli bir yere (şifreli disk, kurumun bulut hesabı) kopyalayın.`);
