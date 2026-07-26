import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";
import "./portal.css";
import "./topbar.css";
import "./home-v2.css";
import "./admin-events.css";
import "./home-events.css";
import "./results-enhanced.css";
import "./logo.css";
import "./content-features.css";

const title = "Kids Academy | Eğitim & Aktivite Merkezi";
const description = "Osmaniye'de ödev takibi, konu anlatımı, okul öncesi etkinlik, yaz okulu ve atölye programları.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "/kids-academy-logo.jpeg",
    shortcut: "/kids-academy-logo.jpeg",
    apple: "/kids-academy-logo.jpeg",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Kids Academy",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/hero-academy.png", width: 1717, height: 916, alt: "Kids Academy ödev ve etkinlik alanı" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero-academy.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
