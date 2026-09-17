export function phoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function telUrl(phone) {
  const digits = phoneDigits(phone);
  return digits ? `tel:${digits}` : null;
}

export function whatsappUrl(phone) {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}
