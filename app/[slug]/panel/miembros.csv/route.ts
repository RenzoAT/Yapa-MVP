import { q } from "@/lib/db";
import { getLocal } from "@/lib/datos";
import { esDueno } from "@/lib/auth";
import { fechaAR } from "@/lib/tiempo";

const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const local = await getLocal(slug);
  if (!local || !(await esDueno(local))) return new Response("No autorizado", { status: 401 });
  const filas = await q(
    `SELECT m.nombre, m.telefono, m.acepta_whatsapp, m.created_at, m.consentimiento_at,
            count(c.canjeado_at) AS canjes, max(c.canjeado_at) AS ultimo_canje
       FROM miembros m LEFT JOIN cupones c ON c.miembro_id = m.id
      WHERE m.local_id = $1 AND m.baja_at IS NULL
      GROUP BY m.id ORDER BY m.created_at`,
    [local.id],
  );
  const cab = ["nombre", "whatsapp", "acepta_novedades", "alta", "consentimiento", "canjes", "ultimo_canje"];
  const csv = [cab.join(","), ...filas.map((f) =>
      [f.nombre, "+" + f.telefono, f.acepta_whatsapp ? "Sí" : "No", fechaAR(f.created_at), fechaAR(f.consentimiento_at),
       f.canjes, f.ultimo_canje ? fechaAR(f.ultimo_canje) : ""].map(celda).join(","))].join("\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="miembros-${slug}.csv"`,
    },
  });
}
