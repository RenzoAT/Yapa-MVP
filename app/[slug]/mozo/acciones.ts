"use server";

import { redirect } from "next/navigation";
import { getLocal, canjear, type ResultadoCanje } from "@/lib/datos";
import { entrarMozo, esMozo } from "@/lib/auth";

export async function loginMozo(slug: string, form: FormData) {
  const local = await getLocal(slug);
  if (!local) redirect("/");
  const ok = await entrarMozo(local, String(form.get("pin") || ""));
  redirect(`/${slug}/mozo${ok ? "" : "?error=1"}`);
}

export async function canjearCodigo(slug: string, _prev: ResultadoCanje | null, form: FormData): Promise<ResultadoCanje> {
  const local = await getLocal(slug);
  if (!local || !(await esMozo(local))) return { ok: false, motivo: "Sesión vencida. Volvé a entrar con el PIN." };
  const codigo = String(form.get("codigo") || "").replace(/\D/g, "");
  if (codigo.length !== 4) return { ok: false, motivo: "El código tiene 4 números." };
  return canjear(local.id, codigo);
}
