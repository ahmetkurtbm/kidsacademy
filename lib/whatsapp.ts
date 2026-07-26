export function normalizePhone(input: unknown): string {
  return String(input || "").replace(/[^0-9]/g, "");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
