"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, q } from "@/lib/db";
import { token } from "@/lib/util";

const COOKIE = "yapa_admin";
const huella = (s: string) => crypto.createHash("sha256").update("admin:" + s).digest("base64url");

export async function esAdmin() {
  const k = process.env.ADMIN_KEY;
  return !!k && (await cookies()).get(COOKIE)?.value === huella(k);
}

export async function loginAdmin(form: FormData) {
  const k = process.env.ADMIN_KEY;
  if (k && String(form.get("clave")) === k) {
    (await cookies()).set(COOKIE, huella(k), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  }
  redirect("/admin");
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export async function crearLocal(form: FormData) {
  if (!(await esAdmin())) redirect("/admin");
  const nombre = String(form.get("nombre") || "").trim();
  const slug = slugify(String(form.get("slug") || "") || nombre);
  if (!nombre || !slug || slug === "admin") redirect("/admin?error=datos");
  const existe = await one("SELECT 1 FROM locales WHERE slug=$1", [slug]);
  if (existe) redirect("/admin?error=slug");
  const local = await one<{ id: string }>(
    `INSERT INTO locales (slug, nombre, pin_mozo, clave_panel) VALUES ($1,$2,$3,$4) RETURNING id`,
    [slug, nombre, String(crypto.randomInt(1000, 10000)), token(12)],
  );
  if (form.get("demo") === "on") {
    await q(`UPDATE locales SET descripcion=$2, direccion=$3, horarios=$4, instagram=$5 WHERE id=$1`, [
      local!.id, "Café de especialidad y pastelería casera en el barrio desde 2019.",
      "Av. Corrientes 1234, CABA", "Lun a Vie 8 a 20 hs\nSáb y Dom 9 a 21 hs", "@cafedemo",
    ]);
    await q(
      `INSERT INTO beneficios (local_id, titulo, descripcion, tipo, es_bienvenida) VALUES ($1,'Café de regalo','En tu próxima visita','regalo',true)`,
      [local!.id],
    );
    await q(
      `INSERT INTO beneficios (local_id, titulo, descripcion, tipo, dias, hora_desde, hora_hasta)
       VALUES ($1,'2x1 en medialunas','Con cualquier café','2x1','{1,2,3}',900,1140),
              ($1,'15% en tortas enteras','Para llevar','porcentaje','{0,1,2,3,4,5,6}',0,1440)`,
      [local!.id],
    );
  }
  redirect(`/admin?creado=${slug}`);
}
