import { q, one } from "./db";
import type { Beneficio, Cupon, Local, Miembro } from "./tipos";
import { vigenteAhora, TZ } from "./tiempo";
import { codigo4 } from "./util";

export const getLocal = (slug: string) => one<Local>("SELECT * FROM locales WHERE slug = $1", [slug]);

export const getBeneficios = (localId: string, soloActivos = true) =>
  q<Beneficio>(
    `SELECT * FROM beneficios WHERE local_id = $1 ${soloActivos ? "AND activo" : ""}
     ORDER BY es_bienvenida DESC, created_at`,
    [localId],
  );

export const getMiembro = (localId: string, id: string | undefined) =>
  id && /^[0-9a-f-]{36}$/.test(id)
    ? one<Miembro>("SELECT * FROM miembros WHERE id = $1 AND local_id = $2 AND baja_at IS NULL", [id, localId])
    : Promise.resolve(null);

export const cookieMiembro = (localId: string) => `yapa_m_${localId.slice(0, 8)}`;

const VIGENCIA_BIENVENIDA_DIAS = 30;
const VIGENCIA_CUPON_HORAS = 2;

type ResultadoCupon = { ok: true; cupon: Cupon } | { ok: false; motivo: string };

/** Devuelve el cupón activo del miembro para ese beneficio, o crea uno. */
export async function pedirCupon(miembro: Miembro, beneficio: Beneficio): Promise<ResultadoCupon> {
  if (beneficio.local_id !== miembro.local_id) return { ok: false, motivo: "Beneficio de otro local." };

  const existente = await one<Cupon>(
    `SELECT * FROM cupones WHERE miembro_id = $1 AND beneficio_id = $2
       AND canjeado_at IS NULL AND vence_at > now() ORDER BY created_at DESC LIMIT 1`,
    [miembro.id, beneficio.id],
  );
  if (existente) return { ok: true, cupon: existente };

  if (beneficio.es_bienvenida) {
    const usado = await one("SELECT 1 FROM cupones WHERE miembro_id = $1 AND beneficio_id = $2 AND canjeado_at IS NOT NULL", [miembro.id, beneficio.id]);
    if (usado) return { ok: false, motivo: "El regalo de bienvenida ya lo usaste." };
  } else {
    if (!vigenteAhora(beneficio)) return { ok: false, motivo: "Este beneficio no está disponible en este horario." };
    const hoy = await one(
      `SELECT 1 FROM cupones WHERE miembro_id = $1 AND beneficio_id = $2 AND canjeado_at IS NOT NULL
         AND (canjeado_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`,
      [miembro.id, beneficio.id],
    );
    if (hoy) return { ok: false, motivo: "Ya usaste este beneficio hoy. ¡Te esperamos otro día!" };
  }

  const vence = beneficio.es_bienvenida
    ? `now() + interval '${VIGENCIA_BIENVENIDA_DIAS} days'`
    : `now() + interval '${VIGENCIA_CUPON_HORAS} hours'`;

  // Código de 4 dígitos único entre los cupones vivos del local.
  for (let i = 0; i < 20; i++) {
    const codigo = codigo4();
    const choque = await one(
      "SELECT 1 FROM cupones WHERE local_id = $1 AND codigo = $2 AND canjeado_at IS NULL AND vence_at > now()",
      [miembro.local_id, codigo],
    );
    if (choque) continue;
    const cupon = await one<Cupon>(
      `INSERT INTO cupones (local_id, beneficio_id, miembro_id, codigo, vence_at)
       VALUES ($1, $2, $3, $4, ${vence}) RETURNING *`,
      [miembro.local_id, beneficio.id, miembro.id, codigo],
    );
    return { ok: true, cupon: cupon! };
  }
  return { ok: false, motivo: "No pudimos generar un código. Probá de nuevo." };
}

export type ResultadoCanje =
  | { ok: true; beneficio: string; miembro: string }
  | { ok: false; motivo: string };

export async function canjear(localId: string, codigo: string): Promise<ResultadoCanje> {
  const c = await one<Cupon & { titulo: string; nombre: string } & Pick<Beneficio, "dias" | "hora_desde" | "hora_hasta" | "activo" | "es_bienvenida">>(
    `SELECT c.*, b.titulo, b.dias, b.hora_desde, b.hora_hasta, b.activo, b.es_bienvenida, m.nombre
       FROM cupones c JOIN beneficios b ON b.id = c.beneficio_id JOIN miembros m ON m.id = c.miembro_id
      WHERE c.local_id = $1 AND c.codigo = $2 AND c.canjeado_at IS NULL
      ORDER BY c.created_at DESC LIMIT 1`,
    [localId, codigo],
  );
  if (!c) return { ok: false, motivo: "Código inexistente o ya usado." };
  if (new Date(c.vence_at) < new Date()) return { ok: false, motivo: "El código venció. Que pida uno nuevo desde su celular." };
  if (!c.activo) return { ok: false, motivo: "El beneficio está pausado." };
  if (!c.es_bienvenida && !vigenteAhora(c)) return { ok: false, motivo: "Este beneficio no vale en este horario." };
  const upd = await q("UPDATE cupones SET canjeado_at = now() WHERE id = $1 AND canjeado_at IS NULL RETURNING id", [c.id]);
  if (!upd.length) return { ok: false, motivo: "Código ya usado." };
  return { ok: true, beneficio: c.titulo, miembro: c.nombre };
}
