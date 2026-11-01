import type { Beneficio } from "./tipos";

export const TZ = "America/Argentina/Buenos_Aires";
export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIA_IDX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Día de la semana (0=dom) y minuto del día en hora argentina. */
export function ahoraAR(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { dia: DIA_IDX[get("weekday")], minuto: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function vigenteAhora(b: Pick<Beneficio, "dias" | "hora_desde" | "hora_hasta" | "activo">, d = new Date()) {
  if (!b.activo) return false;
  const { dia, minuto } = ahoraAR(d);
  return b.dias.includes(dia) && minuto >= b.hora_desde && minuto < b.hora_hasta;
}

export const hhmm = (m: number) =>
  m >= 1440 ? "24:00" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const aMinutos = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function describirCuando(b: Pick<Beneficio, "dias" | "hora_desde" | "hora_hasta">) {
  const dias = b.dias.length === 7 ? "Todos los días" : [...b.dias].sort().map((d) => DIAS[d]).join(", ");
  const horas = b.hora_desde === 0 && b.hora_hasta >= 1440 ? "" : ` · ${hhmm(b.hora_desde)} a ${hhmm(b.hora_hasta)}`;
  return dias + horas;
}

export const fechaAR = (iso: string | Date) =>
  new Intl.DateTimeFormat("es-AR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
