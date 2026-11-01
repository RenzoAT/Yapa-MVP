"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q } from "@/lib/db";
import { getLocal } from "@/lib/datos";
import { entrarDueno, esDueno } from "@/lib/auth";
import { aMinutos } from "@/lib/tiempo";

const TIPOS = ["porcentaje", "2x1", "regalo", "otro"];

async function localDueno(slug: string) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  if (!(await esDueno(local))) redirect(`/${slug}/panel`);
  return local;
}

export async function loginDueno(slug: string, form: FormData) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  const ok = await entrarDueno(local, String(form.get("clave") || ""));
  redirect(`/${slug}/panel${ok ? "" : "?error=1"}`);
}

export async function guardarBeneficio(slug: string, form: FormData) {
  const local = await localDueno(slug);
  const id = String(form.get("id") || "");
  const titulo = String(form.get("titulo") || "").trim().slice(0, 80);
  if (!titulo) redirect(`/${slug}/panel?error=titulo`);
  const tipo = TIPOS.includes(String(form.get("tipo"))) ? String(form.get("tipo")) : "otro";
  const dias = form.getAll("dias").map(Number).filter((d) => d >= 0 && d <= 6);
  const desde = aMinutos(String(form.get("desde") || "00:00"));
  let hasta = aMinutos(String(form.get("hasta") || "00:00"));
  if (hasta <= desde) hasta = 1440; // "hasta 00:00" = hasta el cierre del día
  const vals = [
    titulo, String(form.get("descripcion") || "").slice(0, 300), tipo,
    dias.length ? dias : [0, 1, 2, 3, 4, 5, 6], desde, hasta, form.get("es_bienvenida") === "on",
  ];
  if (id) {
    await q(
      `UPDATE beneficios SET titulo=$1, descripcion=$2, tipo=$3, dias=$4, hora_desde=$5, hora_hasta=$6, es_bienvenida=$7
        WHERE id=$8 AND local_id=$9`,
      [...vals, id, local.id],
    );
  } else {
    await q(
      `INSERT INTO beneficios (titulo, descripcion, tipo, dias, hora_desde, hora_hasta, es_bienvenida, local_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [...vals, local.id],
    );
  }
  revalidatePath(`/${slug}`);
  redirect(`/${slug}/panel?ok=1`);
}

export async function alternarBeneficio(slug: string, id: string) {
  const local = await localDueno(slug);
  await q("UPDATE beneficios SET activo = NOT activo WHERE id=$1 AND local_id=$2", [id, local.id]);
  revalidatePath(`/${slug}`);
  redirect(`/${slug}/panel`);
}

export async function guardarLocal(slug: string, form: FormData) {
  const local = await localDueno(slug);
  const s = (k: string, max = 300) => String(form.get(k) || "").trim().slice(0, max);
  const fotos = s("fotos", 2000).split(/\s+/).filter((u) => /^https?:\/\//.test(u)).slice(0, 8);
  const pin = s("pin_mozo", 8).replace(/\D/g, "");
  await q(
    `UPDATE locales SET nombre=$1, descripcion=$2, direccion=$3, horarios=$4, instagram=$5, carta_url=$6,
       whatsapp=$7, fotos=$8, pin_mozo=$9 WHERE id=$10`,
    [s("nombre", 80) || local.nombre, s("descripcion", 600), s("direccion"), s("horarios", 400), s("instagram", 60),
     s("carta_url"), s("whatsapp", 30), fotos, pin.length >= 4 ? pin : local.pin_mozo, local.id],
  );
  revalidatePath(`/${slug}`);
  redirect(`/${slug}/panel?tab=local&ok=1`);
}
