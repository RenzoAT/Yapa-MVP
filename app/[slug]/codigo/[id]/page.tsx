import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { cookieMiembro, getLocal } from "@/lib/datos";
import { fechaAR } from "@/lib/tiempo";
import { waLink } from "@/lib/util";
import { Pie } from "../../../Marca";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ nuevo?: string }> };

export default async function Codigo({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { nuevo } = await searchParams;
  const local = await getLocal(slug);
  if (!local || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const miembroId = (await cookies()).get(cookieMiembro(local.id))?.value;
  const c = await one<{ codigo: string; vence_at: string; canjeado_at: string | null; titulo: string; nombre: string; es_bienvenida: boolean }>(
    `SELECT c.codigo, c.vence_at, c.canjeado_at, b.titulo, b.es_bienvenida, m.nombre
       FROM cupones c JOIN beneficios b ON b.id = c.beneficio_id JOIN miembros m ON m.id = c.miembro_id
      WHERE c.id = $1 AND c.local_id = $2 AND c.miembro_id = $3`,
    [id, local.id, miembroId ?? "00000000-0000-0000-0000-000000000000"],
  );
  if (!c) notFound();
  const vencido = new Date(c.vence_at) < new Date();

  return (
    <main className="contenedor" style={{ textAlign: "center" }}>
      {nuevo && <div className="aviso ok">¡Ya sos parte del club de {local.nombre}!</div>}
      <p className="suave" style={{ marginBottom: 0 }}>{local.nombre}</p>
      <h1>{c.titulo}</h1>
      {c.canjeado_at ? (
        <div className="aviso ok">Usado el {fechaAR(c.canjeado_at)}. ¡Que lo disfrutes!</div>
      ) : vencido ? (
        <div className="aviso error">Este código venció. Pedí uno nuevo desde los beneficios.</div>
      ) : (
        <>
          <p>Mostrale este código al mozo:</p>
          <div className="codigo" aria-label={`Código ${c.codigo.split("").join(" ")}`}>{c.codigo}</div>
          <p className="suave">Vale hasta el {fechaAR(c.vence_at)}</p>
          {c.es_bienvenida && local.whatsapp && (
            <a className="btn bloque" href={waLink(local.whatsapp, `¡Hola! Soy ${c.nombre}, me sumé al club de ${local.nombre}. Mi código de bienvenida es ${c.codigo}.`)}>
              Guardarlo en WhatsApp
            </a>
          )}
        </>
      )}
      <p style={{ marginTop: 20 }}><a href={`/${slug}#beneficios`}>Ver todos los beneficios</a></p>
      <Pie />
    </main>
  );
}
