import crypto from "node:crypto";

export const codigo4 = () => String(crypto.randomInt(0, 10000)).padStart(4, "0");
export const token = (n = 16) => crypto.randomBytes(n).toString("base64url");

/** Normaliza a solo dígitos con prefijo 54 para links wa.me. */
export function normalizarTelefono(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  // Celulares argentinos en WhatsApp: 54 9 + área + número. Asumimos celular si no trae país.
  if (!d.startsWith("54")) d = "549" + d;
  else if (d.length === 12) d = "549" + d.slice(2);
  return d;
}

export const waLink = (tel: string, texto: string) =>
  `https://wa.me/${normalizarTelefono(tel)}?text=${encodeURIComponent(texto)}`;

export const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const CONSENTIMIENTO =
  "Acepto que el local guarde mi nombre y WhatsApp para darme beneficios del club. " +
  "Puedo pedir la baja cuando quiera (Ley 25.326).";
export const CONSENTIMIENTO_WA = "Quiero recibir novedades y beneficios por WhatsApp.";
