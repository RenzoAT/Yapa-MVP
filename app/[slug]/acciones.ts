"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { cookieMiembro, getLocal, getMiembro, pedirCupon } from "@/lib/datos";
import type { Beneficio, Miembro } from "@/lib/tipos";
import { CONSENTIMIENTO, CONSENTIMIENTO_WA, normalizarTelefono } from "@/lib/util";

export async function sumarse(slug: string, form: FormData) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  const nombre = String(form.get("nombre") || "").trim().slice(0, 80);
  const telRaw = String(form.get("telefono") || "");
  const tel = normalizarTelefono(telRaw);
  if (!nombre || tel.length < 10 || form.get("acepta") !== "on") {
    redirect(`/${slug}?error=datos#sumate`);
  }
  const aceptaWa = form.get("acepta_wa") === "on";
  const texto = CONSENTIMIENTO + (aceptaWa ? " " + CONSENTIMIENTO_WA : "");

  const m = await one<Miembro>(
    `INSERT INTO miembros (local_id, nombre, telefono, acepta_whatsapp, consentimiento_texto)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (local_id, telefono) DO UPDATE
       SET baja_at = NULL, nombre = EXCLUDED.nombre, acepta_whatsapp = EXCLUDED.acepta_whatsapp,
           consentimiento_texto = EXCLUDED.consentimiento_texto, consentimiento_at = now()
     RETURNING *`,
    [local.id, nombre, tel, aceptaWa, texto],
  );
  (await cookies()).set(cookieMiembro(local.id), m!.id, {
    httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/",
  });

  const bienvenida = await one<Beneficio>(
    "SELECT * FROM beneficios WHERE local_id = $1 AND es_bienvenida AND activo ORDER BY created_at LIMIT 1",
    [local.id],
  );
  if (bienvenida) {
    const r = await pedirCupon(m!, bienvenida);
    if (r.ok) redirect(`/${slug}/codigo/${r.cupon.id}?nuevo=1`);
  }
  redirect(`/${slug}?bienvenido=1`);
}

export async function usarBeneficio(slug: string, beneficioId: string) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  const miembro = await getMiembro(local.id, (await cookies()).get(cookieMiembro(local.id))?.value);
  if (!miembro) redirect(`/${slug}#sumate`);
  const b = await one<Beneficio>("SELECT * FROM beneficios WHERE id = $1 AND local_id = $2 AND activo", [beneficioId, local.id]);
  if (!b) redirect(`/${slug}`);
  const r = await pedirCupon(miembro, b);
  if (!r.ok) redirect(`/${slug}?aviso=${encodeURIComponent(r.motivo)}#beneficios`);
  redirect(`/${slug}/codigo/${r.cupon.id}`);
}

export async function darseDeBaja(slug: string) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  const jar = await cookies();
  const id = jar.get(cookieMiembro(local.id))?.value;
  const miembro = await getMiembro(local.id, id);
  if (miembro) await one("UPDATE miembros SET baja_at = now(), acepta_whatsapp = false WHERE id = $1", [miembro.id]);
  jar.delete(cookieMiembro(local.id));
  redirect(`/${slug}?baja=1`);
}
