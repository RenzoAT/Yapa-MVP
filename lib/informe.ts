import { q, one } from "./db";
import { TZ } from "./tiempo";

/** Informe de un mes (YYYY-MM) en hora argentina. */
export async function informeMes(localId: string, mes: string) {
  const desde = `${mes}-01`;
  const rango = `(($2::date) AT TIME ZONE '${TZ}') AND ((($2::date) + interval '1 month') AT TIME ZONE '${TZ}')`;
  const p = [localId, desde];

  const k = await one<{ nuevos: number; total: number; canjes: number; canjes_vuelta: number; volvieron: number; con_wa: number }>(
    `SELECT
       (SELECT count(*)::int FROM miembros WHERE local_id=$1 AND created_at >= ($2::date AT TIME ZONE '${TZ}')
          AND created_at < (($2::date + interval '1 month') AT TIME ZONE '${TZ}')) AS nuevos,
       (SELECT count(*)::int FROM miembros WHERE local_id=$1 AND baja_at IS NULL) AS total,
       (SELECT count(*)::int FROM miembros WHERE local_id=$1 AND baja_at IS NULL AND acepta_whatsapp) AS con_wa,
       (SELECT count(*)::int FROM cupones WHERE local_id=$1 AND canjeado_at BETWEEN ${rango}) AS canjes,
       (SELECT count(*)::int FROM cupones c JOIN beneficios b ON b.id=c.beneficio_id
          WHERE c.local_id=$1 AND NOT b.es_bienvenida AND c.canjeado_at BETWEEN ${rango}) AS canjes_vuelta,
       (SELECT count(DISTINCT c.miembro_id)::int FROM cupones c JOIN miembros m ON m.id=c.miembro_id
          WHERE c.local_id=$1 AND c.canjeado_at BETWEEN ${rango}
            AND (c.canjeado_at AT TIME ZONE '${TZ}')::date > (m.created_at AT TIME ZONE '${TZ}')::date) AS volvieron`,
    p,
  );

  const porDia = await q<{ dia: number; canjes: number }>(
    `SELECT extract(dow FROM canjeado_at AT TIME ZONE '${TZ}')::int AS dia, count(*)::int AS canjes
       FROM cupones WHERE local_id=$1 AND canjeado_at BETWEEN ${rango} GROUP BY 1 ORDER BY 1`,
    p,
  );
  const porBeneficio = await q<{ titulo: string; canjes: number }>(
    `SELECT b.titulo, count(c.canjeado_at)::int AS canjes
       FROM beneficios b LEFT JOIN cupones c ON c.beneficio_id=b.id AND c.canjeado_at BETWEEN ${rango}
      WHERE b.local_id=$1 GROUP BY b.id, b.titulo ORDER BY canjes DESC`,
    p,
  );
  return { ...k!, porDia, porBeneficio };
}

export function mesActualAR() {
  const [d, m, y] = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date()).split("/");
  return `${y}-${m}`;
}
