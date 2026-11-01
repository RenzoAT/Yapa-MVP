import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Local } from "./tipos";

const huella = (s: string) => crypto.createHash("sha256").update(s).digest("base64url").slice(0, 22);
const igual = (a: string, b: string) =>
  a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const nombreMozo = (l: Local) => `yapa_mozo_${l.id.slice(0, 8)}`;
const nombrePanel = (l: Local) => `yapa_panel_${l.id.slice(0, 8)}`;
const opciones = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function esMozo(l: Local) {
  const v = (await cookies()).get(nombreMozo(l))?.value ?? "";
  return igual(v, huella("mozo:" + l.pin_mozo)) || (await esDueno(l));
}
export async function esDueno(l: Local) {
  const v = (await cookies()).get(nombrePanel(l))?.value ?? "";
  return igual(v, huella("panel:" + l.clave_panel));
}
export async function entrarMozo(l: Local, pin: string) {
  if (!igual(pin, l.pin_mozo)) return false;
  (await cookies()).set(nombreMozo(l), huella("mozo:" + l.pin_mozo), opciones);
  return true;
}
export async function entrarDueno(l: Local, clave: string) {
  if (!igual(clave, l.clave_panel)) return false;
  (await cookies()).set(nombrePanel(l), huella("panel:" + l.clave_panel), opciones);
  return true;
}
